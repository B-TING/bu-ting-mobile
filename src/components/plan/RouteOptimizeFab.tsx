import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const FAB_SIZE = 56;
const FAB_GAP = 12;

type RouteOptimizeFabProps = {
  onPress: () => void;
  onAddPlace?: () => void;
  bottom: number;
  label: string;
  addPlaceLabel?: string;
  /** 두 FAB 사이 간격 (px). StyleSheet 밖에서 적용해야 값 변경이 바로 반영됩니다. */
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
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        <LinearGradient
          colors={['#A78BFA', '#7C3AED', '#5B21B6']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}>
          <Text style={styles.icon}>↻</Text>
        </LinearGradient>
      </Pressable>

      {onAddPlace ? (
        <Pressable
          onPress={onAddPlace}
          accessibilityRole="button"
          accessibilityLabel={addPlaceLabel ?? 'Add place'}
          style={({ pressed }) => [
            styles.pressable,
            styles.addFab,
            pressed && styles.pressed,
          ]}>
          <LinearGradient
            colors={['#5DD5F3', '#0096C7', '#0077B6']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}>
            <Text style={styles.addIcon}>+</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: FAB_SIZE / 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  addFab: {
    shadowColor: '#0077B6',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
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
  icon: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addIcon: {
    fontSize: 30,
    fontWeight: '300',
    color: '#FFFFFF',
    marginTop: -2,
  },
});
