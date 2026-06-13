import { Text, TextInput, View } from 'react-native';

import type { FESTIVAL_CALENDAR_COPY } from '../../constants/festivalCalendar';

type Copy = (typeof FESTIVAL_CALENDAR_COPY)['ko'];

type FestivalCommentsPlaceholderProps = {
  copy: Copy;
  embedded?: boolean;
};

export function FestivalCommentsPlaceholder({ copy, embedded }: FestivalCommentsPlaceholderProps) {
  return (
    <View
      className={`bg-brand-surface px-4 py-5${embedded ? '' : ' border-t border-brand-border'}`}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-text">{copy.commentsTitle}</Text>
        <View className="rounded-full bg-brand-selected px-2.5 py-1">
          <Text className="text-[10px] font-semibold text-brand-muted">
            {copy.commentsComingSoon}
          </Text>
        </View>
      </View>

      <View className="mb-4 flex-row gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-selected">
          <Text className="text-sm">👤</Text>
        </View>
        <View className="min-h-[72px] flex-1 justify-center rounded-xl border border-brand-border bg-brand-background px-3 py-2 opacity-60">
          <TextInput
            editable={false}
            placeholder={copy.commentPlaceholder}
            placeholderTextColor="#94A3B8"
            multiline
            className="text-sm text-brand-text"
          />
        </View>
      </View>

      <View className="items-center rounded-xl border border-dashed border-brand-border py-8">
        <Text className="text-2xl opacity-40">💬</Text>
        <Text className="mt-2 text-sm text-brand-muted">{copy.commentsEmpty}</Text>
      </View>
    </View>
  );
}
