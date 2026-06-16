import { Text, View } from 'react-native';

import type { SubwayLockerStation } from '../../types/subwayLocker';
import { GoogleMapShell } from '../map/GoogleMapShell';
import { MapPinMarker } from '../map/MapPinMarker';

type LockerMapViewProps = {
  stations: SubwayLockerStation[];
  selectedId?: string | null;
  bookmarkedIds?: readonly string[];
  lineLabel?: (line: number) => string;
  onSelectStation?: (station: SubwayLockerStation) => void;
  mapTitle: string;
  mapSubtitle: string;
  pinA11y: (name: string, count: number) => string;
  bookmarkedPinA11y?: (name: string, count: number) => string;
};

export function LockerMapView({
  stations,
  selectedId,
  bookmarkedIds = [],
  onSelectStation,
  mapTitle,
  mapSubtitle,
  pinA11y,
  bookmarkedPinA11y,
  lineLabel,
}: LockerMapViewProps) {
  const bookmarkSet = new Set(bookmarkedIds);
  const points = stations.map(station => station.location);
  const focusPoint = selectedId
    ? stations.find(station => station.id === selectedId)?.location
    : undefined;

  return (
    <View className="flex-1">
      <GoogleMapShell
        points={points}
        focusPoint={focusPoint}
        size="fill"
        emptySubtitle={mapSubtitle}
        footer={{ title: mapTitle, subtitle: mapSubtitle }}>
        {stations.map(station => {
          const active = station.id === selectedId;
          const bookmarked = bookmarkSet.has(station.id);
          const countLabel =
            station.lockers.total >= 100 ? '99+' : String(station.lockers.total);
          const pinColor = active ? '#0077B6' : bookmarked ? '#F59E0B' : '#4285F4';
          const pinEmoji = bookmarked ? '📌' : '🧳';

          return (
            <MapPinMarker
              key={station.id}
              point={station.location}
              active={active}
              color={pinColor}
              onPress={() => onSelectStation?.(station)}
              accessibilityLabel={
                bookmarked && bookmarkedPinA11y
                  ? bookmarkedPinA11y(station.name, station.lockers.total)
                  : pinA11y(station.name, station.lockers.total)
              }
              caption={
                lineLabel ? `${station.name} · ${lineLabel(station.line)}` : station.name
              }>
              <Text className="text-[10px]">{pinEmoji}</Text>
              <Text className="text-[11px] font-bold text-white">{countLabel}</Text>
              {bookmarked ? <Text className="text-[8px]">⭐</Text> : null}
            </MapPinMarker>
          );
        })}
      </GoogleMapShell>
    </View>
  );
}
