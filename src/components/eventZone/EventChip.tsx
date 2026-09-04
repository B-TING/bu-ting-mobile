import { Text, View } from 'react-native';

import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SELECTED,
  BRAND_SURFACE,
  EVENT_PINK,
} from './eventZoneTheme';

export type EventChipVariant = 'event' | 'neutral' | 'muted';

type EventChipProps = {
  label: string;
  variant?: EventChipVariant;
};

const VARIANT_STYLE: Record<
  EventChipVariant,
  {
    wrap: { backgroundColor: string; borderColor?: string; borderWidth?: number };
    text: { color: string };
  }
> = {
  event: { wrap: { backgroundColor: EVENT_PINK }, text: { color: '#FFFFFF' } },
  neutral: { wrap: { backgroundColor: BRAND_SELECTED }, text: { color: BRAND_PRIMARY } },
  muted: {
    wrap: { backgroundColor: BRAND_SURFACE, borderColor: BRAND_BORDER, borderWidth: 1 },
    text: { color: BRAND_MUTED },
  },
};

export function EventChip({ label, variant = 'event' }: EventChipProps) {
  const styles = VARIANT_STYLE[variant];

  return (
    <View
      className="items-center justify-center rounded-2xl px-2.5 py-1"
      style={styles.wrap}>
      <Text className="text-[10px] font-bold leading-[14px]" style={styles.text}>
        {label}
      </Text>
    </View>
  );
}
