import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildZoneChatWebSocketUrl,
  isZoneChatWebSocketEnabled,
} from '../constants/chat/zoneChatConfig';
import {
  enterChatRoom,
  exitChatRoom,
  fetchChatRoomByZone,
  readChatRoomMemberCount,
} from '../services/chat/chatApiService';
import { buildZoneChatParticipant } from '../services/chat/zoneChatIdentity';
import {
  mapServerMessageToEventZoneChat,
  mapServerMessagesToEventZoneChat,
  sortEventZoneChatMessages,
} from '../services/chat/zoneChatMessageMapper';
import { ZoneChatWebSocketClient } from '../services/chat/zoneChatWebSocketClient';
import { logZoneChat } from '../utils/chat/zoneChatLogger';
import { selectReusableAccessToken, useAuthStore } from '../stores/useAuthStore';
import type { ChatMessage, ChatMessageRaw } from '../types/chatApi';
import type { EventZoneId } from '../types/eventZone';
import type { EventZoneChatMessage } from '../types/eventZone';
import type {
  ZoneChatConnectionStatus,
  ZoneChatIdentityField,
} from '../types/zoneChatWebSocket';

export type UseZoneChatWebSocketOptions = {
  /** mock roomId. zoneId 로 실제 roomId 를 조회하지 못할 때 폴백 */
  roomId: string;
  zoneId?: EventZoneId;
  /** WebSocket 미사용 시 mock 시드 메시지 */
  seedMessages?: EventZoneChatMessage[];
  identityField?: ZoneChatIdentityField;
  guestDisplayNickname?: string;
  /** WebSocket 실시간 연동 (히스토리는 accessToken 있으면 항상 로드) */
  wsEnabled?: boolean;
};

export type UseZoneChatWebSocketResult = {
  enabled: boolean;
  status: ZoneChatConnectionStatus;
  messages: EventZoneChatMessage[];
  participant: ReturnType<typeof buildZoneChatParticipant>;
  sendMessage: (text: string) => boolean;
  isRealtime: boolean;
  isLoadingHistory: boolean;
  historyLoaded: boolean;
  memberCount: number | null;
  refreshMemberCount: () => Promise<void>;
};

let localMessageCounter = 0;

function nextLocalMessageId(): string {
  localMessageCounter += 1;
  return `local-msg-${localMessageCounter}-${Date.now()}`;
}

function chatMessageId(message: ChatMessage | ChatMessageRaw): string {
  return message.messageId ?? message.id ?? '';
}

export function useZoneChatWebSocket(
  options: UseZoneChatWebSocketOptions,
): UseZoneChatWebSocketResult {
  const {
    roomId,
    zoneId,
    seedMessages = [],
    identityField,
    guestDisplayNickname,
    wsEnabled: wsEnabledOverride,
  } = options;

  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(selectReusableAccessToken);

  const realtimeEnabled = wsEnabledOverride ?? isZoneChatWebSocketEnabled();
  const participant = useMemo(
    () =>
      buildZoneChatParticipant(user, {
        identityField,
        guestDisplayNickname,
      }),
    [user, identityField, guestDisplayNickname],
  );

  const [status, setStatus] = useState<ZoneChatConnectionStatus>(
    realtimeEnabled ? 'idle' : 'disabled',
  );
  const [messages, setMessages] = useState<EventZoneChatMessage[]>(
    accessToken ? [] : seedMessages,
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(accessToken));
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  const clientRef = useRef<ZoneChatWebSocketClient | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);

  const refreshMemberCount = useCallback(async () => {
    if (!zoneId) {
      return;
    }
    try {
      const room = await fetchChatRoomByZone(zoneId);
      if (room) {
        setMemberCount(readChatRoomMemberCount(room));
      }
    } catch (error) {
      logZoneChat('hook.member-count.fail', 'Failed to refresh member count', {
        level: 'warn',
        detail: error,
      });
    }
  }, [zoneId]);

  useEffect(() => {
    if (!zoneId) {
      setMemberCount(null);
      return;
    }
    void refreshMemberCount();
  }, [zoneId, refreshMemberCount]);

  useEffect(() => {
    if (!accessToken) {
      setMessages(seedMessages);
      setIsLoadingHistory(false);
      setHistoryLoaded(false);
      setActiveRoomId(null);
    }
  }, [accessToken, roomId, seedMessages]);

  /** 입장 시 REST enter 로 과거 메시지(최대 100개) 로드 */
  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    let cancelled = false;
    setIsLoadingHistory(true);
    setHistoryLoaded(false);
    setMessages([]);

    const loadHistory = async () => {
      const resolvedRoomId = await resolveRoomId(roomId, zoneId);
      if (cancelled) {
        return;
      }

      setActiveRoomId(resolvedRoomId);
      activeRoomIdRef.current = resolvedRoomId;

      try {
        const history = await enterChatRoom(resolvedRoomId, accessToken);
        if (cancelled) {
          return;
        }

        const mapped = sortEventZoneChatMessages(
          mapServerMessagesToEventZoneChat(history, participant),
        );
        setMessages(mapped);
        setHistoryLoaded(true);
        logZoneChat('hook.history', 'Chat history loaded', {
          detail: { roomId: resolvedRoomId, count: mapped.length },
        });
        await refreshMemberCount();
      } catch (error) {
        logZoneChat('hook.history.fail', 'Failed to load chat history', {
          level: 'warn',
          detail: error,
        });
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
      const roomToExit = activeRoomIdRef.current;
      activeRoomIdRef.current = null;
      if (roomToExit && accessToken) {
        void exitChatRoom(roomToExit, accessToken).catch(() => undefined);
      }
    };
  }, [accessToken, roomId, zoneId, participant, refreshMemberCount]);

  /** STOMP 실시간 연결 (히스토리 로드 후 roomId 확정 시) */
  useEffect(() => {
    if (!realtimeEnabled || !accessToken || !activeRoomId) {
      if (!realtimeEnabled) {
        setStatus('disabled');
      } else if (!accessToken) {
        setStatus('failed');
      }
      return undefined;
    }

    let cancelled = false;
    const client = new ZoneChatWebSocketClient();
    clientRef.current = client;

    client.setListeners({
      onStatusChange: nextStatus => {
        if (!cancelled) {
          setStatus(nextStatus);
        }
      },
      onMessage: message => {
        if (cancelled) {
          return;
        }
        const messageId = chatMessageId(message);
        setMessages(prev => {
          if (messageId && prev.some(item => item.id === messageId)) {
            return prev;
          }
          const mapped = mapServerMessageToEventZoneChat(message, participant);
          const withoutOptimistic = mapped.isMine
            ? prev.filter(item => !(item.id.startsWith('local-msg-') && item.text === mapped.text))
            : prev;
          return sortEventZoneChatMessages([...withoutOptimistic, mapped]);
        });
      },
      onError: error => {
        logZoneChat('hook.error', error.message, { level: 'error' });
      },
    });

    client.connect({
      url: buildZoneChatWebSocketUrl(accessToken),
      roomId: activeRoomId,
      zoneId,
      participant,
      accessToken,
    });

    return () => {
      cancelled = true;
      client.disconnect();
      clientRef.current = null;
    };
  }, [realtimeEnabled, accessToken, activeRoomId, zoneId, participant]);

  const sendMessage = useCallback(
    (text: string): boolean => {
      const trimmed = text.trim();
      if (!trimmed) {
        return false;
      }

      const clientMessageId = nextLocalMessageId();
      const optimistic: EventZoneChatMessage = {
        id: clientMessageId,
        roomId: activeRoomId ?? roomId,
        authorId: participant.identityValue,
        authorNickname: participant.displayNickname,
        text: trimmed,
        sentAt: new Date().toISOString(),
        isMine: true,
      };

      if (!realtimeEnabled || status !== 'connected') {
        setMessages(prev => sortEventZoneChatMessages([...prev, optimistic]));
        return false;
      }

      setMessages(prev => sortEventZoneChatMessages([...prev, optimistic]));
      return clientRef.current?.sendChatMessage(clientMessageId, trimmed) ?? false;
    },
    [activeRoomId, participant, realtimeEnabled, roomId, status],
  );

  return {
    enabled: realtimeEnabled,
    status,
    messages,
    participant,
    sendMessage,
    isRealtime: realtimeEnabled && status === 'connected',
    isLoadingHistory,
    historyLoaded,
    memberCount,
    refreshMemberCount,
  };
}

async function resolveRoomId(
  fallbackRoomId: string,
  zoneId?: EventZoneId,
): Promise<string> {
  if (!zoneId) {
    return fallbackRoomId;
  }
  try {
    const room = await fetchChatRoomByZone(zoneId);
    if (room?.roomId) {
      logZoneChat('hook.resolve-room', 'Resolved backend roomId', {
        detail: {
          zoneId,
          roomId: room.roomId,
          memberCount: readChatRoomMemberCount(room),
        },
      });
      return room.roomId;
    }
  } catch (error) {
    logZoneChat('hook.resolve-room.fail', 'rooms/zone lookup failed', {
      level: 'warn',
      detail: error,
    });
  }
  return fallbackRoomId;
}
