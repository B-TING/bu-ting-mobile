import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_WHITE } from '../../constants/icons';
import type { AppLanguage } from '../../types/user';
import type { ZoneEvent } from '../../types/eventZone';
import {
  formatZoneEventRemaining,
  useZoneEventRemaining,
} from '../../utils/eventZone/zoneEventRemaining';
import { AppIcon } from '../shared/icons/AppIcon';

type EventRemainingLabelProps = {
  event: ZoneEvent;
  language: AppLanguage;
  endsInLabel: (remaining: string) => string;
  endedLabel: string;
};

function EventRemainingLabel({
  event,
  language,
  endsInLabel,
  endedLabel,
}: EventRemainingLabelProps) {
  const remainingMs = useZoneEventRemaining(event);
  const remainingText = formatZoneEventRemaining(remainingMs, language);

  return (
    <View className="mt-1 flex-row items-center gap-1.5">
      <AppIcon name="timer" size={12} color="#DB2777" />
      <Text className="text-xs font-semibold text-pink-600">
        {remainingMs > 0 ? endsInLabel(remainingText) : endedLabel}
      </Text>
    </View>
  );
}

type EventGameBannerProps = {
  event: ZoneEvent;
  language: AppLanguage;
  actionLabel: string;
  endsInLabel: (remaining: string) => string;
  endedLabel: string;
  onPress: () => void;
};

/** 존 확장 시 선택된 존의 활성 이벤트 게임 배너 */
export function EventGameBanner({
  event,
  language,
  actionLabel,
  endsInLabel,
  endedLabel,
  onPress,
}: EventGameBannerProps) {
  return (
    <View className="mx-3 flex-row items-center gap-2 rounded-2xl border border-pink-200 bg-pink-50 px-3 py-2.5 shadow-sm">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-pink-600">
        <AppIcon name="zap" size={16} color={ICON_COLOR_WHITE} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-xs font-bold text-pink-800" numberOfLines={1}>
          {event.titleKo}
        </Text>
        <Text className="mt-0.5 text-[11px] leading-snug text-pink-900" numberOfLines={2}>
          {event.descriptionKo}
        </Text>
        <EventRemainingLabel
          event={event}
          language={language}
          endsInLabel={endsInLabel}
          endedLabel={endedLabel}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onPress}
        className="rounded-full bg-pink-600 px-3 py-2 active:opacity-90">
        <Text className="text-[11px] font-bold text-white">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
