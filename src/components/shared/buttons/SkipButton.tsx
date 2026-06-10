import { Pressable, Text } from 'react-native';

import { cn } from '../../../utils/cn';

type SkipButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function SkipButton({
  label,
  onPress,
  variant = 'primary',
}: SkipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      className={cn(
        'rounded-lg px-4 py-2.5 active:opacity-75',
        variant === 'primary'
          ? 'border-[1.5px] border-brand-skip-border bg-brand-skip-bg'
          : 'bg-transparent',
      )}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text
        className={cn(
          'text-[15px] font-bold',
          variant === 'primary' ? 'text-brand-skip-text' : 'text-brand-primary underline',
        )}>
        {label}
      </Text>
    </Pressable>
  );
}
