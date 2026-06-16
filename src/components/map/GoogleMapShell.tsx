import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

import { regionFromPoints, type MapPoint } from '../../utils/mapRegion';

export type GoogleMapShellSize = 'compact' | 'fullscreen' | 'fill';

type GoogleMapShellProps = {
  points: MapPoint[];
  focusPoint?: MapPoint | null;
  size?: GoogleMapShellSize;
  onPress?: () => void;
  tapHint?: string;
  footer?: { title: string; subtitle: string };
  emptySubtitle?: string;
  children?: ReactNode;
  /** true면 points 변경 시 카메라 region 자동 조정 (일정 지도) */
  followPoints?: boolean;
};

function pointsSignature(points: MapPoint[]): string {
  return points.map(point => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join('|');
}

export function GoogleMapShell({
  points,
  focusPoint,
  size = 'compact',
  onPress,
  tapHint,
  footer,
  emptySubtitle,
  children,
  followPoints = false,
}: GoogleMapShellProps) {
  const mapRef = useRef<MapView>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const mapWidth = size === 'fullscreen' ? screenWidth : screenWidth - (size === 'fill' ? 0 : 48);
  const mapHeight =
    size === 'fullscreen' ? screenHeight * 0.72 : size === 'fill' ? undefined : 160;

  const region = useMemo(
    () => regionFromPoints(points, focusPoint ? { focus: focusPoint } : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature stabilizes point changes
    [pointsSignature(points), focusPoint?.lat, focusPoint?.lng],
  );

  const regionSyncKey = pointsSignature(points);

  useEffect(() => {
    if (!followPoints || points.length === 0) {
      return;
    }
    mapRef.current?.animateToRegion(region, 280);
  }, [followPoints, points.length, region, regionSyncKey]);

  if (points.length === 0) {
    return (
      <View className="items-center justify-center rounded-2xl border border-brand-border bg-[#E8F0F8] p-6">
        <Text className="text-sm text-brand-muted">{emptySubtitle ?? footer?.subtitle}</Text>
      </View>
    );
  }

  const interactive = size !== 'compact' || !onPress;
  const mapBody = (
    <View
      className={
        size === 'fullscreen' || size === 'fill'
          ? 'flex-1 bg-[#E8F0F8]'
          : 'overflow-hidden rounded-2xl border border-brand-border bg-[#E8F0F8]'
      }>
      <View
        style={size === 'fill' ? { flex: 1, width: '100%' } : { width: '100%', height: mapHeight }}
        className="relative">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ width: mapWidth, height: size === 'fill' ? '100%' : mapHeight }}
          initialRegion={region}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          rotateEnabled={interactive}
          pitchEnabled={false}
          toolbarEnabled={false}
          liteMode={Platform.OS === 'android' && size === 'compact'}>
          {children}
        </MapView>
        {onPress && tapHint && size === 'compact' ? (
          <View
            pointerEvents="none"
            className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-1">
            <Text className="text-[10px] font-semibold text-white">{tapHint}</Text>
          </View>
        ) : null}
      </View>
      {footer ? (
        <View className="border-t border-brand-border bg-brand-surface px-3 py-2">
          <Text className="text-xs font-semibold text-brand-text">{footer.title}</Text>
          <Text className="text-[11px] text-brand-muted">{footer.subtitle}</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress && size === 'compact') {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {mapBody}
      </Pressable>
    );
  }

  return mapBody;
}
