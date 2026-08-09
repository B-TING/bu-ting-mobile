import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { getChatRoomById } from '../../constants/eventZone/eventZone';
import { isZoneChatWebSocketEnabled, ZONE_CHAT_WS_CONFIG } from '../../constants/chat/zoneChatConfig';
import { useZoneChatWebSocket } from '../useZoneChatWebSocket';
import { useAppLanguage, useCopy } from '../../i18n';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import { zoneChatConnectionStatusLabel } from '../../utils/chat/zoneChatConnectionStatus';

const LOAD_MORE_SCROLL_THRESHOLD = 72;
const STICK_TO_BOTTOM_THRESHOLD = 96;
const INITIAL_RENDER_BATCH = 40;

type UseEventZoneChatScreenParams = {
  roomId: string;
};

export function useEventZoneChatScreen({ roomId }: UseEventZoneChatScreenParams) {
  const language = useAppLanguage();
  const copy = useCopy('zoneChat');
  const room = getChatRoomById(roomId);
  const wsEnabled = isZoneChatWebSocketEnabled();
  const accessToken = useAuthStore(selectReusableAccessToken);
  const needsLogin = wsEnabled && !accessToken;

  const {
    messages,
    sendMessage,
    enabled: chatEnabled,
    status: wsStatus,
    isRealtime,
    isLoadingHistory,
    isLoadingMoreHistory,
    historyLoaded,
    hasMoreHistory,
    loadMoreHistory,
    memberCount,
  } = useZoneChatWebSocket({
    roomId,
    zoneId: room?.zoneId,
    guestDisplayNickname: language === 'ko' ? '나' : 'Me',
    wsEnabled: wsEnabled && !needsLogin,
  });

  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<(typeof messages)[number]>>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const loadMoreArmedRef = useRef(true);
  const stickToBottomRef = useRef(true);
  const canLoadMoreRef = useRef(false);
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    lastMessageIdRef.current = null;
    loadMoreArmedRef.current = true;
    stickToBottomRef.current = true;
    canLoadMoreRef.current = false;
    initialScrollDoneRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!historyLoaded) {
      canLoadMoreRef.current = false;
      return undefined;
    }

    const timer = setTimeout(() => {
      canLoadMoreRef.current = true;
    }, ZONE_CHAT_WS_CONFIG.memberCountSyncDelayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [historyLoaded, roomId]);

  const scrollToLatest = useCallback((animated = false) => {
    const list = listRef.current;
    if (!list || messages.length === 0) {
      return;
    }
    list.scrollToEnd({ animated });
  }, [messages.length]);

  useEffect(() => {
    if (!historyLoaded || messages.length === 0) {
      return;
    }

    if (!initialScrollDoneRef.current) {
      requestAnimationFrame(() => {
        scrollToLatest(false);
        initialScrollDoneRef.current = true;
      });
      return;
    }

    const lastMessageId = messages[messages.length - 1]?.id ?? null;
    if (!lastMessageId) {
      return;
    }

    const previousLastId = lastMessageIdRef.current;
    lastMessageIdRef.current = lastMessageId;

    if (previousLastId !== lastMessageId && stickToBottomRef.current) {
      scrollToLatest(true);
    }
  }, [historyLoaded, messages, scrollToLatest]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      stickToBottomRef.current = distanceFromBottom < STICK_TO_BOTTOM_THRESHOLD;

      if (contentOffset.y > LOAD_MORE_SCROLL_THRESHOLD) {
        loadMoreArmedRef.current = true;
        return;
      }

      if (
        canLoadMoreRef.current &&
        loadMoreArmedRef.current &&
        hasMoreHistory &&
        !isLoadingMoreHistory
      ) {
        loadMoreArmedRef.current = false;
        loadMoreHistory();
      }
    },
    [hasMoreHistory, isLoadingMoreHistory, loadMoreHistory],
  );

  const sendMessageFromInput = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    stickToBottomRef.current = true;
    sendMessage(trimmed);
    setInput('');
    scrollToLatest(true);
  }, [input, scrollToLatest, sendMessage]);

  const handleContentSizeChange = useCallback(() => {
    if (!initialScrollDoneRef.current && messages.length > 0) {
      scrollToLatest(false);
      initialScrollDoneRef.current = true;
      return;
    }
    if (stickToBottomRef.current) {
      scrollToLatest(false);
    }
  }, [messages.length, scrollToLatest]);

  const statusHint = chatEnabled
    ? zoneChatConnectionStatusLabel(wsStatus, language, { needsLogin })
    : needsLogin
      ? zoneChatConnectionStatusLabel(wsStatus, language, { needsLogin: true })
      : copy.localOnlyHint;

  const initialNumToRender = Math.min(
    messages.length || INITIAL_RENDER_BATCH,
    INITIAL_RENDER_BATCH,
  );

  return {
    language,
    copy,
    room,
    accessToken,
    messages,
    input,
    setInput,
    listRef,
    isLoadingHistory,
    isLoadingMoreHistory,
    hasMoreHistory,
    isRealtime,
    memberCount,
    statusHint,
    initialNumToRender,
    handleScroll,
    sendMessageFromInput,
    handleContentSizeChange,
  };
}
