import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildZoneChatWebSocketUrl,
  isZoneChatWebSocketEnabled,
} from '../constants/chat/zoneChatConfig';
import {
  hasMoreChatHistory,
  loadInitialZoneChatHistory,
  loadOlderZoneChatHistory,
} from '../services/chat/zoneChatRoomService';
import { buildZoneChatParticipant } from '../services/chat/zoneChatIdentity';
import { ZoneChatWebSocketClient } from '../services/chat/zoneChatWebSocketClient';
import { isBenignStompShutdownError } from '../services/chat/stompFrame';
import { logZoneChat } from '../utils/chat/zoneChatLogger';
import {
  appendOptimisticZoneChatMessage,
  createOptimisticZoneChatMessage,
  mergeIncomingZoneChatMessage,
  nextLocalZoneChatMessageId,
  oldestPersistedZoneChatMessageId,
  prependOlderZoneChatMessages,
} from '../utils/chat/zoneChatMessageState';
import { selectReusableAccessToken, useAuthStore } from '../stores/useAuthStore';
import {
  selectZoneChatMemberCount,
  useZoneChatMemberStore,
} from '../stores/useZoneChatMemberStore';
import type { EventZoneId, EventZoneChatMessage } from '../types/eventZone';
import { isSameChatRoomId } from '../types/chatApi';
import type {
  ZoneChatConnectionStatus,
  ZoneChatIdentityField,
} from '../types/zoneChatWebSocket';

const EMPTY_SEED_MESSAGES: EventZoneChatMessage[] = [];
const NULL_MEMBER_COUNT_SELECTOR = (): number | null => null;

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
  isLoadingMoreHistory: boolean;
  historyLoaded: boolean;
  hasMoreHistory: boolean;
  loadMoreHistory: () => void;
  memberCount: number | null;
};

export function useZoneChatWebSocket(
  options: UseZoneChatWebSocketOptions,
): UseZoneChatWebSocketResult {
  const {
    roomId,
    zoneId,
    seedMessages = EMPTY_SEED_MESSAGES,
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
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const memberCount = useZoneChatMemberStore(
    zoneId ? selectZoneChatMemberCount(zoneId) : NULL_MEMBER_COUNT_SELECTOR,
  );
  const refreshZoneDelayed = useZoneChatMemberStore(state => state.refreshZoneDelayed);
  const adjustMemberCount = useZoneChatMemberStore(state => state.adjustMemberCount);
  const reconcileMemberCountDelayed = useZoneChatMemberStore(
    state => state.reconcileMemberCountDelayed,
  );
  const resolveRoomId = useZoneChatMemberStore(state => state.resolveRoomId);
  const applyRoomStatus = useZoneChatMemberStore(state => state.applyRoomStatus);
  const setChatActiveRoom = useZoneChatMemberStore(state => state.setChatActiveRoom);

  const clientRef = useRef<ZoneChatWebSocketClient | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const participantRef = useRef(participant);
  const messagesRef = useRef(messages);
  const loadMoreLockRef = useRef(false);

  useEffect(() => {
    participantRef.current = participant;
  }, [participant]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!realtimeEnabled || !zoneId || !activeRoomId) {
      setChatActiveRoom(null, null);
      return undefined;
    }

    activeRoomIdRef.current = activeRoomId;
    setChatActiveRoom(zoneId, activeRoomId);
    return () => {
      setChatActiveRoom(null, null);
    };
  }, [realtimeEnabled, zoneId, activeRoomId, setChatActiveRoom]);

  useEffect(() => {
    if (accessToken) {
      return;
    }
    setMessages(seedMessages);
    setIsLoadingHistory(false);
    setHistoryLoaded(false);
    setHasMoreHistory(false);
    setActiveRoomId(null);
  }, [accessToken, roomId, seedMessages]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    let cancelled = false;
    setIsLoadingHistory(true);
    setIsLoadingMoreHistory(false);
    setHistoryLoaded(false);
    setHasMoreHistory(false);
    setMessages([]);

    const loadSession = async () => {
      const resolvedRoomId = zoneId
        ? await resolveRoomId(zoneId, roomId)
        : roomId;

      if (cancelled) {
        return;
      }

      setActiveRoomId(resolvedRoomId);
      activeRoomIdRef.current = resolvedRoomId;

      try {
        const history = await loadInitialZoneChatHistory(
          resolvedRoomId,
          accessToken,
          participantRef.current,
        );
        if (cancelled) {
          return;
        }

        setMessages(history);
        setHistoryLoaded(true);
        setHasMoreHistory(hasMoreChatHistory(history.length));
        logZoneChat('hook.history', 'Chat history loaded', {
          detail: { roomId: resolvedRoomId, count: history.length },
        });
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

    loadSession().catch(() => undefined);

    return () => {
      cancelled = true;
      activeRoomIdRef.current = null;
    };
  }, [accessToken, roomId, zoneId, user?.userId, resolveRoomId]);

  useEffect(() => {
    if (!realtimeEnabled || !accessToken || !activeRoomId || !historyLoaded) {
      if (!realtimeEnabled) {
        setStatus('disabled');
      } else if (!accessToken) {
        setStatus('failed');
      }
      return undefined;
    }

    let cancelled = false;
    let sessionJoined = false;
    const client = new ZoneChatWebSocketClient();
    clientRef.current = client;

    client.setListeners({
      onStatusChange: nextStatus => {
        if (cancelled) {
          return;
        }
        setStatus(nextStatus);
        if (nextStatus === 'connected' && zoneId && !sessionJoined) {
          sessionJoined = true;
          adjustMemberCount(zoneId, 1);
          reconcileMemberCountDelayed(zoneId, {
            floor: useZoneChatMemberStore.getState().memberCountsByZone[zoneId] ?? 1,
          });
        }
      },
      onMessage: message => {
        if (cancelled) {
          return;
        }
        setMessages(prev =>
          mergeIncomingZoneChatMessage(prev, message, participantRef.current),
        );
      },
      onRoomStatus: roomStatus => {
        if (cancelled) {
          return;
        }
        const currentRoomId = activeRoomIdRef.current;
        if (!isSameChatRoomId(roomStatus.roomId, currentRoomId)) {
          logZoneChat('hook.status.skip', 'roomId mismatch', {
            level: 'warn',
            detail: { expected: currentRoomId, received: roomStatus.roomId },
          });
          return;
        }
        if (typeof roomStatus.currentMembers !== 'number') {
          return;
        }
        logZoneChat('hook.status', 'Live member count updated', {
          detail: { roomId: currentRoomId, currentMembers: roomStatus.currentMembers },
        });
        applyRoomStatus(roomStatus.roomId, roomStatus.currentMembers);
      },
      onError: error => {
        if (cancelled || isBenignStompShutdownError(error.message)) {
          return;
        }
        logZoneChat('hook.error', error.message, { level: 'error' });
      },
    });

    client.connect({
      url: buildZoneChatWebSocketUrl(accessToken),
      roomId: activeRoomId,
      zoneId,
      participant: participantRef.current,
      accessToken,
    });

    return () => {
      cancelled = true;
      const leavingZoneId = zoneId;
      client.disconnect();
      clientRef.current = null;
      if (leavingZoneId && sessionJoined) {
        adjustMemberCount(leavingZoneId, -1);
        reconcileMemberCountDelayed(leavingZoneId, {
          ceiling: useZoneChatMemberStore.getState().memberCountsByZone[leavingZoneId] ?? 0,
        });
      } else if (leavingZoneId) {
        refreshZoneDelayed(leavingZoneId);
      }
    };
  }, [
    realtimeEnabled,
    accessToken,
    activeRoomId,
    historyLoaded,
    zoneId,
    adjustMemberCount,
    applyRoomStatus,
    reconcileMemberCountDelayed,
    refreshZoneDelayed,
  ]);

  const loadMoreHistory = useCallback(() => {
    if (
      !accessToken ||
      !activeRoomId ||
      !historyLoaded ||
      isLoadingHistory ||
      isLoadingMoreHistory ||
      !hasMoreHistory ||
      loadMoreLockRef.current
    ) {
      return;
    }

    const lastMessageId = oldestPersistedZoneChatMessageId(messagesRef.current);
    if (!lastMessageId) {
      return;
    }

    loadMoreLockRef.current = true;
    setIsLoadingMoreHistory(true);

    loadOlderZoneChatHistory(
      activeRoomId,
      accessToken,
      lastMessageId,
      participantRef.current,
    )
      .then(older => {
        setMessages(prev => prependOlderZoneChatMessages(prev, older));
        setHasMoreHistory(hasMoreChatHistory(older.length));
        logZoneChat('hook.history.more', 'Older chat history loaded', {
          detail: { roomId: activeRoomId, count: older.length },
        });
      })
      .catch(error => {
        logZoneChat('hook.history.more.fail', 'Failed to load older chat history', {
          level: 'warn',
          detail: error,
        });
      })
      .finally(() => {
        loadMoreLockRef.current = false;
        setIsLoadingMoreHistory(false);
      });
  }, [
    accessToken,
    activeRoomId,
    hasMoreHistory,
    historyLoaded,
    isLoadingHistory,
    isLoadingMoreHistory,
  ]);

  const sendMessage = useCallback(
    (text: string): boolean => {
      const trimmed = text.trim();
      if (!trimmed) {
        return false;
      }

      const clientMessageId = nextLocalZoneChatMessageId();
      const optimistic = createOptimisticZoneChatMessage(
        clientMessageId,
        activeRoomId ?? roomId,
        participant,
        trimmed,
      );

      setMessages(prev => appendOptimisticZoneChatMessage(prev, optimistic));

      if (!realtimeEnabled || status !== 'connected') {
        return false;
      }

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
    isLoadingMoreHistory,
    historyLoaded,
    hasMoreHistory,
    loadMoreHistory,
    memberCount,
  };
}
