import { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, useWindowDimensions, View } from 'react-native';

import type { BusanAccommodation } from '../../types/accommodation';
import type { AppLanguage } from '../../types/user';
import { localizedAreaName } from '../../constants/accommodation';

type AccommodationMapViewProps = {
  stays: BusanAccommodation[];
  selectedId?: string | null;
  language: AppLanguage;
  onSelectStay?: (stay: BusanAccommodation) => void;
  mapTitle: string;
  mapSubtitle: string;
  pinA11y: (name: string, rating: number) => string;
  areaLabel: (area: string) => string;
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

export function AccommodationMapView({
  stays,
  selectedId,
  language,
  onSelectStay,
  mapTitle,
  mapSubtitle,
  pinA11y,
  areaLabel,
}: AccommodationMapViewProps) {
  const { width: screenWidth } = useWindowDimensions();
  const mapWidth = screenWidth;
  const [mapHeight, setMapHeight] = useState(280);

  const handleMapLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight > 0) {
      setMapHeight(nextHeight);
    }
  };

  if (stays.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-[#E8F0F8]">
        <Text className="text-sm text-brand-muted">{mapSubtitle}</Text>
      </View>
    );
  }

  const focused = selectedId ? stays.find(s => s.id === selectedId) : undefined;

  const bounds = focused
    ? {
        minLat: focused.location.lat - 0.012,
        maxLat: focused.location.lat + 0.012,
        minLng: focused.location.lng - 0.018,
        maxLng: focused.location.lng + 0.018,
      }
    : (() => {
        const lats = stays.map(s => s.location.lat);
        const lngs = stays.map(s => s.location.lng);
        return {
          minLat: Math.min(...lats) - 0.01,
          maxLat: Math.max(...lats) + 0.01,
          minLng: Math.min(...lngs) - 0.01,
          maxLng: Math.max(...lngs) + 0.01,
        };
      })();

  return (
    <View className="flex-1 bg-[#E8F0F8]">
      <View className="relative flex-1" onLayout={handleMapLayout}>
        <View className="absolute inset-0 opacity-30">
          {Array.from({ length: 10 }).map((_, row) => (
            <View key={row} className="flex-1 flex-row">
              {Array.from({ length: 8 }).map((__, col) => (
                <View key={col} className="flex-1 border border-[#BBD7F5]" />
              ))}
            </View>
          ))}
        </View>

        {stays.map(stay => {
          const active = stay.id === selectedId;
          const pos = project(
            stay.location.lat,
            stay.location.lng,
            bounds,
            mapWidth,
            mapHeight,
          );
          const ratingLabel = stay.rating > 0 ? stay.rating.toFixed(1) : '—';

          return (
            <Pressable
              key={stay.id}
              onPress={() => onSelectStay?.(stay)}
              accessibilityRole="button"
              accessibilityLabel={pinA11y(stay.name, stay.rating)}
              className="absolute items-center"
              style={{ left: pos.left - 22, top: pos.top - 28 }}>
              <View
                className="min-w-[44px] items-center justify-center rounded-full border-2 border-white px-2 py-1"
                style={{
                  backgroundColor: active ? '#0077B6' : '#4285F4',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 3,
                }}>
                <Text className="text-[10px]">🏨</Text>
                <Text className="text-[11px] font-bold text-white">★{ratingLabel}</Text>
              </View>
              {active ? (
                <View className="mt-1 rounded-md bg-white/95 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-brand-text">
                    {stay.name} · {areaLabel(localizedAreaName(stay, language))}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}

        <View className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1">
          <Text className="text-[10px] font-bold text-[#4285F4]">Google</Text>
        </View>
      </View>

      <View className="border-t border-brand-border bg-brand-surface px-3 py-2">
        <Text className="text-xs font-semibold text-brand-text">{mapTitle}</Text>
        <Text className="text-[11px] text-brand-muted">{mapSubtitle}</Text>
      </View>
    </View>
  );
}
