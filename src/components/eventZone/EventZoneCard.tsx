import { Pressable, Text, View } from 'react-native';

import { EventActionButton } from './EventActionButton';
import { EventChip } from './EventChip';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SLATE,
  BRAND_SURFACE,
  BRAND_TEXT,
  EVENT_PINK_BG,
  EVENT_PINK_BORDER,
  EVENT_PINK_DARK,
} from './eventZoneTheme';

type EventZoneCardProps = {
  zoneName: string;
  summary?: string;
  landmarks?: string;
  membersLabel: string;
  joinLabel: string;
  isEvent?: boolean;
  eventChipLabel?: string;
  onPress: () => void;
  onJoin: () => void;
};

export function EventZoneCard({
  zoneName,
  summary,
  landmarks,
  membersLabel,
  joinLabel,
  isEvent = false,
  eventChipLabel,
  onPress,
  onJoin,
}: EventZoneCardProps) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border p-3.5"
      style={{
        borderColor: isEvent ? EVENT_PINK_BORDER : BRAND_BORDER,
        backgroundColor: isEvent ? EVENT_PINK_BG : BRAND_SURFACE,
      }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="min-w-0 flex-1 active:opacity-80">
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Text
            className="text-[15px] font-bold leading-[21px]"
            style={{ color: BRAND_TEXT }}
            numberOfLines={1}>
            {zoneName}
          </Text>
          {isEvent && eventChipLabel ? <EventChip label={eventChipLabel} variant="event" /> : null}
        </View>
        {summary ? (
          <Text
            className="mt-0.5 text-xs leading-[17px]"
            style={{ color: isEvent ? EVENT_PINK_DARK : BRAND_MUTED }}
            numberOfLines={2}>
            {summary}
          </Text>
        ) : null}
        {landmarks ? (
          <Text
            className="mt-1 text-[11px] leading-[15px]"
            style={{ color: BRAND_SLATE }}
            numberOfLines={1}>
            {landmarks}
          </Text>
        ) : null}
        <Text
          className="mt-1 text-[11px] font-bold leading-[15px]"
          style={{ color: BRAND_PRIMARY }}>
          {membersLabel}
        </Text>
      </Pressable>
      <View className="min-w-[72px]">
        <EventActionButton label={joinLabel} variant="primary" onPress={onJoin} />
      </View>
    </View>
  );
}
