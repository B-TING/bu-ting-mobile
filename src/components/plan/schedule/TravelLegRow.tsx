import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_MUTED, TRANSPORT_MODE_ICONS } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ScheduleTimelineRail } from './ScheduleTimelineRail';
import type { TravelLegMode } from '../../../types/travelPlan';

type TravelLegRowProps = {
  mode: TravelLegMode;
  directionsLabel: string;
  copy: { legWalk: string; legDrive: string; legTransit: string };
  lineColor?: string;
  onDirectionsPress?: () => void;
  directionsDisabled?: boolean;
};

function modeLabel(mode: TravelLegMode, copy: TravelLegRowProps['copy']) {
  if (mode === 'walk') {
    return copy.legWalk;
  }
  if (mode === 'drive') {
    return copy.legDrive;
  }
  return copy.legTransit;
}

function modeIcon(mode: TravelLegMode) {
  return TRANSPORT_MODE_ICONS[mode];
}

export function TravelLegRow({
  mode,
  directionsLabel,
  copy,
  lineColor = '#CBD5E1',
  onDirectionsPress,
  directionsDisabled = false,
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
            <AppIcon name={modeIcon(mode)} size={16} color={ICON_COLOR_MUTED} />
          </View>
        }
      />
      <View className="flex-1 justify-center">
        <Text className="text-sm text-brand-muted">{modeLabel(mode, copy)}</Text>
      </View>
      <Pressable
        hitSlop={8}
        disabled={directionsDisabled}
        onPress={onDirectionsPress}
        className="self-center active:opacity-80">
        <Text
          className={`text-sm font-semibold ${
            directionsDisabled ? 'text-brand-muted' : 'text-brand-primary'
          }`}>
          {directionsLabel}
        </Text>
      </Pressable>
    </View>
  );
}
