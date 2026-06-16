import { Text, View } from 'react-native';

import { localizedAreaName } from '../../constants/accommodation';
import type { BusanAccommodation } from '../../types/accommodation';
import type { AppLanguage } from '../../types/user';
import { GoogleMapShell } from '../map/GoogleMapShell';
import { MapPinMarker } from '../map/MapPinMarker';

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
  language,
  onSelectStay,
  mapTitle,
  mapSubtitle,
  pinA11y,
  areaLabel,
}: AccommodationMapViewProps) {
  const points = stays.map(stay => stay.location);
  const focusPoint = selectedId
    ? stays.find(stay => stay.id === selectedId)?.location
    : undefined;

  return (
    <View className="flex-1">
      <GoogleMapShell
        points={points}
        focusPoint={focusPoint}
        size="fill"
        emptySubtitle={mapSubtitle}
        footer={{ title: mapTitle, subtitle: mapSubtitle }}>
        {stays.map(stay => {
          const active = stay.id === selectedId;
          const ratingLabel = stay.rating > 0 ? stay.rating.toFixed(1) : '—';

          return (
            <MapPinMarker
              key={stay.id}
              point={stay.location}
              active={active}
              color={active ? '#0077B6' : '#4285F4'}
              onPress={() => onSelectStay?.(stay)}
              accessibilityLabel={pinA11y(stay.name, stay.rating)}
              caption={`${stay.name} · ${areaLabel(localizedAreaName(stay, language))}`}>
              <Text className="text-[10px]">🏨</Text>
              <Text className="text-[11px] font-bold text-white">★{ratingLabel}</Text>
            </MapPinMarker>
          );
        })}
      </GoogleMapShell>
    </View>
  );
}
