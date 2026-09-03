import { Text, View } from 'react-native';

import { AppIcon } from '../shared/icons/AppIcon';
import type { AppLanguage } from '../../types/user';
import type { ZoneEvent } from '../../types/eventZone';
import {
  formatZoneEventRemaining,
  useZoneEventRemaining,
} from '../../utils/eventZone/zoneEventRemaining';
import { EVENT_PINK } from './eventZoneTheme';

type EventRemainingLabelProps = {
  event: ZoneEvent;
  language: AppLanguage;
  endsInLabel: (remaining: string) => string;
  endedLabel: string;
};

export function EventRemainingLabel({
  event,
  language,
  endsInLabel,
  endedLabel,
}: EventRemainingLabelProps) {
  const remainingMs = useZoneEventRemaining(event);
  const remainingText = formatZoneEventRemaining(remainingMs, language);

  return (
    <View className="mt-1.5 flex-row items-center gap-1.5">
      <AppIcon name="timer" size={12} color={EVENT_PINK} />
      <Text className="text-xs font-semibold" style={{ color: EVENT_PINK }}>
        {remainingMs > 0 ? endsInLabel(remainingText) : endedLabel}
      </Text>
    </View>
  );
}
