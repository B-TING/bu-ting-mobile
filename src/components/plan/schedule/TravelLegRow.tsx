import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ScheduleTimelineRail } from './ScheduleTimelineRail';

type TravelLegRowProps = {
  directionsLabel: string;
  lineColor?: string;
  onDirectionsPress?: () => void;
  directionsDisabled?: boolean;
};

export function TravelLegRow({
  directionsLabel,
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
            <AppIcon name="map" size={16} color={ICON_COLOR_MUTED} />
          </View>
        }
      />
      <View className="flex-1 justify-center pl-1">
        <Pressable
          disabled={directionsDisabled}
          onPress={onDirectionsPress}
          className={`self-start flex-row items-center rounded-lg border px-2 py-1 active:opacity-90 ${
            directionsDisabled
              ? 'border-brand-border bg-brand-background'
              : 'border-brand-primary bg-brand-selected'
          }`}>
          <AppIcon
            name="map"
            size={13}
            color={directionsDisabled ? ICON_COLOR_MUTED : ICON_COLOR_PRIMARY}
          />
          <Text
            className={`ml-1 text-xs font-semibold ${
              directionsDisabled ? 'text-brand-muted' : 'text-brand-primary'
            }`}>
            {directionsLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
