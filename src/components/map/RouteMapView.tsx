import { Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { RouteItem } from '../../types/travelPlan';
import { toMapCoordinate } from '../../utils/mapRegion';
import { GoogleMapShell } from './GoogleMapShell';

type RouteMapViewProps = {
  title: string;
  subtitle: string;
  routes: RouteItem[];
  highlightItemId?: string | null;
  size?: 'compact' | 'fullscreen' | 'fill';
  onPress?: () => void;
  tapHint?: string;
  /** false면 지도 하단 타이틀 바 숨김 (상세 모달 등) */
  showFooter?: boolean;
};

export function RouteMapView({
  title,
  subtitle,
  routes,
  highlightItemId,
  size = 'compact',
  onPress,
  tapHint,
  showFooter = true,
}: RouteMapViewProps) {
  const points = routes.map(route => route.location);
  const focusPoint = highlightItemId
    ? routes.find(route => route.itemId === highlightItemId)?.location
    : undefined;
  const pinSize = size === 'fullscreen' ? 36 : 28;

  return (
    <GoogleMapShell
      points={points}
      focusPoint={focusPoint}
      size={size}
      onPress={onPress}
      tapHint={tapHint}
      emptySubtitle={subtitle}
      footer={showFooter ? { title, subtitle } : undefined}>
      {routes.map((route, index) => {
        const active = route.itemId === highlightItemId;
        return (
          <Marker
            key={route.itemId}
            coordinate={toMapCoordinate(route.location)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}>
            <View
              className="items-center justify-center rounded-full border-2 border-white"
              style={{
                width: pinSize,
                height: pinSize,
                backgroundColor: active ? '#0077B6' : '#4285F4',
              }}>
              <Text
                className="font-bold text-white"
                style={{ fontSize: size === 'fullscreen' ? 14 : 11 }}>
                {index + 1}
              </Text>
            </View>
          </Marker>
        );
      })}
    </GoogleMapShell>
  );
}
