import { useCallback, useMemo, useRef, useState } from 'react';
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
  chatMessagesForRoom,
  chatRoomTitle,
  chatRoomTopic,
  getChatRoomById,
} from '../../constants/eventZone/eventZone';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore, useAuthStore } from '../../stores';
import type { EventZoneChatMessage } from '../../types/eventZone';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZoneChat'>;

let messageCounter = 0;

function nextMessageId(): string {
  messageCounter += 1;
  return `local-msg-${messageCounter}-${Date.now()}`;
}

export function EventZoneChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const user = useAuthStore(s => s.user);
  const copy = ZONE_CHAT_COPY[language];
  const room = getChatRoomById(route.params.roomId);

  const seedMessages = useMemo(
    () => chatMessagesForRoom(route.params.roomId),
    [route.params.roomId],
  );
  const [messages, setMessages] = useState<EventZoneChatMessage[]>(seedMessages);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<EventZoneChatMessage>>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const mine: EventZoneChatMessage = {
      id: nextMessageId(),
      roomId: route.params.roomId,
      authorId: user?.userId ?? 'guest',
      authorNickname: user?.nickname ?? (language === 'ko' ? '나' : 'Me'),
      text: trimmed,
      sentAt: new Date().toISOString(),
      isMine: true,
    };

    setMessages(prev => [...prev, mine]);
    setInput('');
    scrollToEnd();
  }, [input, language, route.params.roomId, scrollToEnd, user?.nickname, user?.userId]);

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
              {copy.memberCount(room.memberCount)}
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
            <Text className="text-center text-sm text-brand-muted">{copy.emptyMessages}</Text>
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
          <Text className="mb-2 text-[11px] text-amber-700">{copy.localOnlyHint}</Text>
          <View className="flex-row items-end gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={copy.inputPlaceholder}
              placeholderTextColor="#94A3B8"
              multiline
              className="max-h-28 flex-1 rounded-2xl border border-brand-border bg-brand-background px-4 py-3 text-[15px] text-brand-text"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <Pressable
              accessibilityRole="button"
              onPress={sendMessage}
              className="rounded-2xl bg-brand-primary px-4 py-3 active:opacity-80">
              <Text className="font-semibold text-white">{copy.send}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
