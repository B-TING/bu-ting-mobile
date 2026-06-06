import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import type { RouteItem } from '../../types/travelPlan';

type NaverMapPlaceholderProps = {
  title: string;
  subtitle: string;
  routes: RouteItem[];
  highlightItemId?: string | null;
  size?: 'compact' | 'fullscreen' | 'fill';
  onPress?: () => void;
  tapHint?: string;
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

export function NaverMapPlaceholder({
  title,
  subtitle,
  routes,
  highlightItemId,
  size = 'compact',
  onPress,
  tapHint,
}: NaverMapPlaceholderProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const mapWidth = size === 'fullscreen' ? screenWidth : screenWidth - (size === 'fill' ? 0 : 48);
  const mapHeight =
    size === 'fullscreen'
      ? screenHeight * 0.72
      : size === 'fill'
        ? undefined
        : 160;

  if (routes.length === 0) {
    return (
      <View className="items-center justify-center rounded-2xl border border-brand-border bg-[#E8F4E8] p-6">
        <Text className="text-sm text-brand-muted">{subtitle}</Text>
      </View>
    );
  }

  const focusedRoute = highlightItemId
    ? routes.find(r => r.itemId === highlightItemId)
    : undefined;

  const bounds = focusedRoute
    ? {
        minLat: focusedRoute.location.lat - 0.008,
        maxLat: focusedRoute.location.lat + 0.008,
        minLng: focusedRoute.location.lng - 0.012,
        maxLng: focusedRoute.location.lng + 0.012,
      }
    : (() => {
        const lats = routes.map(r => r.location.lat);
        const lngs = routes.map(r => r.location.lng);
        return {
          minLat: Math.min(...lats) - 0.01,
          maxLat: Math.max(...lats) + 0.01,
          minLng: Math.min(...lngs) - 0.01,
          maxLng: Math.max(...lngs) + 0.01,
        };
      })();

  const mapBody = (
    <View
      className={
        size === 'fullscreen' || size === 'fill'
          ? 'flex-1 bg-[#E8F4E8]'
          : 'overflow-hidden rounded-2xl border border-brand-border bg-[#E8F4E8]'
      }>
      <View
        style={size === 'fill' ? { flex: 1, width: '100%' } : { width: '100%', height: mapHeight }}
        className="relative">
        <View className="absolute inset-0 opacity-30">
          {Array.from({ length: size === 'fullscreen' ? 12 : 6 }).map((_, row) => (
            <View key={row} className="flex-1 flex-row">
              {Array.from({ length: 8 }).map((__, col) => (
                <View key={col} className="flex-1 border border-[#C8E6C9]" />
              ))}
            </View>
          ))}
        </View>
        {routes.map((r, i) => {
          const effectiveHeight = size === 'fill' ? 200 : (mapHeight ?? 160);
          const pos = project(
            r.location.lat,
            r.location.lng,
            bounds,
            mapWidth,
            effectiveHeight,
          );
          const active = r.itemId === highlightItemId;
          const pinSize = size === 'fullscreen' ? 36 : 28;
          return (
            <View
              key={r.itemId}
              className="absolute items-center justify-center rounded-full border-2 border-white"
              style={{
                left: pos.left,
                top: pos.top,
                width: pinSize,
                height: pinSize,
                backgroundColor: active ? '#0077B6' : '#03C75A',
              }}>
              <Text
                className="font-bold text-white"
                style={{ fontSize: size === 'fullscreen' ? 14 : 11 }}>
                {i + 1}
              </Text>
            </View>
          );
        })}
        <View className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1">
          <Text className="text-[10px] font-bold text-[#03C75A]">NAVER</Text>
        </View>
        {onPress && tapHint && size === 'compact' && (
          <View className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-1">
            <Text className="text-[10px] font-semibold text-white">{tapHint}</Text>
          </View>
        )}
      </View>
      {size === 'compact' && (
        <View className="border-t border-brand-border bg-brand-surface px-3 py-2">
          <Text className="text-xs font-semibold text-brand-text">{title}</Text>
          <Text className="text-[11px] text-brand-muted">{subtitle}</Text>
        </View>
      )}
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
