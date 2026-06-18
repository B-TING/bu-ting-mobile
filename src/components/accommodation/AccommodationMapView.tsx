import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import type { BusanAccommodation } from '../../types/accommodation';
import type { AppLanguage } from '../../types/user';
import { kakaoOverlaysFromStays } from '../../utils/kakaoMapOverlayBuilders';
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
  language,
  onSelectStay,
  mapTitle,
  mapSubtitle,
  areaLabel,
}: AccommodationMapViewProps) {
  const points = stays.map(stay => stay.location);
  const focusPoint = selectedId
    ? stays.find(stay => stay.id === selectedId)?.location
    : undefined;

  const overlays = useMemo(
    () =>
      kakaoOverlaysFromStays(stays, selectedId, {
        language,
        areaLabel,
      }),
    [stays, selectedId, language, areaLabel],
  );

  const handleOverlayPress = useCallback(
    (id: string) => {
      const stay = stays.find(item => item.id === id);
      if (stay) {
        onSelectStay?.(stay);
      }
    },
    [onSelectStay, stays],
  );

  return (
    <View className="flex-1">
      <KakaoMapShell
        points={points}
        focusPoint={focusPoint}
        overlays={overlays}
        onOverlayPress={onSelectStay ? handleOverlayPress : undefined}
        size="fill"
        emptySubtitle={mapSubtitle}
        footer={{ title: mapTitle, subtitle: mapSubtitle }}
      />
    </View>
  );
}
