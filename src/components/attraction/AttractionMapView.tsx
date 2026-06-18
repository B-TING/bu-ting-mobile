import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import type { BusanAttraction } from '../../types/attraction';
import type { AppLanguage } from '../../types/user';
import { kakaoOverlaysFromAttractions } from '../../utils/kakaoMapOverlayBuilders';
import { KakaoMapShell } from '../map/KakaoMapShell';

type AttractionMapViewProps = {
  attractions: BusanAttraction[];
  selectedId?: string | null;
  bookmarkedIds?: readonly string[];
  language: AppLanguage;
  onSelectAttraction?: (attraction: BusanAttraction) => void;
  mapTitle: string;
  mapSubtitle: string;
  categoryLabel: (category: string) => string;
};

export function AttractionMapView({
  attractions,
  selectedId,
  bookmarkedIds = [],
  language,
  onSelectAttraction,
  mapTitle,
  mapSubtitle,
  categoryLabel,
}: AttractionMapViewProps) {
  const points = attractions.map(attraction => attraction.location);
  const focusPoint = selectedId
    ? attractions.find(attraction => attraction.id === selectedId)?.location
    : undefined;

  const overlays = useMemo(
    () =>
      kakaoOverlaysFromAttractions(attractions, selectedId, bookmarkedIds, {
        language,
        categoryLabel,
      }),
    [attractions, selectedId, bookmarkedIds, language, categoryLabel],
  );

  const handleOverlayPress = useCallback(
    (id: string) => {
      const attraction = attractions.find(item => item.id === id);
      if (attraction) {
        onSelectAttraction?.(attraction);
      }
    },
    [attractions, onSelectAttraction],
  );

  return (
    <View className="flex-1">
      <KakaoMapShell
        points={points}
        focusPoint={focusPoint}
        overlays={overlays}
        onOverlayPress={onSelectAttraction ? handleOverlayPress : undefined}
        size="fill"
        emptySubtitle={mapSubtitle}
        footer={{ title: mapTitle, subtitle: mapSubtitle }}
      />
    </View>
  );
}
