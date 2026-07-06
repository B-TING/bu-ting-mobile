import { Pressable, Text, View } from 'react-native';

import { ScheduleTimelineRail } from './ScheduleTimelineRail';
import type { TravelLeg } from '../../../types/travelPlan';

type TravelLegRowProps = {
  leg: TravelLeg;
  directionsLabel: string;
  copy: { legWalk: string; legDrive: string; legTransit: string };
  lineColor?: string;
};

function modeLabel(leg: TravelLeg, copy: TravelLegRowProps['copy']) {
  if (leg.mode === 'walk') {
    return copy.legWalk;
  }
  if (leg.mode === 'drive') {
    return copy.legDrive;
  }
  return copy.legTransit;
}

function modeIcon(mode: TravelLeg['mode']) {
  if (mode === 'walk') {
    return '🚶';
  }
  if (mode === 'drive') {
    return '🚗';
  }
  return '🚌';
}

export function TravelLegRow({
  leg,
  directionsLabel,
  copy,
  lineColor = '#CBD5E1',
}: TravelLegRowProps) {
  return (
    <View className="flex-row items-stretch py-1">
      <ScheduleTimelineRail
        lineColor={lineColor}
        extendTop={14}
        extendBottom={14}
        dashed
        node={
          <View className="h-8 w-8 items-center justify-center rounded-full border border-brand-border bg-brand-surface">
            <Text>{modeIcon(leg.mode)}</Text>
          </View>
        }
      />
      <View className="flex-1 justify-center">
        <Text className="text-sm text-brand-muted">
          {modeLabel(leg, copy)} · {leg.durationMinutes} min · {leg.distanceKm} km
        </Text>
      </View>
      <Pressable hitSlop={8} className="self-center active:opacity-80">
        <Text className="text-sm font-semibold text-brand-primary">
          {directionsLabel}
        </Text>
      </Pressable>
    </View>
  );
}
