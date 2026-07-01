import {
  ZONE_CHAT_WS_CONFIG,
  buildZoneChatWebSocketUrl,
} from '../../constants/chat/zoneChatConfig';
import type {
  ZoneChatClientFrame,
  ZoneChatConnectionStatus,
  ZoneChatServerFrame,
  ZoneChatWebSocketConnectOptions,
} from '../../types/zoneChatWebSocket';
import { logZoneChat } from '../../utils/chat/zoneChatLogger';

export type ZoneChatWebSocketListener = {
  onStatusChange?: (status: ZoneChatConnectionStatus) => void;
  onFrame?: (frame: ZoneChatServerFrame) => void;
  onError?: (error: Error) => void;
};

function parseServerFrame(raw: string): ZoneChatServerFrame | null {
  try {
    const parsed = JSON.parse(raw) as ZoneChatServerFrame;
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export class ZoneChatWebSocketClient {
  private ws: WebSocket | null = null;
  private status: ZoneChatConnectionStatus = 'idle';
  private listeners: ZoneChatWebSocketListener = {};
  private connectOptions: ZoneChatWebSocketConnectOptions | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private intentionalClose = false;

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
    this.clearPingTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  joinRoom(): void {
    if (!this.connectOptions) {
      return;
    }
    this.send({
      type: 'JOIN',
      roomId: this.connectOptions.roomId,
      zoneId: this.connectOptions.zoneId,
      participant: this.connectOptions.participant,
    });
  }

  leaveRoom(): void {
    if (!this.connectOptions) {
      return;
    }
    this.send({
      type: 'LEAVE',
      roomId: this.connectOptions.roomId,
    });
  }

  sendChatMessage(clientMessageId: string, text: string): boolean {
    if (!this.connectOptions) {
      return false;
    }
    return this.send({
      type: 'MESSAGE',
      roomId: this.connectOptions.roomId,
      clientMessageId,
      text,
    });
  }

  private openSocket(options: ZoneChatWebSocketConnectOptions): void {
    this.clearReconnectTimer();
    this.clearPingTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const url = options.url || buildZoneChatWebSocketUrl(options.accessToken);
    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');

    logZoneChat('ws.connect', 'Opening WebSocket', {
      detail: {
        roomId: options.roomId,
        zoneId: options.zoneId,
        identityField: options.participant.identityField,
        identityValue: options.participant.identityValue,
        url: url.split('?')[0],
      },
    });

    try {
      this.ws = new WebSocket(url);
    } catch (error) {
      this.handleConnectFailure(error);
      return;
    }

    this.ws.onopen = () => {
      logZoneChat('ws.open', 'WebSocket connected', {
        detail: { roomId: options.roomId },
      });
      this.reconnectAttempt = 0;
      this.setStatus('connected');
      this.joinRoom();
      this.startPingTimer();
    };

    this.ws.onmessage = event => {
      const frame = parseServerFrame(String(event.data));
      if (!frame) {
        logZoneChat('ws.parse.fail', 'Unrecognized server frame', {
          level: 'warn',
          detail: { preview: String(event.data).slice(0, 120) },
        });
        return;
      }
      logZoneChat('ws.frame', `Received ${frame.type}`, {
        detail: { roomId: 'roomId' in frame ? frame.roomId : undefined },
      });
      this.listeners.onFrame?.(frame);
    };

    this.ws.onerror = () => {
      const error = new Error('WebSocket connection error');
      logZoneChat('ws.error', error.message, { level: 'error' });
      this.listeners.onError?.(error);
    };

    this.ws.onclose = event => {
      logZoneChat('ws.close', 'WebSocket closed', {
        detail: { code: event.code, reason: event.reason },
      });
      this.clearPingTimer();
      this.ws = null;

      if (this.intentionalClose) {
        this.setStatus('disconnected');
        return;
      }

      this.scheduleReconnect();
    };
  }

  private send(frame: ZoneChatClientFrame): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logZoneChat('ws.send.skip', 'Socket not open', {
        level: 'warn',
        detail: { type: frame.type },
      });
      return false;
    }

    try {
      this.ws.send(JSON.stringify(frame));
      return true;
    } catch (error) {
      logZoneChat('ws.send.fail', 'Failed to send frame', {
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
      logZoneChat('ws.reconnect.fail', 'Max reconnect attempts reached', {
        level: 'warn',
      });
      return;
    }

    this.reconnectAttempt += 1;
    const delay =
      ZONE_CHAT_WS_CONFIG.reconnectBaseDelayMs * 2 ** (this.reconnectAttempt - 1);

    this.setStatus('reconnecting');
    logZoneChat('ws.reconnect', `Retry in ${delay}ms`, {
      detail: { attempt: this.reconnectAttempt },
    });

    this.reconnectTimer = setTimeout(() => {
      if (this.connectOptions) {
        this.openSocket(this.connectOptions);
      }
    }, delay);
  }

  private handleConnectFailure(error: unknown): void {
    logZoneChat('ws.connect.fail', 'Could not create WebSocket', {
      level: 'error',
      detail: error,
    });
    this.listeners.onError?.(
      error instanceof Error ? error : new Error('WebSocket connect failed'),
    );
    this.scheduleReconnect();
  }

  private startPingTimer(): void {
    this.clearPingTimer();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'PING' });
    }, ZONE_CHAT_WS_CONFIG.pingIntervalMs);
  }

  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
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

/** 테스트·디버그용 */
export async function probeZoneChatWebSocket(
  url: string,
  timeoutMs = 5000,
): Promise<boolean> {
  return new Promise(resolve => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve(ok);
    };

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      finish(false);
      return;
    }

    const timer = setTimeout(() => finish(false), timeoutMs);
    ws.onopen = () => finish(true);
    ws.onerror = () => finish(false);
  });
}
