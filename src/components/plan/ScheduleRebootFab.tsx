import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const FAB_SIZE = 56;
const GLOW_RING = 12;

type ScheduleRebootFabProps = {
  onPress: () => void;
  bottom: number;
};

export function ScheduleRebootFab({ onPress, bottom }: ScheduleRebootFabProps) {
  return (
    <View
      className="absolute right-4 z-20"
      style={{ bottom }}
      pointerEvents="box-none">
      <View style={styles.glowOuter}>
        <View style={styles.glowHalo} />
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Reboot"
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
          <LinearGradient
            colors={['#5DD5F3', '#0096C7', '#0077B6', '#023E8A']}
            locations={[0, 0.35, 0.7, 1]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.fab}>
            <View style={styles.shine} />
            <Text style={styles.label}>R</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowOuter: {
    width: FAB_SIZE + GLOW_RING * 2,
    height: FAB_SIZE + GLOW_RING * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowHalo: {
    position: 'absolute',
    width: FAB_SIZE + GLOW_RING,
    height: FAB_SIZE + GLOW_RING,
    borderRadius: (FAB_SIZE + GLOW_RING) / 2,
    backgroundColor: 'rgba(0, 180, 216, 0.28)',
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 14,
  },
  pressable: {
    borderRadius: FAB_SIZE / 2,
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 12,
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
    borderColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 4,
    left: 8,
    width: FAB_SIZE * 0.45,
    height: FAB_SIZE * 0.28,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  label: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: -1,
    textShadowColor: 'rgba(0, 60, 100, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
