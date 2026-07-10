import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { festivalTagLabel } from '../../../constants/festival/festivalCalendar';
import type { MockEvent } from '../../../constants/home/mainHome';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import type { AppLanguage } from '../../../types/user';
import { cn } from '../../../utils/common/cn';
import { AppIcon } from '../../shared/icons/AppIcon';

type EventsSectionMockProps = {
  title: string;
  viewAllLabel: string;
  events: MockEvent[];
  language?: AppLanguage;
  onViewAllPress?: () => void;
  onEventPress?: (id: string) => void;
};

function pickLocalizedEventField(
  event: MockEvent,
  field: 'title' | 'location' | 'date',
  language: AppLanguage,
): string {
  if (field === 'title') {
    if (language === 'ja') return event.titleJa;
    if (language === 'zh') return event.titleZh;
    if (language === 'en') return event.titleEn;
    return event.titleKo;
  }
  if (field === 'location') {
    if (language === 'ja') return event.locationJa;
    if (language === 'zh') return event.locationZh;
    if (language === 'en') return event.locationEn;
    return event.locationKo;
  }
  if (language === 'ja') return event.dateJa;
  if (language === 'zh') return event.dateZh;
  if (language === 'en') return event.dateEn;
  return event.dateKo;
}

function EventCard({
  event,
  language,
  onPress,
}: {
  event: MockEvent;
  language: AppLanguage;
  onPress?: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = pickLocalizedEventField(event, 'title', language);
  const location = pickLocalizedEventField(event, 'location', language);
  const date = pickLocalizedEventField(event, 'date', language);
  const hasImage = Boolean(event.imageUri) && !imageFailed;

  const body = (
    <View className="p-3">
      <View
        className={cn(
          'mb-2 self-start rounded-md px-2 py-0.5',
          event.tag === 'FESTIVAL' ? 'bg-brand-primary' : 'bg-orange-500',
        )}>
        <Text className="text-[10px] font-bold text-white">
          {festivalTagLabel(event.tag, language)}
        </Text>
      </View>
      <Text className="text-sm font-bold text-brand-text" numberOfLines={2}>
        {title}
      </Text>
      <Text className="mt-1 text-xs text-brand-muted">
        {location} • {date}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-[260px] overflow-hidden rounded-2xl border border-brand-border bg-brand-surface active:opacity-90"
      accessibilityRole="button">
      {hasImage ? (
        <ImageBackground
          source={{ uri: event.imageUri }}
          style={styles.imageHeader}
          imageStyle={styles.imageRadius}
          resizeMode="cover"
          onError={() => setImageFailed(true)}>
          <View style={styles.imageOverlay}>
            <View
              className={cn(
                'self-start rounded-md px-2 py-0.5',
                event.tag === 'FESTIVAL' ? 'bg-brand-primary' : 'bg-orange-500',
              )}>
              <Text className="text-[10px] font-bold text-white">
                {festivalTagLabel(event.tag, language)}
              </Text>
            </View>
            <Text className="mt-2 text-sm font-bold text-white" numberOfLines={2}>
              {title}
            </Text>
            <Text className="mt-1 text-xs font-medium text-white/90">
              {location} • {date}
            </Text>
          </View>
        </ImageBackground>
      ) : (
        <>
          <View
            className="h-32 items-center justify-center"
            style={{ backgroundColor: event.imageColor }}>
            <AppIcon name={event.imageIcon} size={40} color={ICON_COLOR_PRIMARY} />
          </View>
          {body}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  imageHeader: {
    height: 128,
    justifyContent: 'flex-end',
  },
  imageRadius: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageOverlay: {
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
});

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
    </View>
  );
}
