import { View } from 'react-native';

import type { SubwayLockerStation } from '../../types/subwayLocker';
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
  mapTitle,
  mapSubtitle,
}: LockerMapViewProps) {
  const points = stations.map(station => station.location);
  const focusPoint = selectedId
    ? stations.find(station => station.id === selectedId)?.location
    : undefined;

  return (
    <View className="flex-1">
      <KakaoMapShell
        points={points}
        focusPoint={focusPoint}
        size="fill"
        emptySubtitle={mapSubtitle}
        footer={{ title: mapTitle, subtitle: mapSubtitle }}
      />
    </View>
  );
}
