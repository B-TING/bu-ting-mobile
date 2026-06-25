import { Text, View } from 'react-native';

import { cn } from '../../../utils/common/cn';

type FeatureHighlightCardProps = {
  emoji: string;
  title: string;
  description: string;
  emphasized?: boolean;
};

export function FeatureHighlightCard({
  emoji,
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
      <Text className="mb-2 text-2xl">{emoji}</Text>
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
