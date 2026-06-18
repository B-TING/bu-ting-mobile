import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import type { SubwayLockerStation } from '../../types/subwayLocker';
import { kakaoOverlaysFromLockerStations } from '../../utils/kakaoMapOverlayBuilders';
import { KakaoMapShell } from '../map/KakaoMapShell';

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
  lineLabel,
  onSelectStation,
  mapTitle,
  mapSubtitle,
}: LockerMapViewProps) {
  const points = stations.map(station => station.location);
  const focusPoint = selectedId
    ? stations.find(station => station.id === selectedId)?.location
    : undefined;

  const overlays = useMemo(
    () => kakaoOverlaysFromLockerStations(stations, selectedId, bookmarkedIds, lineLabel),
    [stations, selectedId, bookmarkedIds, lineLabel],
  );

  const handleOverlayPress = useCallback(
    (id: string) => {
      const station = stations.find(item => item.id === id);
      if (station) {
        onSelectStation?.(station);
      }
    },
    [onSelectStation, stations],
  );

  return (
    <View className="flex-1">
      <KakaoMapShell
        points={points}
        focusPoint={focusPoint}
        overlays={overlays}
        onOverlayPress={onSelectStation ? handleOverlayPress : undefined}
        size="fill"
        emptySubtitle={mapSubtitle}
        footer={{ title: mapTitle, subtitle: mapSubtitle }}
      />
    </View>
  );
}
