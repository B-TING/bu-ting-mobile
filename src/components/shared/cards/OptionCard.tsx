import { Pressable, Text, View } from 'react-native';

import { cn } from '../../../utils/common/cn';

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
};

export function OptionCard({
  label,
  selected,
  onPress,
  compact = false,
}: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mb-3 flex-row items-center rounded-2xl border-2 border-brand-border bg-brand-surface px-5 active:opacity-90',
        compact ? 'py-3.5' : 'py-[18px]',
        selected && 'border-brand-primary bg-brand-selected',
      )}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <View
        className={cn(
          'mr-3.5 h-[22px] w-[22px] rounded-full border-2 border-brand-border',
          selected && 'border-brand-primary bg-brand-primary',
        )}
      />
      <Text
        className={cn(
          'flex-1 text-[17px] font-medium text-brand-text',
          selected && 'font-semibold text-brand-primary',
        )}>
        {label}
      </Text>
    </Pressable>
  );
}
