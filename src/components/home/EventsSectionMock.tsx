import { Pressable, ScrollView, Text, View } from 'react-native';

import type { MockEvent } from '../../constants/mainHome';
import { cn } from '../../utils/cn';

type EventsSectionMockProps = {
  title: string;
  viewAllLabel: string;
  events: MockEvent[];
  language?: 'ko' | 'en' | 'ja' | 'zh';
  onViewAllPress?: () => void;
  onEventPress?: (id: string) => void;
};

function EventCard({
  event,
  language,
  onPress,
}: {
  event: MockEvent;
  language: 'ko' | 'en' | 'ja' | 'zh';
  onPress?: () => void;
}) {
  const title = language === 'ko' ? event.titleKo : event.titleEn;
  const location = language === 'ko' ? event.locationKo : event.locationEn;
  const date = language === 'ko' ? event.dateKo : event.dateEn;

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-[260px] overflow-hidden rounded-2xl border border-brand-border bg-brand-surface active:opacity-90"
      accessibilityRole="button">
      <View
        className="h-32 items-center justify-center"
        style={{ backgroundColor: event.imageColor }}>
        <Text className="text-4xl">{event.imageEmoji}</Text>
      </View>
      <View className="p-3">
        <View
          className={cn(
            'mb-2 self-start rounded-md px-2 py-0.5',
            event.tag === 'FESTIVAL' ? 'bg-brand-primary' : 'bg-orange-500',
          )}>
          <Text className="text-[10px] font-bold text-white">{event.tag}</Text>
        </View>
        <Text className="text-sm font-bold text-brand-text" numberOfLines={2}>
          {title}
        </Text>
        <Text className="mt-1 text-xs text-brand-muted">
          {location} • {date}
        </Text>
      </View>
    </Pressable>
  );
}

export function EventsSectionMock({
  title,
  viewAllLabel,
  events,
  language = 'ko',
  onViewAllPress,
  onEventPress,
}: EventsSectionMockProps) {
  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-text">{title}</Text>
        <Pressable onPress={onViewAllPress} hitSlop={8} className="active:opacity-70">
          <Text className="text-sm font-semibold text-brand-muted">{viewAllLabel}</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}>
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            language={language}
            onPress={() => onEventPress?.(event.id)}
          />
        ))}
      </ScrollView>
      <Text className="mt-2 text-[10px] text-brand-muted">
        {language === 'ko'
          ? '축제 API 연동 전 목업 데이터입니다.'
          : 'Mock data until festival API is connected.'}
      </Text>
    </View>
  );
}
