import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
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
import { isZoneChatWebSocketEnabled } from '../../constants/chat/zoneChatConfig';
import { useZoneChatWebSocket } from '../../hooks/useZoneChatWebSocket';
import type { RootStackParamList } from '../../navigation/types';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZoneChat'>;

function connectionStatusLabel(
  status: ReturnType<typeof useZoneChatWebSocket>['status'],
  language: string,
  options: { needsLogin: boolean },
): string | null {
  if (options.needsLogin) {
    return language === 'ko'
      ? '실시간 채팅을 쓰려면 로그인이 필요합니다.'
      : 'Sign in to use live chat.';
  }

  switch (status) {
    case 'idle':
      return language === 'ko' ? '채팅방 입장 중…' : 'Joining chat room…';
    case 'connecting':
    case 'reconnecting':
      return language === 'ko' ? '채팅 서버 연결 중…' : 'Connecting to chat…';
    case 'failed':
      return language === 'ko'
        ? '연결에 실패했습니다. 네트워크·로그인 상태를 확인해 주세요.'
        : 'Connection failed. Check network and sign-in.';
    case 'connected':
      return language === 'ko' ? '실시간 채팅 연결됨' : 'Live chat connected';
    default:
      return null;
  }
}

export function EventZoneChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = ZONE_CHAT_COPY[language];
  const room = getChatRoomById(route.params.roomId);
  const wsEnabled = isZoneChatWebSocketEnabled();
  const accessToken = useAuthStore(selectReusableAccessToken);
  const needsLogin = wsEnabled && !accessToken;

  const { messages, sendMessage, enabled: chatEnabled, status: wsStatus, isRealtime, isLoadingHistory, memberCount } =
    useZoneChatWebSocket({
      roomId: route.params.roomId,
      zoneId: room?.zoneId,
      seedMessages: [],
      guestDisplayNickname: language === 'ko' ? '나' : 'Me',
      wsEnabled: wsEnabled && !needsLogin,
    });

  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<(typeof messages)[number]>>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const sendMessageFromInput = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    sendMessage(trimmed);
    setInput('');
    scrollToEnd();
  }, [input, scrollToEnd, sendMessage]);

  const statusHint = chatEnabled
    ? connectionStatusLabel(wsStatus, language, { needsLogin })
    : needsLogin
      ? connectionStatusLabel(wsStatus, language, { needsLogin: true })
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
              {copy.memberCount(memberCount ?? room.memberCount)}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          className="flex-1 px-4 pt-4"
          contentContainerClassName="pb-4"
          ListEmptyComponent={
            isLoadingHistory ? (
              <Text className="text-center text-sm text-brand-muted">
                {language === 'ko' ? '이전 메시지 불러오는 중…' : 'Loading chat history…'}
              </Text>
            ) : (
              <Text className="text-center text-sm text-brand-muted">{copy.emptyMessages}</Text>
            )
          }
          onContentSizeChange={scrollToEnd}
          renderItem={({ item }) => (
            <ZoneChatMessageBubble
              authorNickname={item.authorNickname}
              text={item.text}
              isMine={item.isMine}
            />
          )}
        />

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
