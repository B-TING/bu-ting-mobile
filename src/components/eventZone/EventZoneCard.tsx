import { Pressable, Text, View } from 'react-native';

import { EventActionButton } from './EventActionButton';
import { EventChip } from './EventChip';

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

// Figma ZoneCard: Default=bg-white border-#E2E8F0, Event=bg-#FDF2F8 border-#F9A8D4
// title 15px bold #1E293B, topic 12px regular (default:#64748B, event:#BE185D), members 11px bold #0077B6
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
      className={
        isEvent
          ? 'flex-row items-center gap-3 rounded-2xl border border-[#F9A8D4] bg-[#FDF2F8] p-3.5'
          : 'flex-row items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5'
      }>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="min-w-0 flex-1 active:opacity-80">
        {/* 구역명 + 이벤트 칩 */}
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Text className="text-[15px] font-bold leading-[21px] text-[#1E293B]" numberOfLines={1}>
            {zoneName}
          </Text>
          {isEvent && eventChipLabel ? <EventChip label={eventChipLabel} variant="event" /> : null}
        </View>
        {/* 소개 문구 */}
        {summary ? (
          <Text
            className={isEvent ? 'mt-0.5 text-xs leading-[17px] text-[#BE185D]' : 'mt-0.5 text-xs leading-[17px] text-[#64748B]'}
            numberOfLines={2}>
            {summary}
          </Text>
        ) : null}
        {/* 대표 관광지 */}
        {landmarks ? (
          <Text className="mt-1 text-[11px] leading-[15px] text-[#94A3B8]" numberOfLines={1}>
            {landmarks}
          </Text>
        ) : null}
        {/* 채팅 인원 */}
        <Text className="mt-1 text-[11px] font-bold leading-[15px] text-[#0077B6]">
          {membersLabel}
        </Text>
      </Pressable>
      <View className="min-w-[72px]">
        <EventActionButton label={joinLabel} variant="primary" onPress={onJoin} />
      </View>
    </View>
  );
}
