import { StyleSheet, View } from 'react-native';

import { ICON_COLOR_WHITE } from '../../../constants/icons';
import { AnimatedFabPressable } from '../../shared/buttons/AnimatedFabPressable';
import { AppIcon } from '../../shared/icons/AppIcon';

const FAB_SIZE = 56;
const FAB_GAP = 12;

/** FAB 하단 기본 여백 (insets.bottom에 더해 사용) */
export const ROUTE_FAB_BOTTOM_OFFSET = 16;

export function routeFabBottom(bottomInset: number): number {
  return bottomInset + ROUTE_FAB_BOTTOM_OFFSET;
}

/** 일정 스크롤 하단 패딩 — FAB 2개 + safe area */
export function routeFabScrollPadding(bottomInset: number): number {
  return routeFabBottom(bottomInset) + FAB_SIZE + FAB_GAP + FAB_SIZE + 16;
}

type RouteOptimizeFabProps = {
  onPress: () => void;
  onAddPlace?: () => void;
  bottom: number;
  label: string;
  addPlaceLabel?: string;
  gap?: number;
};

export function RouteOptimizeFab({
  onPress,
  onAddPlace,
  bottom,
  label,
  addPlaceLabel,
  gap = FAB_GAP,
}: RouteOptimizeFabProps) {
  return (
    <View
      className="absolute right-4 z-20 items-center"
      style={{ bottom, gap }}
      pointerEvents="box-none">
      <AnimatedFabPressable
        onPress={onPress}
        accessibilityLabel={label}
        style={styles.optimizeShadow}>
        <View style={[styles.fab, styles.optimizeFab]}>
          <AppIcon name="rotateCw" size={26} color={ICON_COLOR_WHITE} strokeWidth={2.5} />
        </View>
      </AnimatedFabPressable>

      {onAddPlace ? (
        <AnimatedFabPressable
          onPress={onAddPlace}
          accessibilityLabel={addPlaceLabel ?? 'Add place'}
          style={styles.addShadow}>
          <View style={[styles.fab, styles.addFabBg]}>
            <AppIcon name="plus" size={28} color={ICON_COLOR_WHITE} strokeWidth={2.5} />
          </View>
        </AnimatedFabPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  optimizeShadow: {
    borderRadius: FAB_SIZE / 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  addShadow: {
    borderRadius: FAB_SIZE / 2,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  optimizeFab: {
    backgroundColor: '#7C3AED',
  },
  addFabBg: {
    backgroundColor: '#0077B6',
  },
});
