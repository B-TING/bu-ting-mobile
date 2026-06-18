import { View } from 'react-native';

import type { BusanAccommodation } from '../../types/accommodation';
import type { AppLanguage } from '../../types/user';
import { KakaoMapShell } from '../map/KakaoMapShell';

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

export function AccommodationMapView({
  stays,
  selectedId,
  mapTitle,
  mapSubtitle,
}: AccommodationMapViewProps) {
  const points = stays.map(stay => stay.location);
  const focusPoint = selectedId
    ? stays.find(stay => stay.id === selectedId)?.location
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
