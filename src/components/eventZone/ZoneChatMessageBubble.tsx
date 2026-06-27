import { Text, View } from 'react-native';

type ZoneChatMessageBubbleProps = {
  authorNickname: string;
  text: string;
  isMine?: boolean;
};

export function ZoneChatMessageBubble({
  authorNickname,
  text,
  isMine = false,
}: ZoneChatMessageBubbleProps) {
  return (
    <View className={`mb-3 max-w-[88%] ${isMine ? 'self-end' : 'self-start'}`}>
      {!isMine ? (
        <Text className="mb-1 text-xs font-semibold text-brand-muted">{authorNickname}</Text>
      ) : null}
      <View
        className={`rounded-2xl px-4 py-3 ${
          isMine
            ? 'rounded-br-md bg-brand-primary'
            : 'rounded-bl-md border border-brand-border bg-brand-surface'
        }`}>
        <Text className={`text-[15px] leading-[22px] ${isMine ? 'text-white' : 'text-brand-text'}`}>
          {text}
        </Text>
      </View>
    </View>
  );
}
