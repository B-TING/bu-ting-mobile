import { Pressable, Text, View } from 'react-native';

import { useCopy } from '../../i18n';
import { cn } from '../../utils/common/cn';

type EventZoneLayerToggleProps = {
  visible: boolean;
  onToggle: () => void;
};

export function EventZoneLayerToggle({
  visible,
  onToggle,
}: EventZoneLayerToggleProps) {
  const copy = useCopy('eventZoneMapLayer');

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      className="active:opacity-85"
      accessibilityRole="switch"
      accessibilityState={{ checked: visible }}>
      <View
        className={cn(
          'flex-row items-center rounded-full border px-3 py-2 shadow-sm',
          visible
            ? 'border-brand-primary bg-brand-primary'
            : 'border-brand-border bg-white/95',
        )}>
        <View
          className={cn(
            'mr-2 h-2.5 w-2.5 rounded-full',
            visible ? 'bg-white' : 'bg-brand-muted',
          )}
        />
        <Text
          className={cn(
            'text-xs font-semibold',
            visible ? 'text-white' : 'text-brand-text',
          )}>
          {visible ? copy.hideZones : copy.showZones}
        </Text>
      </View>
    </Pressable>
  );
}
