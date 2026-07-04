import {
  ZONE_CHAT_WS_CONFIG,
  buildZoneChatWebSocketUrl,
} from '../../constants/chat/zoneChatConfig';
import type { ChatMessage, ChatSendPayload, ParsedChatRoomStatusPayload } from '../../types/chatApi';
import { isChatStatusDestination, parseChatRoomStatusBody } from '../../types/chatApi';
import type {
  ZoneChatConnectionStatus,
  ZoneChatWebSocketConnectOptions,
} from '../../types/zoneChatWebSocket';
import { logZoneChat } from '../../utils/chat/zoneChatLogger';
import { isWebSocketAuthHandshakeFailure } from '../../utils/chat/zoneChatConnectionStatus';
import {
  decodeStompFrames,
  decodeWebSocketPayload,
  encodeStompFrameBytes,
  isBenignStompShutdownError,
  isStompHeartbeat,
  parseStompClientHeartbeatMs,
  type StompFrame,
} from './stompFrame';

export type ZoneChatWebSocketListener = {
  onStatusChange?: (status: ZoneChatConnectionStatus) => void;
  /** SUBSCRIBE /sub/chat/room/{roomId} — 채팅 메시지 */
  onMessage?: (message: ChatMessage) => void;
  /** SUBSCRIBE /sub/chat/room/{roomId}/status — 실시간 인원 (채팅방 진입 시 메시지와 동시 구독) */
  onRoomStatus?: (status: ParsedChatRoomStatusPayload) => void;
  onError?: (error: Error) => void;
};

const MESSAGE_SUBSCRIBE_DESTINATION = ZONE_CHAT_WS_CONFIG.stomp.roomMessages;
const STATUS_SUBSCRIBE_DESTINATION = ZONE_CHAT_WS_CONFIG.stomp.roomStatus;
const SEND_DESTINATION = ZONE_CHAT_WS_CONFIG.stomp.sendMessage;

/**
 * STOMP over raw WebSocket 채팅 클라이언트.
 * CONNECT 시 Authorization: Bearer 헤더로 인증하고
 * /sub/chat/room/{roomId} · /sub/chat/room/{roomId}/status 구독 · /pub/chat/message 발행.
 * 목록 화면 인원은 zoneChatRoomStatusHub 가 담당합니다.
 */
export class ZoneChatWebSocketClient {
  private ws: WebSocket | null = null;
  private status: ZoneChatConnectionStatus = 'idle';
  private listeners: ZoneChatWebSocketListener = {};
  private connectOptions: ZoneChatWebSocketConnectOptions | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatBytes: Uint8Array | null = null;
  private messageSubscriptionId = 'sub-messages';
  private statusSubscriptionId = 'sub-status';
  private intentionalClose = false;
  private stompConnected = false;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  getStatus(): ZoneChatConnectionStatus {
    return this.status;
  }

  setListeners(listeners: ZoneChatWebSocketListener): void {
    this.listeners = listeners;
  }

  connect(options: ZoneChatWebSocketConnectOptions): void {
    this.intentionalClose = false;
    this.connectOptions = options;
    this.reconnectAttempt = 0;
    this.openSocket(options);
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.clearDisconnectTimer();

    const ws = this.ws;
    if (!ws) {
      this.stompConnected = false;
      this.setStatus('disconnected');
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
    };

    if (this.stompConnected && ws.readyState === WebSocket.OPEN) {
      this.sendFrame({ command: 'DISCONNECT', headers: {}, body: '' });
      this.stompConnected = false;
      this.disconnectTimer = setTimeout(finishClose, ZONE_CHAT_WS_CONFIG.gracefulDisconnectMs);
    } else {
      finishClose();
    }

    this.setStatus('disconnected');
  }

  sendChatMessage(_clientMessageId: string, text: string): boolean {
    if (!this.connectOptions || !this.stompConnected) {
      logZoneChat('stomp.send.skip', 'Not connected', { level: 'warn' });
      return false;
    }
    const payload: ChatSendPayload = {
      roomId: this.connectOptions.roomId,
      content: text,
    };
    return this.sendFrame({
      command: 'SEND',
      headers: {
        destination: SEND_DESTINATION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  private openSocket(options: ZoneChatWebSocketConnectOptions): void {
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.clearDisconnectTimer();
    this.stompConnected = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const url = options.url || buildZoneChatWebSocketUrl(options.accessToken);
    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');

    logZoneChat('stomp.connect', 'Opening WebSocket', {
      detail: { roomId: options.roomId, zoneId: options.zoneId, url: url.split('?')[0] },
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
      logZoneChat('stomp.ws.open', 'WebSocket open, sending CONNECT', {
        detail: { roomId: options.roomId },
      });
      this.sendConnectFrame(options);
    };

    this.ws.onmessage = event => {
      const raw = decodeWebSocketPayload(event.data);
      if (!raw || isStompHeartbeat(raw)) {
        return;
      }

      const frames = decodeStompFrames(raw);
      if (frames.length === 0) {
        logZoneChat('stomp.raw.unparsed', 'Could not decode STOMP frame', {
          level: 'warn',
          detail: {
            preview: raw.slice(0, 160),
            dataType: typeof event.data,
          },
        });
        return;
      }

      for (const frame of frames) {
        this.handleFrame(frame);
      }
    };

    this.ws.onerror = () => {
      if (this.intentionalClose) {
        return;
      }
      const error = new Error('WebSocket connection error');
      logZoneChat('stomp.ws.error', error.message, { level: 'error' });
      this.listeners.onError?.(error);
    };

    this.ws.onclose = event => {
      logZoneChat('stomp.ws.close', 'WebSocket closed', {
        detail: { code: event.code, reason: event.reason },
      });
      this.clearHeartbeatTimer();
      this.ws = null;
      this.stompConnected = false;

      if (this.intentionalClose) {
        this.setStatus('disconnected');
        return;
      }

      if (isWebSocketAuthHandshakeFailure(event.reason)) {
        const error = new Error(
          'WebSocket handshake rejected (401/403). Sign in again or check access token.',
        );
        logZoneChat('stomp.ws.auth', error.message, { level: 'error' });
        this.listeners.onError?.(error);
        this.setStatus('failed');
        return;
      }

      this.scheduleReconnect();
    };
  }

  private sendConnectFrame(options: ZoneChatWebSocketConnectOptions): void {
    const headers: Record<string, string> = {
      'accept-version': '1.2',
      'heart-beat': '0,0',
    };
    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`;
    }
    const sent = this.sendFrame({ command: 'CONNECT', headers, body: '' });
    logZoneChat('stomp.connect.sent', sent ? 'CONNECT frame sent (binary)' : 'CONNECT send failed', {
      detail: { roomId: options.roomId },
    });
  }

  private handleFrame(frame: StompFrame): void {
    const command = frame.command.trim().toUpperCase();
    logZoneChat('stomp.frame', `Received ${command}`, {
      detail: { destination: frame.headers.destination },
    });

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
    if (!this.connectOptions) {
      return;
    }
    this.stompConnected = true;
    this.reconnectAttempt = 0;
    this.setStatus('connected');
    this.startHeartbeat(frame.headers['heart-beat']);

    logZoneChat('stomp.connected', 'STOMP CONNECTED, subscribing', {
      detail: {
        roomId: this.connectOptions.roomId,
        heartBeat: frame.headers['heart-beat'],
      },
    });

    this.sendFrame({
      command: 'SUBSCRIBE',
      headers: {
        id: this.messageSubscriptionId,
        destination: MESSAGE_SUBSCRIBE_DESTINATION(this.connectOptions.roomId),
      },
      body: '',
    });
    this.sendFrame({
      command: 'SUBSCRIBE',
      headers: {
        id: this.statusSubscriptionId,
        destination: STATUS_SUBSCRIBE_DESTINATION(this.connectOptions.roomId),
      },
      body: '',
    });
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
      } catch (error) {
        logZoneChat('stomp.heartbeat.fail', 'Failed to send heartbeat', {
          level: 'warn',
          detail: error,
        });
      }
    }, intervalMs);

    logZoneChat('stomp.heartbeat', 'Heartbeat enabled', {
      detail: { intervalMs },
    });
  }

  private onStompMessage(frame: StompFrame): void {
    if (!frame.body) {
      return;
    }

    const destination = frame.headers.destination ?? '';

    if (isChatStatusDestination(destination)) {
      const status = parseChatRoomStatusBody(frame.body);
      if (status) {
        logZoneChat('stomp.room-status', 'Received room status', {
          detail: { roomId: status.roomId, currentMembers: status.currentMembers },
        });
        this.listeners.onRoomStatus?.(status);
      } else {
        logZoneChat('stomp.room-status.parse.fail', 'Bad status MESSAGE body', {
          level: 'warn',
          detail: { preview: frame.body.slice(0, 120) },
        });
      }
      return;
    }

    try {
      const message = JSON.parse(frame.body) as ChatMessage;
      logZoneChat('stomp.message', 'Received chat message', {
        detail: { messageId: message.messageId, roomId: message.roomId },
      });
      this.listeners.onMessage?.(message);
    } catch {
      logZoneChat('stomp.message.parse.fail', 'Bad MESSAGE body', {
        level: 'warn',
        detail: { preview: frame.body.slice(0, 120) },
      });
    }
  }

  private onStompError(frame: StompFrame): void {
    const message = frame.headers.message || frame.body || 'STOMP ERROR';

    if (this.intentionalClose || isBenignStompShutdownError(message)) {
      logZoneChat('stomp.disconnect', 'STOMP session ended', {
        detail: { message, intentionalClose: this.intentionalClose },
      });
      return;
    }

    logZoneChat('stomp.error', message, { level: 'error' });
    this.listeners.onError?.(new Error(message));

    this.stompConnected = false;
    this.clearHeartbeatTimer();
    this.ws?.close();
  }

  private sendFrame(frame: StompFrame): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logZoneChat('stomp.frame.skip', 'Socket not open', {
        level: 'warn',
        detail: { command: frame.command },
      });
      return false;
    }
    try {
      const bytes = encodeStompFrameBytes(frame);
      this.ws.send(bytes);
      logZoneChat('stomp.frame.sent', `Sent ${frame.command}`, {
        detail: { byteLength: bytes.length, endsWithNull: bytes[bytes.length - 1] === 0 },
      });
      return true;
    } catch (error) {
      logZoneChat('stomp.frame.fail', 'Failed to send frame', {
        level: 'error',
        detail: error,
      });
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (!this.connectOptions || this.intentionalClose) {
      this.setStatus('disconnected');
      return;
    }

    if (this.reconnectAttempt >= ZONE_CHAT_WS_CONFIG.reconnectMaxAttempts) {
      this.setStatus('failed');
      logZoneChat('stomp.reconnect.fail', 'Max reconnect attempts reached', {
        level: 'warn',
      });
      return;
    }

    this.reconnectAttempt += 1;
    const delay =
      ZONE_CHAT_WS_CONFIG.reconnectBaseDelayMs * 2 ** (this.reconnectAttempt - 1);

    this.setStatus('reconnecting');
    logZoneChat('stomp.reconnect', `Retry in ${delay}ms`, {
      detail: { attempt: this.reconnectAttempt },
    });

    this.reconnectTimer = setTimeout(() => {
      if (this.connectOptions) {
        this.openSocket(this.connectOptions);
      }
    }, delay);
  }

  private handleConnectFailure(error: unknown): void {
    logZoneChat('stomp.connect.fail', 'Could not create WebSocket', {
      level: 'error',
      detail: error,
    });
    this.listeners.onError?.(
      error instanceof Error ? error : new Error('WebSocket connect failed'),
    );
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

  private setStatus(status: ZoneChatConnectionStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.listeners.onStatusChange?.(status);
  }
}
