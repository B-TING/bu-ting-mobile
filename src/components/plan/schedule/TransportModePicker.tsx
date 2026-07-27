import { Pressable, Text, View } from 'react-native';

import {
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
  TRANSPORT_MODE_ICONS,
} from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';
import type { TravelLegMode } from '../../../types/travelPlan';

type TransportModePickerProps = {
  value: TravelLegMode;
  onChange: (mode: TravelLegMode) => void;
  labels: { walk: string; drive: string; transit: string };
  title?: string;
};

const MODES: TravelLegMode[] = ['walk', 'transit', 'drive'];

export function TransportModePicker({
  value,
  onChange,
  labels,
  title,
}: TransportModePickerProps) {
  const labelFor = (mode: TravelLegMode) => {
    if (mode === 'walk') {
      return labels.walk;
    }
    if (mode === 'drive') {
      return labels.drive;
    }
    return labels.transit;
  };

  return (
    <View>
      {title ? (
        <Text className="mb-2 text-sm font-semibold text-brand-muted">{title}</Text>
      ) : null}
      <View className="flex-row gap-2">
        {MODES.map(id => {
          const selected = value === id;
          return (
            <Pressable
              key={id}
              onPress={() => onChange(id)}
              className={`flex-1 items-center rounded-xl border px-2 py-2.5 active:opacity-90 ${
                selected
                  ? 'border-brand-primary bg-brand-selected'
                  : 'border-brand-border bg-brand-surface'
              }`}>
              <AppIcon
                name={TRANSPORT_MODE_ICONS[id]}
                size={22}
                color={selected ? ICON_COLOR_PRIMARY : ICON_COLOR_MUTED}
              />
              <Text
                className={`mt-0.5 text-[11px] font-semibold ${
                  selected ? 'text-brand-primary' : 'text-brand-muted'
                }`}>
                {labelFor(id)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
