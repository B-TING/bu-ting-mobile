import { Pressable, Text } from 'react-native';

import { cn } from '../../utils/cn';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'items-center rounded-2xl py-4',
        disabled ? 'bg-brand-border' : 'bg-brand-primary active:opacity-90',
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled }}>
      <Text
        className={cn(
          'text-[17px] font-bold',
          disabled ? 'text-slate-400' : 'text-white',
        )}>
        {label}
      </Text>
    </Pressable>
  );
}
