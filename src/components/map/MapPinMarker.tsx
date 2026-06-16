import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { toMapCoordinate, type MapPoint } from '../../utils/mapRegion';

type MapPinMarkerProps = {
  point: MapPoint;
  active?: boolean;
  color: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  children: ReactNode;
  caption?: string;
};

export function MapPinMarker({
  point,
  active = false,
  color,
  onPress,
  accessibilityLabel,
  children,
  caption,
}: MapPinMarkerProps) {
  return (
    <Marker
      coordinate={toMapCoordinate(point)}
      onPress={onPress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
      accessibilityLabel={accessibilityLabel}>
      <View className="items-center">
        <View
          className="min-w-[44px] items-center justify-center rounded-full border-2 border-white px-2 py-1"
          style={{
            backgroundColor: color,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 3,
          }}>
          {children}
        </View>
        {active && caption ? (
          <View className="mt-1 max-w-[180px] rounded-md bg-white/95 px-2 py-0.5">
            <Text className="text-center text-[10px] font-bold text-brand-text" numberOfLines={2}>
              {caption}
            </Text>
          </View>
        ) : null}
      </View>
    </Marker>
  );
}
