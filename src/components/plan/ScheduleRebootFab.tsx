import { Pressable, Text, View } from 'react-native';

import { cn } from '../../utils/cn';

type ScheduleRebootFabProps = {
  enabled: boolean;
  label: string;
  onPress: () => void;
  bottom: number;
};

export function ScheduleRebootFab({
  enabled,
  label,
  onPress,
  bottom,
}: ScheduleRebootFabProps) {
  return (
    <View
      className="absolute right-4 z-20"
      style={{ bottom }}
      pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        className={cn(
          'items-center justify-center rounded-full px-4 py-3 shadow-lg active:opacity-90',
          enabled ? 'bg-brand-primary' : 'border-2 border-brand-primary bg-brand-surface',
        )}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
        }}>
        <Text
          className={cn(
            'text-sm font-bold',
            enabled ? 'text-white' : 'text-brand-primary',
          )}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
