import {
  ZONE_CHAT_WS_CONFIG,
  buildZoneChatWebSocketUrl,
  isZoneChatWebSocketEnabled,
} from '../../constants/chat/zoneChatConfig';
import type { ParsedChatRoomStatusPayload } from '../../types/chatApi';
import { isChatStatusDestination, parseChatRoomStatusBody } from '../../types/chatApi';
import { logZoneChat } from '../../utils/chat/zoneChatLogger';
import { isWebSocketAuthHandshakeFailure } from '../../utils/chat/zoneChatConnectionStatus';
import { openZoneChatWebSocket } from '../../utils/chat/openZoneChatWebSocket';
import {
  decodeStompFrames,
  decodeWebSocketPayload,
  encodeStompFrameBytes,
  isBenignStompShutdownError,
  isStompHeartbeat,
  isStompSessionAlreadyExistsError,
  parseStompClientHeartbeatMs,
  type StompFrame,
} from './stompFrame';

const STATUS_SUBSCRIBE_DESTINATION = ZONE_CHAT_WS_CONFIG.stomp.roomStatus;

type StatusListener = (status: ParsedChatRoomStatusPayload) => void;

/**
 * 목록·홈용 실시간 인원 허브 — 방별 status 채널만 단일 WebSocket 으로 멀티 구독.
 * 구독 방이 비거나 suspend 되면 연결을 닫습니다.
 */
class ZoneChatRoomStatusHub {
  private listeners = new Set<StatusListener>();
  private desiredRoomIds = new Set<string>();
  private subscriptionIds = new Map<string, string>();
  private subscribedRoomIds = new Set<string>();
  private accessToken: string | null = null;
  private ws: WebSocket | null = null;
  private stompConnected = false;
  private intentionalClose = false;
  private suspended = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatBytes: Uint8Array | null = null;
  private nextSubscriptionKey = 0;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closeWaiters: Array<() => void> = [];
  private socketGeneration = 0;

  addListener(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 목록 화면이 원하는 status 구독 방 집합을 설정합니다.
   * 동일 집합이면 no-op 이라 불필요한 disconnect/connect 를 막습니다.
   */
  setDesiredRooms(roomIds: string[], accessToken: string): void {
    if (!isZoneChatWebSocketEnabled() || !accessToken) {
      this.desiredRoomIds.clear();
      this.accessToken = null;
      void this.disconnect();
      return;
    }

    const uniqueRoomIds = [...new Set(roomIds.filter(Boolean))].sort();
    const nextKey = uniqueRoomIds.join('|');
    const prevKey = [...this.desiredRoomIds].sort().join('|');
    const roomsUnchanged = nextKey === prevKey;
    const tokenUnchanged = this.accessToken === accessToken;

    this.desiredRoomIds = new Set(uniqueRoomIds);
    this.accessToken = accessToken;

    if (this.suspended) {
      return;
    }

    if (uniqueRoomIds.length === 0) {
      void this.disconnect();
      return;
    }

    if (roomsUnchanged && tokenUnchanged && this.stompConnected) {
      this.syncSubscriptions();
      return;
    }

    void this.ensureConnected();
  }

  /** 채팅방 STOMP 세션과 충돌하지 않도록 hub 를 잠시 내립니다. */
  async suspend(): Promise<void> {
    this.suspended = true;
    this.clearReconnectTimer();
    await this.disconnect();
  }

  /** 채팅 세션이 끝난 뒤 status hub 를 다시 켭니다. */
  resume(): void {
    if (!this.suspended) {
      if (this.desiredRoomIds.size > 0 && this.accessToken) {
        void this.ensureConnected();
      }
      return;
    }
    this.suspended = false;
    if (this.desiredRoomIds.size > 0 && this.accessToken) {
      void this.ensureConnected();
    }
  }

  isSuspended(): boolean {
    return this.suspended;
  }

  /** @deprecated store 가 setDesiredRooms 로 이전. 호환용. */
  retainRooms(roomIds: string[], accessToken: string): () => void {
    this.setDesiredRooms(roomIds, accessToken);
    return () => {
      this.setDesiredRooms([], accessToken);
    };
  }

  private getActiveRoomIds(): string[] {
    return [...this.desiredRoomIds];
  }

  private subscriptionIdFor(roomId: string): string {
    const existing = this.subscriptionIds.get(roomId);
    if (existing) {
      return existing;
    }
    this.nextSubscriptionKey += 1;
    const id = `sub-status-${this.nextSubscriptionKey}`;
    this.subscriptionIds.set(roomId, id);
    return id;
  }

  private async ensureConnected(): Promise<void> {
    if (this.suspended || !this.accessToken || this.desiredRoomIds.size === 0) {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.stompConnected) {
        this.syncSubscriptions();
      }
      return;
    }

    await this.waitForSocketClosed();
    if (this.suspended || !this.accessToken || this.desiredRoomIds.size === 0) {
      return;
    }

    this.intentionalClose = false;
    this.openSocket();
  }

  private waitForSocketClosed(): Promise<void> {
    if (!this.ws) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.closeWaiters.push(resolve);
    });
  }

  private resolveCloseWaiters(): void {
    const waiters = this.closeWaiters;
    this.closeWaiters = [];
    for (const resolve of waiters) {
      resolve();
    }
  }

  private disconnect(): Promise<void> {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.clearDisconnectTimer();

    const ws = this.ws;
    if (!ws) {
      this.stompConnected = false;
      this.subscriptionIds.clear();
      this.subscribedRoomIds.clear();
      this.resolveCloseWaiters();
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.closeWaiters.push(resolve);

      const finishClose = () => {
        if (this.ws === ws) {
          try {
            ws.close();
          } catch {
            /* ignore */
          }
          this.ws = null;
        }
        this.stompConnected = false;
        this.subscriptionIds.clear();
        this.subscribedRoomIds.clear();
        this.resolveCloseWaiters();
      };

      if (this.stompConnected && ws.readyState === WebSocket.OPEN) {
        this.sendFrame({ command: 'DISCONNECT', headers: {}, body: '' });
        this.stompConnected = false;
        this.disconnectTimer = setTimeout(finishClose, ZONE_CHAT_WS_CONFIG.gracefulDisconnectMs);
      } else {
        finishClose();
      }
    });
  }

  private openSocket(): void {
    if (this.suspended || !this.accessToken || this.desiredRoomIds.size === 0) {
      return;
    }

    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.clearDisconnectTimer();
    this.stompConnected = false;
    this.subscriptionIds.clear();
    this.subscribedRoomIds.clear();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }

    const generation = ++this.socketGeneration;
    const url = buildZoneChatWebSocketUrl(this.accessToken);
    logZoneChat('status-hub.connect', 'Opening status WebSocket', {
      detail: { rooms: this.getActiveRoomIds().length, url: url.split('?')[0] },
    });

    try {
      this.ws = openZoneChatWebSocket(url, this.accessToken);
    } catch (error) {
      this.handleConnectFailure(error);
      return;
    }

    this.ws.onopen = () => {
      if (generation !== this.socketGeneration || this.suspended) {
        return;
      }
      this.sendConnectFrame();
    };

    this.ws.onmessage = event => {
      if (generation !== this.socketGeneration) {
        return;
      }
      const raw = decodeWebSocketPayload(event.data);
      if (!raw || isStompHeartbeat(raw)) {
        return;
      }

      for (const frame of decodeStompFrames(raw)) {
        this.handleFrame(frame);
      }
    };

    this.ws.onerror = () => {
      if (this.intentionalClose || generation !== this.socketGeneration) {
        return;
      }
      logZoneChat('status-hub.ws.error', 'WebSocket error', { level: 'error' });
    };

    this.ws.onclose = event => {
      if (generation !== this.socketGeneration) {
        return;
      }
      this.clearHeartbeatTimer();
      this.ws = null;
      this.stompConnected = false;
      this.subscriptionIds.clear();
      this.subscribedRoomIds.clear();
      this.resolveCloseWaiters();

      if (this.intentionalClose || this.suspended) {
        return;
      }

      if (isWebSocketAuthHandshakeFailure(event.reason)) {
        logZoneChat('status-hub.ws.auth', 'WebSocket handshake rejected (401/403)', {
          level: 'error',
          detail: { reason: event.reason },
        });
        return;
      }

      this.scheduleReconnect();
    };
  }

  private sendConnectFrame(): void {
    const headers: Record<string, string> = {
      'accept-version': '1.2',
      'heart-beat': '0,0',
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    this.sendFrame({ command: 'CONNECT', headers, body: '' });
  }

  private handleFrame(frame: StompFrame): void {
    const command = frame.command.trim().toUpperCase();
    switch (command) {
      case 'CONNECTED':
        this.onStompConnected(frame);
        break;
      case 'MESSAGE':
        this.onStompMessage(frame);
        break;
      case 'ERROR':
        this.onStompError(frame);
        break;
      default:
        break;
    }
  }

  private onStompConnected(frame: StompFrame): void {
    this.stompConnected = true;
    this.reconnectAttempt = 0;
    this.startHeartbeat(frame.headers['heart-beat']);
    this.syncSubscriptions();
    logZoneChat('status-hub.connected', 'STOMP connected, status subscriptions synced', {
      detail: { rooms: this.getActiveRoomIds().length },
    });
  }

  private syncSubscriptions(): void {
    if (!this.stompConnected || this.suspended) {
      return;
    }

    for (const roomId of [...this.subscribedRoomIds]) {
      if (!this.desiredRoomIds.has(roomId)) {
        this.unsubscribeRoom(roomId);
      }
    }

    for (const roomId of this.getActiveRoomIds()) {
      if (this.subscribedRoomIds.has(roomId)) {
        continue;
      }
      const id = this.subscriptionIdFor(roomId);
      this.sendFrame({
        command: 'SUBSCRIBE',
        headers: {
          id,
          destination: STATUS_SUBSCRIBE_DESTINATION(roomId),
        },
        body: '',
      });
      this.subscribedRoomIds.add(roomId);
    }
  }

  private unsubscribeRoom(roomId: string): void {
    const subscriptionId = this.subscriptionIds.get(roomId);
    if (!subscriptionId) {
      this.subscribedRoomIds.delete(roomId);
      return;
    }

    if (this.stompConnected) {
      this.sendFrame({
        command: 'UNSUBSCRIBE',
        headers: { id: subscriptionId },
        body: '',
      });
    }
    this.subscriptionIds.delete(roomId);
    this.subscribedRoomIds.delete(roomId);
  }

  private onStompMessage(frame: StompFrame): void {
    const destination = frame.headers.destination ?? '';
    if (!isChatStatusDestination(destination) || !frame.body) {
      return;
    }

    const status = parseChatRoomStatusBody(frame.body);
    if (!status) {
      logZoneChat('status-hub.room-status.parse.fail', 'Bad status body', {
        level: 'warn',
        detail: { preview: frame.body.slice(0, 120) },
      });
      return;
    }

    logZoneChat('status-hub.room-status', 'Received room status', {
      detail: { roomId: status.roomId, currentMembers: status.currentMembers },
    });
    for (const listener of this.listeners) {
      listener(status);
    }
  }

  private onStompError(frame: StompFrame): void {
    const message = frame.headers.message || frame.body || 'STOMP ERROR';

    if (this.intentionalClose || isBenignStompShutdownError(message)) {
      logZoneChat('status-hub.disconnect', 'STOMP session ended', {
        detail: { message, intentionalClose: this.intentionalClose },
      });
      return;
    }

    if (isStompSessionAlreadyExistsError(message)) {
      logZoneChat('status-hub.session-busy', 'STOMP session still held; retrying', {
        level: 'warn',
        detail: { message },
      });
      this.stompConnected = false;
      this.clearHeartbeatTimer();
      this.intentionalClose = true;
      try {
        this.ws?.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
      this.intentionalClose = false;
      this.scheduleReconnect({ forceDelayMs: ZONE_CHAT_WS_CONFIG.sessionHandoffDelayMs });
      return;
    }

    logZoneChat('status-hub.error', message, { level: 'error' });
    this.stompConnected = false;
    this.clearHeartbeatTimer();
    this.ws?.close();
  }

  private sendFrame(frame: StompFrame): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.ws.send(encodeStompFrameBytes(frame));
      return true;
    } catch {
      return false;
    }
  }

  private startHeartbeat(heartBeatHeader?: string): void {
    this.clearHeartbeatTimer();
    const intervalMs = parseStompClientHeartbeatMs(heartBeatHeader);
    if (intervalMs <= 0) {
      return;
    }

    this.heartbeatBytes = new Uint8Array([0x0a]);
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }
      try {
        this.ws.send(this.heartbeatBytes!);
      } catch {
        /* ignore */
      }
    }, intervalMs);
  }

  private scheduleReconnect(options?: { forceDelayMs?: number }): void {
    if (this.intentionalClose || this.suspended || this.desiredRoomIds.size === 0 || !this.accessToken) {
      return;
    }

    if (this.reconnectAttempt >= ZONE_CHAT_WS_CONFIG.reconnectMaxAttempts) {
      logZoneChat('status-hub.reconnect.fail', 'Max reconnect attempts reached', {
        level: 'warn',
      });
      return;
    }

    this.reconnectAttempt += 1;
    const delay =
      options?.forceDelayMs ??
      ZONE_CHAT_WS_CONFIG.reconnectBaseDelayMs * 2 ** (this.reconnectAttempt - 1);

    this.reconnectTimer = setTimeout(() => {
      void this.ensureConnected();
    }, delay);
  }

  private handleConnectFailure(error: unknown): void {
    logZoneChat('status-hub.connect.fail', 'Could not create WebSocket', {
      level: 'error',
      detail: error,
    });
    this.scheduleReconnect();
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.heartbeatBytes = null;
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearDisconnectTimer(): void {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
  }
}

export const zoneChatRoomStatusHub = new ZoneChatRoomStatusHub();
