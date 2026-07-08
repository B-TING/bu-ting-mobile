import { Pressable, Text, View } from 'react-native';

import {
  ICON_COLOR_PRIMARY,
} from '../../../constants/icons';
import { cn } from '../../../utils/common/cn';
import { AppIcon } from '../icons/AppIcon';

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
      <View className="mr-3.5 h-[22px] w-[22px] items-center justify-center">
        {selected ? (
          <AppIcon name="circleDot" size={22} color={ICON_COLOR_PRIMARY} />
        ) : (
          <AppIcon name="circle" size={22} color={ICON_COLOR_PRIMARY} />
        )}
      </View>
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
