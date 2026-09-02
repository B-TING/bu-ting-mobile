import { useEffect, useState } from 'react';

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
  const [fetchSettled, setFetchSettled] = useState(false);

  useEffect(() => {
    if (!enabled || !route) {
      setFetchSettled(false);
      return;
    }

    let cancelled = false;
    setFetchSettled(false);
    void fetchForRoute(route.placeId, route.type, {
      placeName: route.placeName,
      address: route.placeInfo?.address,
      imageUrl: route.placeInfo?.imageUrl,
    }).finally(() => {
      if (!cancelled) {
        setFetchSettled(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, route, fetchForRoute]);

  return {
    detail: cached ?? null,
    loading: Boolean(enabled && placeId && cached == null && !fetchSettled),
  };
}
