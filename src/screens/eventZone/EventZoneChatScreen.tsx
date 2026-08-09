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
  chatRoomTitle,
  chatRoomTopic,
} from '../../constants/eventZone/eventZone';
import { useEventZoneChatScreen } from '../../hooks/eventZone/useEventZoneChatScreen';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZoneChat'>;

const INITIAL_RENDER_BATCH = 40;

export function EventZoneChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const {
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
  } = useEventZoneChatScreen({ roomId: route.params.roomId });

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
        {isLoadingHistory ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-sm text-brand-muted">
              {language === 'ko' ? '이전 메시지 불러오는 중…' : 'Loading chat history…'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            className="flex-1 px-4 pt-4"
            contentContainerClassName="grow pb-4"
            initialNumToRender={initialNumToRender}
            maxToRenderPerBatch={INITIAL_RENDER_BATCH}
            windowSize={11}
            removeClippedSubviews={false}
            maintainVisibleContentPosition={
              hasMoreHistory
                ? {
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 80,
                  }
                : undefined
            }
            onContentSizeChange={handleContentSizeChange}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-center text-sm text-brand-muted">{copy.emptyMessages}</Text>
              </View>
            }
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
