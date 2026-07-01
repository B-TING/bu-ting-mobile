import { useCallback, useEffect, useMemo, useState } from 'react';
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
  onMapCenterChange?: (center: EventZoneCoordinate) => void;
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
  onMapCenterChange,
  mapTitle,
  mapSubtitle,
  captionSuffix,
}: PlaceMapViewProps) {
  const placePoints = useMemo(() => places.map(place => place.location), [places]);
  const points = placePoints.length > 0 ? placePoints : mapCenter ? [mapCenter] : [];

  const [selectionFocusId, setSelectionFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setSelectionFocusId(null);
      return;
    }

    setSelectionFocusId(selectedId);
    const timer = setTimeout(() => setSelectionFocusId(null), 600);
    return () => clearTimeout(timer);
  }, [selectedId]);

  const focusPoint = selectionFocusId
    ? places.find(place => place.id === selectionFocusId)?.location
    : undefined;

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
        fitPointsToCamera={false}
        overlays={overlays}
        onOverlayPress={onSelectPlace ? handleOverlayPress : undefined}
        onCenterChange={onMapCenterChange}
        size="fill"
        emptySubtitle={mapSubtitle}
        footer={{ title: mapTitle, subtitle: mapSubtitle }}
      />
    </View>
  );
}
