import { Text, View } from 'react-native';

import type { AppLanguage } from '../../types/user';
import type { ZoneEvent } from '../../types/eventZone';
import { EVENT_PINK_DARK } from './eventZoneTheme';
import { EventRemainingLabel } from './EventRemainingLabel';

type EventMissionCardProps = {
  event: ZoneEvent;
  language: AppLanguage;
  endsInLabel: (remaining: string) => string;
  endedLabel: string;
};

// Figma MissionCard: bg-#FDF2F8 border-#F9A8D4, ⚡ icon + title(14px bold #BE185D), description(12px #9D174D), remaining(12px bold #DB2777)
export function EventMissionCard({
  event,
  language,
  endsInLabel,
  endedLabel,
}: EventMissionCardProps) {
  return (
    <View className="rounded-2xl border border-[#F9A8D4] bg-[#FDF2F8] px-3.5 py-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-[13px] leading-[18px] text-[#BE185D]">⚡</Text>
        <Text className="flex-1 text-[14px] font-bold leading-5 text-[#BE185D]" numberOfLines={2}>
          {event.titleKo}
        </Text>
      </View>
      <Text className="mt-1.5 text-xs leading-[17px] text-[#9D174D]">{event.descriptionKo}</Text>
      <EventRemainingLabel
        event={event}
        language={language}
        endsInLabel={endsInLabel}
        endedLabel={endedLabel}
      />
    </View>
  );
}
