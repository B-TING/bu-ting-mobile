import { useEffect } from 'react';

import { usePlaceDetailCacheStore } from '../stores/usePlaceDetailCacheStore';
import type { PlaceDetailVO } from '../types/googlePlaces';
import type { RouteItem } from '../types/travelPlan';

type CachedRoutePlaceDetail = {
  detail: PlaceDetailVO | null;
  loading: boolean;
};

export function useCachedRoutePlaceDetail(
  route: RouteItem | null,
  enabled: boolean,
): CachedRoutePlaceDetail {
  const placeId = route?.placeId;
  const cached = usePlaceDetailCacheStore(s =>
    placeId ? s.detailsByPlaceId[placeId] : undefined,
  );
  const fetchForRoute = usePlaceDetailCacheStore(s => s.fetchForRoute);

  useEffect(() => {
    if (!enabled || !route) {
      return;
    }

    void fetchForRoute(route.placeId, route.type, {
      placeName: route.placeName,
      address: route.placeInfo?.address,
      imageUrl: route.placeInfo?.imageUrl,
    });
  }, [enabled, route, fetchForRoute]);

  const isCached = cached !== undefined;
  const isLoading = usePlaceDetailCacheStore(s =>
    placeId ? s.isLoading(placeId) : false,
  );

  return {
    detail: isCached ? cached : null,
    loading: enabled && (isLoading || !isCached),
  };
}
