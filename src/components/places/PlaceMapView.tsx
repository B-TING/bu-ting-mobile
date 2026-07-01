import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { KakaoMapShell, kakaoOverlaysFromPlaces } from '../../kakaoMap';
import type { BusanPlace } from '../../types/placeSearch';
import type { EventZoneCoordinate } from '../../types/eventZone';

type PlaceMapViewProps = {
  places: BusanPlace[];
  mapCenter?: EventZoneCoordinate;
  selectedId?: string | null;
  bookmarkedIds?: readonly string[];
  onSelectPlace?: (place: BusanPlace) => void;
  mapTitle: string;
  mapSubtitle: string;
  captionSuffix?: (place: BusanPlace) => string | undefined;
};

export function PlaceMapView({
  places,
  mapCenter,
  selectedId,
  bookmarkedIds = [],
  onSelectPlace,
  mapTitle,
  mapSubtitle,
  captionSuffix,
}: PlaceMapViewProps) {
  const points = useMemo(() => {
    if (places.length > 0) {
      return places.map(place => place.location);
    }
    if (mapCenter) {
      return [mapCenter];
    }
    return [];
  }, [places, mapCenter]);

  const focusPoint = selectedId
    ? places.find(place => place.id === selectedId)?.location
    : mapCenter;

  const overlays = useMemo(
    () =>
      kakaoOverlaysFromPlaces(places, selectedId, bookmarkedIds, {
        captionSuffix: captionSuffix
          ? place => {
              const full = places.find(item => item.id === place.id);
              return full ? captionSuffix(full) : undefined;
            }
          : undefined,
      }),
    [places, selectedId, bookmarkedIds, captionSuffix],
  );

  const handleOverlayPress = useCallback(
    (id: string) => {
      const place = places.find(item => item.id === id);
      if (place) {
        onSelectPlace?.(place);
      }
    },
    [places, onSelectPlace],
  );

  return (
    <View className="flex-1">
      <KakaoMapShell
        points={points}
        focusPoint={focusPoint}
        overlays={overlays}
        onOverlayPress={onSelectPlace ? handleOverlayPress : undefined}
        size="fill"
        emptySubtitle={mapSubtitle}
        footer={{ title: mapTitle, subtitle: mapSubtitle }}
      />
    </View>
  );
}
