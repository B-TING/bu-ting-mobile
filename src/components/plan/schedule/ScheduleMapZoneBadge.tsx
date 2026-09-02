import { StyleSheet, Text, View } from 'react-native';

type ScheduleMapZoneBadgeProps = {
  zoneLabel?: string | null;
  durationLabel?: string | null;
};

export function ScheduleMapZoneBadge({ zoneLabel, durationLabel }: ScheduleMapZoneBadgeProps) {
  if (!zoneLabel && !durationLabel) {
    return null;
  }

  return (
    <View className="items-end gap-0.5 rounded-lg bg-brand-surface/95 px-2.5 py-1.5" style={styles.badge}>
      {zoneLabel ? (
        <Text className="text-xs font-semibold text-brand-primary">{zoneLabel}</Text>
      ) : null}
      {durationLabel ? (
        <Text className="text-xs font-semibold text-brand-muted">{durationLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
});
