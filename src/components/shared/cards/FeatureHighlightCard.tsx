import { Pressable, Text, View } from 'react-native';

import type { LucideIconName } from '../../../constants/icons';
import { AppIcon } from '../icons/AppIcon';
import { cn } from '../../../utils/common/cn';

type FeatureHighlightCardProps = {
  icon: LucideIconName;
  title: string;
  description: string;
  emphasized?: boolean;
};

export function FeatureHighlightCard({
  icon,
  title,
  description,
  emphasized = false,
}: FeatureHighlightCardProps) {
  return (
    <View
      className={cn(
        'mb-3 rounded-2xl border-2 border-brand-border bg-brand-surface px-5 py-4',
        emphasized && 'border-brand-primary bg-brand-selected',
      )}>
      <View className="mb-2">
        <AppIcon name={icon} size={28} />
      </View>
      <Text
        className={cn(
          'mb-1.5 text-[17px] font-semibold text-brand-text',
          emphasized && 'text-brand-primary',
        )}>
        {title}
      </Text>
      <Text className="text-[15px] leading-[22px] text-brand-muted">{description}</Text>
    </View>
  );
}
