import { Text, View } from 'react-native';

import type { LucideIconName } from '../../../constants/icons';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { AppIcon } from '../icons/AppIcon';
import { cn } from '../../../utils/common/cn';

type FeatureHighlightCardProps = {
  icon: LucideIconName;
  title: string;
  description: string;
  emphasized?: boolean;
  grid?: boolean;
};

export function FeatureHighlightCard({
  icon,
  title,
  description,
  emphasized = false,
  grid = false,
}: FeatureHighlightCardProps) {
  return (
    <View
      style={grid ? { width: '48%' } : undefined}
      className={cn(
        'rounded-[20px] border border-brand-border bg-white px-4 py-4',
        grid ? 'mb-3' : 'mb-3 px-5',
        emphasized && 'border-brand-primary bg-brand-selected',
      )}>
      <View className="mb-2.5">
        <AppIcon name={icon} size={24} color={ICON_COLOR_PRIMARY} />
      </View>
      <Text
        className={cn(
          'mb-1 text-[16px] font-bold text-brand-text',
          emphasized && 'text-brand-primary',
        )}>
        {title}
      </Text>
      <Text className="text-sm leading-5 text-brand-muted">{description}</Text>
    </View>
  );
}
