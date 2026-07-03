import { Text, View } from 'react-native';

import { formatZoneChatSentAt } from '../../utils/chat/formatZoneChatSentAt';

type ZoneChatMessageBubbleProps = {
  authorNickname: string;
  text: string;
  sentAt: string;
  language?: string;
  isMine?: boolean;
};

export function ZoneChatMessageBubble({
  authorNickname,
  text,
  sentAt,
  language = 'ko',
  isMine = false,
}: ZoneChatMessageBubbleProps) {
  const timeLabel = formatZoneChatSentAt(sentAt, language);

  return (
    <View className={`mb-3 max-w-[88%] ${isMine ? 'self-end' : 'self-start'}`}>
      {!isMine ? (
        <Text className="mb-1 text-xs font-semibold text-brand-muted">{authorNickname}</Text>
      ) : null}
      <View className={`flex-row items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
        <View
          className={`max-w-full shrink rounded-2xl px-4 py-3 ${
            isMine
              ? 'rounded-br-md bg-brand-primary'
              : 'rounded-bl-md border border-brand-border bg-brand-surface'
          }`}>
          <Text className={`text-[15px] leading-[22px] ${isMine ? 'text-white' : 'text-brand-text'}`}>
            {text}
          </Text>
        </View>
        {timeLabel ? (
          <Text className="shrink-0 pb-0.5 text-[10px] text-brand-muted">{timeLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}
