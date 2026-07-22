import { Text, View, useWindowDimensions } from 'react-native';

import type { GuideRect } from './guideTypes';

type GuideTooltipProps = {
  title: string;
  description: string;
  targetRect: GuideRect | null;
};

const MARGIN = 16;
const TOOLTIP_MAX_WIDTH = 320;

/** 타깃 위/아래에 feature title·description 표시 */
export function GuideTooltip({ title, description, targetRect }: GuideTooltipProps) {
  const { width, height } = useWindowDimensions();
  const tooltipWidth = Math.min(TOOLTIP_MAX_WIDTH, width - MARGIN * 2);

  let top = height * 0.28;
  if (targetRect) {
    const below = targetRect.y + targetRect.height + 16;
    const above = targetRect.y - 120;
    top = below + 100 < height - 160 ? below : Math.max(MARGIN + 48, above);
  }

  const left = Math.max(MARGIN, (width - tooltipWidth) / 2);

  return (
    <View
      pointerEvents="none"
      className="absolute rounded-2xl bg-white px-4 py-3"
      style={{
        top,
        left,
        width: tooltipWidth,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 12,
      }}>
      <Text className="mb-1 text-base font-bold text-brand-text">{title}</Text>
      <Text className="text-sm leading-5 text-brand-muted">{description}</Text>
    </View>
  );
}
