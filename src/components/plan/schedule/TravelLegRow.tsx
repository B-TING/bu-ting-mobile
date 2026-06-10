import { Pressable, Text, View } from 'react-native';

import type { TravelLeg } from '../../../types/travelPlan';

type TravelLegRowProps = {
  leg: TravelLeg;
  directionsLabel: string;
  copy: { legWalk: string; legDrive: string; legTransit: string };
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

export function TravelLegRow({ leg, directionsLabel, copy }: TravelLegRowProps) {
  return (
    <View className="my-2 flex-row items-center py-1">
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-brand-selected">
        <Text>{modeIcon(leg.mode)}</Text>
      </View>
      <Text className="flex-1 text-sm text-brand-muted">
        {modeLabel(leg, copy)} · {leg.durationMinutes} min · {leg.distanceKm} km
      </Text>
      <Pressable hitSlop={8} className="active:opacity-80">
        <Text className="text-sm font-semibold text-brand-primary">
          {directionsLabel}
        </Text>
      </Pressable>
    </View>
  );
}
