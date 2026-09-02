import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ICON_COLOR_PRIMARY, ICON_COLOR_WHITE } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';

/** 액션 바 콘텐츠 높이 (pt-2 + py-2.5 버튼 행) */
export const SCHEDULE_ACTION_BAR_HEIGHT = 52;

type ScheduleActionBarProps = {
  onOptimize: () => void;
  onAddPlace: () => void;
  optimizeLabel: string;
  addPlaceLabel: string;
  /** Navbar·home indicator clearance — 버튼 아래 여백 */
  bottomInset?: number;
};

export function ScheduleActionBar({
  onOptimize,
  onAddPlace,
  optimizeLabel,
  addPlaceLabel,
  bottomInset = 0,
}: ScheduleActionBarProps) {
  return (
    <View
      className="flex-row gap-3 border-t border-brand-border bg-brand-surface px-4 pt-2"
      style={[styles.bar, bottomInset > 0 ? { paddingBottom: bottomInset } : undefined]}>
      <Pressable
        onPress={onOptimize}
        accessibilityRole="button"
        accessibilityLabel={optimizeLabel}
        className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-[#7C3AED] bg-[#F5F3FF] py-2.5 active:opacity-90">
        <AppIcon name="rotateCw" size={18} color="#7C3AED" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-[#7C3AED]">{optimizeLabel}</Text>
      </Pressable>

      <Pressable
        onPress={onAddPlace}
        accessibilityRole="button"
        accessibilityLabel={addPlaceLabel}
        className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand-primary py-2.5 active:opacity-90"
        style={styles.addShadow}>
        <AppIcon name="plus" size={20} color={ICON_COLOR_WHITE} strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-white">{addPlaceLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  addShadow: {
    shadowColor: ICON_COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});
