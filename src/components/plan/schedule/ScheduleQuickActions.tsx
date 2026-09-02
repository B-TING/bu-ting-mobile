import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';

type ScheduleQuickActionsProps = {
  onOptimize: () => void;
  onAddPlace: () => void;
  optimizeLabel: string;
  addPlaceLabel: string;
  /** 지도 오버레이 — 패널 바깥 플로ating */
  compact?: boolean;
};

export function ScheduleQuickActions({
  onOptimize,
  onAddPlace,
  optimizeLabel,
  addPlaceLabel,
  compact = false,
}: ScheduleQuickActionsProps) {
  const iconButtonClass = compact
    ? 'rounded-full border bg-brand-surface/95 p-2 active:opacity-80'
    : 'rounded-full border p-2 active:opacity-80';

  const addPlaceClass = compact
    ? 'flex-row items-center gap-1.5 rounded-full border border-brand-primary bg-brand-surface/95 px-3 py-2 active:opacity-80'
    : 'flex-row items-center gap-1.5 rounded-full border border-brand-primary px-3 py-2 active:opacity-80';

  return (
    <View className="shrink-0 flex-row items-center gap-1.5">
      <Pressable
        onPress={onOptimize}
        accessibilityRole="button"
        accessibilityLabel={optimizeLabel}
        hitSlop={6}
        className={`${iconButtonClass} border-[#7C3AED]`}>
        <AppIcon name="rotateCw" size={compact ? 16 : 18} color="#7C3AED" strokeWidth={2.5} />
      </Pressable>

      <Pressable
        onPress={onAddPlace}
        accessibilityRole="button"
        accessibilityLabel={addPlaceLabel}
        hitSlop={6}
        className={addPlaceClass}>
        <AppIcon name="plus" size={compact ? 16 : 18} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
        <Text className="text-xs font-semibold text-brand-primary">{addPlaceLabel}</Text>
      </Pressable>
    </View>
  );
}
