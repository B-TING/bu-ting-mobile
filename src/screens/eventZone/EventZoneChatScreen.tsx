import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ZoneChatMessageBubble } from '../../components/eventZone/ZoneChatMessageBubble';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  ZONE_CHAT_COPY,
  chatRoomTitle,
  chatRoomTopic,
  getChatRoomById,
} from '../../constants/eventZone/eventZone';
import { isZoneChatWebSocketEnabled, ZONE_CHAT_WS_CONFIG } from '../../constants/chat/zoneChatConfig';
import { useZoneChatWebSocket } from '../../hooks/useZoneChatWebSocket';
import { zoneChatConnectionStatusLabel } from '../../utils/chat/zoneChatConnectionStatus';
import type { RootStackParamList } from '../../navigation/types';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZoneChat'>;

const LOAD_MORE_SCROLL_THRESHOLD = 72;
const STICK_TO_BOTTOM_THRESHOLD = 96;
const MAX_INITIAL_RENDER = 100;

export function EventZoneChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = ZONE_CHAT_COPY[language];
  const room = getChatRoomById(route.params.roomId);
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
    hasMoreHistory,
    loadMoreHistory,
    memberCount,
  } = useZoneChatWebSocket({
    roomId: route.params.roomId,
    zoneId: room?.zoneId,
    guestDisplayNickname: language === 'ko' ? '나' : 'Me',
    wsEnabled: wsEnabled && !needsLogin,
  });

  const [input, setInput] = useState('');
  const [listSessionKey, setListSessionKey] = useState(0);
  const listRef = useRef<FlatList<(typeof messages)[number]>>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const loadMoreArmedRef = useRef(true);
  const stickToBottomRef = useRef(true);
  const canLoadMoreRef = useRef(false);

  useEffect(() => {
    setListSessionKey(0);
    lastMessageIdRef.current = null;
    loadMoreArmedRef.current = true;
    stickToBottomRef.current = true;
    canLoadMoreRef.current = false;
  }, [route.params.roomId]);

  useEffect(() => {
    if (isLoadingHistory || messages.length === 0) {
      canLoadMoreRef.current = false;
      return undefined;
    }

    if (listSessionKey === 0) {
      setListSessionKey(1);
    }

    const timer = setTimeout(() => {
      canLoadMoreRef.current = true;
    }, ZONE_CHAT_WS_CONFIG.memberCountSyncDelayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [isLoadingHistory, listSessionKey, messages.length, route.params.roomId]);

  const historyMounted = listSessionKey > 0;

  const lastMessageIndex = messages.length - 1;

  const initialRenderCount = useMemo(() => {
    if (!historyMounted) {
      return 24;
    }
    return Math.min(Math.max(messages.length, 24), MAX_INITIAL_RENDER);
  }, [historyMounted, messages.length]);

  const scrollToLatest = useCallback(
    (animated = false) => {
      if (lastMessageIndex < 0) {
        return;
      }

      const list = listRef.current;
      if (!list) {
        return;
      }

      list.scrollToIndex({
        index: lastMessageIndex,
        animated,
        viewPosition: 1,
      });
      list.scrollToEnd({ animated });
    },
    [lastMessageIndex],
  );

  useEffect(() => {
    if (!historyMounted || messages.length === 0) {
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
  }, [historyMounted, messages, scrollToLatest]);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: Math.max(0, info.averageItemLength * info.index),
        animated: false,
      });
      setTimeout(() => scrollToLatest(false), 50);
    },
    [scrollToLatest],
  );

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

  const statusHint = chatEnabled
    ? zoneChatConnectionStatusLabel(wsStatus, language, { needsLogin })
    : needsLogin
      ? zoneChatConnectionStatusLabel(wsStatus, language, { needsLogin: true })
      : copy.localOnlyHint;

  if (!room) {
    return (
      <View
        className="flex-1 items-center justify-center bg-brand-background px-6"
        style={{ paddingTop: insets.top }}>
        <Text className="text-center text-brand-text">
          {language === 'ko' ? '채팅방을 찾을 수 없어요' : 'Chat room not found'}
        </Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-semibold text-brand-primary">
            {language === 'ko' ? '돌아가기' : 'Go back'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="border-b border-brand-border bg-brand-surface px-4 py-3">
        <View className="flex-row items-center">
          <BackButton
            accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
            onPress={() => navigation.goBack()}
          />
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-brand-text">
              {chatRoomTitle(room, language)}
            </Text>
            <Text className="text-xs text-brand-muted">{chatRoomTopic(room, language)}</Text>
            <Text className="mt-0.5 text-[11px] text-brand-muted">
              {memberCount != null
                ? copy.memberCount(memberCount)
                : accessToken
                  ? language === 'ko'
                    ? '참여자 확인 중…'
                    : 'Loading members…'
                  : copy.memberCount(room.memberCount)}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        {historyMounted ? (
          <FlatList
            key={`${route.params.roomId}-${listSessionKey}`}
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            className="flex-1 px-4 pt-4"
            contentContainerClassName="pb-4"
            initialScrollIndex={lastMessageIndex >= 0 ? lastMessageIndex : undefined}
            initialNumToRender={initialRenderCount}
            maxToRenderPerBatch={initialRenderCount}
            windowSize={21}
            removeClippedSubviews={false}
            maintainVisibleContentPosition={
              hasMoreHistory
                ? {
                    minIndexForVisible: 1,
                    autoscrollToTopThreshold: 80,
                  }
                : undefined
            }
            onScrollToIndexFailed={handleScrollToIndexFailed}
            onContentSizeChange={() => {
              if (stickToBottomRef.current) {
                scrollToLatest(false);
              }
            }}
            ListHeaderComponent={
              isLoadingMoreHistory ? (
                <Text className="py-2 text-center text-sm text-brand-muted">
                  {language === 'ko' ? '이전 메시지 불러오는 중…' : 'Loading older messages…'}
                </Text>
              ) : null
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <ZoneChatMessageBubble
                authorNickname={item.authorNickname}
                text={item.text}
                sentAt={item.sentAt}
                language={language}
                isMine={item.isMine}
              />
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-sm text-brand-muted">
              {isLoadingHistory
                ? language === 'ko'
                  ? '이전 메시지 불러오는 중…'
                  : 'Loading chat history…'
                : copy.emptyMessages}
            </Text>
          </View>
        )}

        <View className="border-t border-brand-border bg-brand-surface px-4 py-3">
          {statusHint ? (
            <Text
              className={`mb-2 text-[11px] ${isRealtime ? 'text-emerald-700' : 'text-amber-700'}`}>
              {statusHint}
            </Text>
          ) : null}
          <View className="flex-row items-end gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={copy.inputPlaceholder}
              placeholderTextColor="#94A3B8"
              multiline
              className="max-h-28 flex-1 rounded-2xl border border-brand-border bg-brand-background px-4 py-3 text-[15px] text-brand-text"
              onSubmitEditing={sendMessageFromInput}
              returnKeyType="send"
            />
            <Pressable
              accessibilityRole="button"
              onPress={sendMessageFromInput}
              className="rounded-2xl bg-brand-primary px-4 py-3 active:opacity-80">
              <Text className="font-semibold text-white">{copy.send}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
