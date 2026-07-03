import {
  ZONE_CHAT_WS_CONFIG,
  buildZoneChatWebSocketUrl,
  isZoneChatWebSocketEnabled,
} from '../../constants/chat/zoneChatConfig';
import type { ParsedChatRoomStatusPayload } from '../../types/chatApi';
import { isChatStatusDestination, parseChatRoomStatusBody } from '../../types/chatApi';
import { logZoneChat } from '../../utils/chat/zoneChatLogger';
import {
  decodeStompFrames,
  decodeWebSocketPayload,
  encodeStompFrameBytes,
  isBenignStompShutdownError,
  isStompHeartbeat,
  parseStompClientHeartbeatMs,
  type StompFrame,
} from './stompFrame';

const STATUS_SUBSCRIBE_DESTINATION = ZONE_CHAT_WS_CONFIG.stomp.roomStatus;

type StatusListener = (status: ParsedChatRoomStatusPayload) => void;

/**
 * 목록·홈용 실시간 인원 허브 — 방별 status 채널만 단일 WebSocket 으로 멀티 구독.
 * 구독자(ref count)가 0이 되면 연결을 닫습니다.
 */
class ZoneChatRoomStatusHub {
  private listeners = new Set<StatusListener>();
  private roomRefCounts = new Map<string, number>();
  private subscriptionIds = new Map<string, string>();
  private subscribedRoomIds = new Set<string>();
  private accessToken: string | null = null;
  private ws: WebSocket | null = null;
  private stompConnected = false;
  private intentionalClose = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatBytes: Uint8Array | null = null;
  private nextSubscriptionKey = 0;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  addListener(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  retainRooms(roomIds: string[], accessToken: string): () => void {
    if (!isZoneChatWebSocketEnabled() || !accessToken || roomIds.length === 0) {
      return () => undefined;
    }

    const uniqueRoomIds = [...new Set(roomIds.filter(Boolean))];
    for (const roomId of uniqueRoomIds) {
      this.roomRefCounts.set(roomId, (this.roomRefCounts.get(roomId) ?? 0) + 1);
    }

    this.accessToken = accessToken;
    this.ensureConnected();

    return () => {
      let shouldDisconnect = false;
      for (const roomId of uniqueRoomIds) {
        const next = (this.roomRefCounts.get(roomId) ?? 1) - 1;
        if (next <= 0) {
          this.roomRefCounts.delete(roomId);
          this.unsubscribeRoom(roomId);
          shouldDisconnect = true;
        } else {
          this.roomRefCounts.set(roomId, next);
        }
      }

      if (shouldDisconnect && this.roomRefCounts.size === 0) {
        this.disconnect();
      }
    };
  }

  private getActiveRoomIds(): string[] {
    return [...this.roomRefCounts.keys()];
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

  private ensureConnected(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.stompConnected) {
        this.syncSubscriptions();
      }
      return;
    }

    this.intentionalClose = false;
    this.reconnectAttempt = 0;
    this.openSocket();
  }

  private disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.clearDisconnectTimer();

    const ws = this.ws;
    if (!ws) {
      this.stompConnected = false;
      this.accessToken = null;
      this.subscriptionIds.clear();
      this.subscribedRoomIds.clear();
      return;
    }

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
      this.accessToken = null;
      this.subscriptionIds.clear();
      this.subscribedRoomIds.clear();
    };

    if (this.stompConnected && ws.readyState === WebSocket.OPEN) {
      this.sendFrame({ command: 'DISCONNECT', headers: {}, body: '' });
      this.stompConnected = false;
      this.disconnectTimer = setTimeout(finishClose, ZONE_CHAT_WS_CONFIG.gracefulDisconnectMs);
    } else {
      finishClose();
    }
  }

  private openSocket(): void {
    if (!this.accessToken || this.roomRefCounts.size === 0) {
      return;
    }

    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.clearDisconnectTimer();
    this.stompConnected = false;
    this.subscriptionIds.clear();
    this.subscribedRoomIds.clear();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const url = buildZoneChatWebSocketUrl(this.accessToken);
    logZoneChat('status-hub.connect', 'Opening status WebSocket', {
      detail: { rooms: this.getActiveRoomIds().length, url: url.split('?')[0] },
    });

    try {
      const socket = new WebSocket(url) as WebSocket & { binaryType?: string };
      socket.binaryType = 'arraybuffer';
      this.ws = socket;
    } catch (error) {
      this.handleConnectFailure(error);
      return;
    }

    this.ws.onopen = () => {
      this.sendConnectFrame();
    };

    this.ws.onmessage = event => {
      const raw = decodeWebSocketPayload(event.data);
      if (!raw || isStompHeartbeat(raw)) {
        return;
      }

      for (const frame of decodeStompFrames(raw)) {
        this.handleFrame(frame);
      }
    };

    this.ws.onerror = () => {
      if (this.intentionalClose) {
        return;
      }
      logZoneChat('status-hub.ws.error', 'WebSocket error', { level: 'error' });
    };

    this.ws.onclose = () => {
      this.clearHeartbeatTimer();
      this.ws = null;
      this.stompConnected = false;
      this.subscriptionIds.clear();
      this.subscribedRoomIds.clear();

      if (this.intentionalClose) {
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
    if (!this.stompConnected) {
      return;
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

  private scheduleReconnect(): void {
    if (this.intentionalClose || this.roomRefCounts.size === 0 || !this.accessToken) {
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
      ZONE_CHAT_WS_CONFIG.reconnectBaseDelayMs * 2 ** (this.reconnectAttempt - 1);

    this.reconnectTimer = setTimeout(() => {
      this.openSocket();
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
