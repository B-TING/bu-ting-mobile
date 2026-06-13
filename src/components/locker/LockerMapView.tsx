import { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, useWindowDimensions, View } from 'react-native';

import type { SubwayLockerStation } from '../../types/subwayLocker';

type LockerMapViewProps = {
  stations: SubwayLockerStation[];
  selectedId?: string | null;
  lineLabel?: (line: number) => string;
  onSelectStation?: (station: SubwayLockerStation) => void;
  mapTitle: string;
  mapSubtitle: string;
  pinA11y: (name: string, count: number) => string;
};

function project(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  width: number,
  height: number,
) {
  const latSpan = bounds.maxLat - bounds.minLat || 0.01;
  const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
  const x = ((lng - bounds.minLng) / lngSpan) * (width - 24) + 12;
  const y = (1 - (lat - bounds.minLat) / latSpan) * (height - 24) + 12;
  return { left: x, top: y };
}

export function LockerMapView({
  stations,
  selectedId,
  onSelectStation,
  mapTitle,
  mapSubtitle,
  pinA11y,
  lineLabel,
}: LockerMapViewProps) {
  const { width: screenWidth } = useWindowDimensions();
  const mapWidth = screenWidth;
  const [mapHeight, setMapHeight] = useState(280);

  const handleMapLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight > 0) {
      setMapHeight(nextHeight);
    }
  };

  if (stations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-[#E8F4E8]">
        <Text className="text-sm text-brand-muted">{mapSubtitle}</Text>
      </View>
    );
  }

  const focused = selectedId ? stations.find(s => s.id === selectedId) : undefined;

  const bounds = focused
    ? {
        minLat: focused.location.lat - 0.012,
        maxLat: focused.location.lat + 0.012,
        minLng: focused.location.lng - 0.018,
        maxLng: focused.location.lng + 0.018,
      }
    : (() => {
        const lats = stations.map(s => s.location.lat);
        const lngs = stations.map(s => s.location.lng);
        return {
          minLat: Math.min(...lats) - 0.01,
          maxLat: Math.max(...lats) + 0.01,
          minLng: Math.min(...lngs) - 0.01,
          maxLng: Math.max(...lngs) + 0.01,
        };
      })();

  return (
    <View className="flex-1 bg-[#E8F4E8]">
      <View className="relative flex-1" onLayout={handleMapLayout}>
        <View className="absolute inset-0 opacity-30">
          {Array.from({ length: 10 }).map((_, row) => (
            <View key={row} className="flex-1 flex-row">
              {Array.from({ length: 8 }).map((__, col) => (
                <View key={col} className="flex-1 border border-[#C8E6C9]" />
              ))}
            </View>
          ))}
        </View>

        {stations.map(station => {
          const active = station.id === selectedId;
          const pos = project(
            station.location.lat,
            station.location.lng,
            bounds,
            mapWidth,
            mapHeight,
          );
          const countLabel =
            station.lockers.total >= 100
              ? '99+'
              : String(station.lockers.total);

          return (
            <Pressable
              key={station.id}
              onPress={() => onSelectStation?.(station)}
              accessibilityRole="button"
              accessibilityLabel={pinA11y(station.name, station.lockers.total)}
              className="absolute items-center"
              style={{ left: pos.left - 22, top: pos.top - 28 }}>
              <View
                className="min-w-[44px] items-center justify-center rounded-full border-2 border-white px-2 py-1"
                style={{
                  backgroundColor: active ? '#0077B6' : '#03C75A',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 3,
                }}>
                <Text className="text-[10px]">🧳</Text>
                <Text className="text-[11px] font-bold text-white">{countLabel}</Text>
              </View>
              {active ? (
                <View className="mt-1 rounded-md bg-white/95 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-brand-text">
                    {lineLabel ? `${station.name} · ${lineLabel(station.line)}` : station.name}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}

        <View className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1">
          <Text className="text-[10px] font-bold text-[#03C75A]">NAVER</Text>
        </View>
      </View>

      <View className="border-t border-brand-border bg-brand-surface px-3 py-2">
        <Text className="text-xs font-semibold text-brand-text">{mapTitle}</Text>
        <Text className="text-[11px] text-brand-muted">{mapSubtitle}</Text>
      </View>
    </View>
  );
}
