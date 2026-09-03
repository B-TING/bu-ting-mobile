import { Pressable, Text } from 'react-native';

import { cn } from '../../utils/common/cn';

export type EventActionButtonVariant = 'event' | 'primary' | 'ghost' | 'disabled';

type EventActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: EventActionButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
};

// Figma Button: Primary=bg-#0077B6, Event=bg-#DB2777, Ghost=border-#E2E8F0 bg-white text-#1E293B, Disabled=bg-#E2E8F0 text-#64748B
// min-h=48, rounded-xl(12px), text 15px bold
const VARIANT_CLASS: Record<
  EventActionButtonVariant,
  { wrap: string; text: string }
> = {
  event: { wrap: 'bg-[#DB2777]', text: 'text-white' },
  primary: { wrap: 'bg-[#0077B6]', text: 'text-white' },
  ghost: {
    wrap: 'border border-[#E2E8F0] bg-white',
    text: 'text-[#1E293B]',
  },
  disabled: {
    wrap: 'bg-[#E2E8F0]',
    text: 'text-[#64748B]',
  },
};

export function EventActionButton({
  label,
  onPress,
  variant = 'event',
  disabled = false,
  accessibilityLabel,
}: EventActionButtonProps) {
  const effectiveVariant = disabled ? 'disabled' : variant;
  const styles = VARIANT_CLASS[effectiveVariant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'min-h-[48px] items-center justify-center rounded-xl px-4 py-3 active:opacity-90',
        styles.wrap,
        disabled && 'opacity-60',
      )}>
      <Text className={cn('text-[15px] font-bold leading-[21px]', styles.text)}>{label}</Text>
    </Pressable>
  );
}
