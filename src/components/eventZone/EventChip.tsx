import { Text, View } from 'react-native';

import { cn } from '../../utils/common/cn';

export type EventChipVariant = 'event' | 'neutral' | 'muted';

type EventChipProps = {
  label: string;
  variant?: EventChipVariant;
};

// Figma: Chip — Event=#DB2777(bg) white(text), Neutral=#E8F4FC(bg) #0077B6(text), Muted=border+white(bg) #64748B(text)
const VARIANT_CLASS: Record<EventChipVariant, { wrap: string; text: string }> = {
  event: { wrap: 'bg-[#DB2777]', text: 'text-white' },
  neutral: { wrap: 'bg-[#E8F4FC]', text: 'text-[#0077B6]' },
  muted: { wrap: 'border border-[#E2E8F0] bg-white', text: 'text-[#64748B]' },
};

export function EventChip({ label, variant = 'event' }: EventChipProps) {
  const styles = VARIANT_CLASS[variant];

  return (
    <View className={cn('items-center justify-center rounded-2xl px-2.5 py-1', styles.wrap)}>
      <Text className={cn('text-[10px] font-bold leading-[14px]', styles.text)}>{label}</Text>
    </View>
  );
}
