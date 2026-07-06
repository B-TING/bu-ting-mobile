import { useEffect, useMemo, useRef } from 'react';

import { fetchPlaceDetailsForList } from '../services/places/placesApiService';
import { usePlaceDetailCacheStore } from '../stores/usePlaceDetailCacheStore';
import type { RouteItem } from '../types/travelPlan';
import { routeItemToBusanPlace } from '../utils/places/placeModelBridge';

function routesNeedingDetail(
  routes: RouteItem[],
  detailsByPlaceId: Record<string, unknown>,
): RouteItem[] {
  const seen = new Set<string>();
  return routes.filter(route => {
    const busan = routeItemToBusanPlace(route);
    if (!busan) {
      return false;
    }
    if (route.placeInfo?.imageUrl && route.placeInfo.description?.trim()) {
      return false;
    }
    if (route.placeId in detailsByPlaceId) {
      return false;
    }
    if (seen.has(route.placeId)) {
      return false;
    }
    seen.add(route.placeId);
    return true;
  });
}

/** 관광지 검색과 동일한 fetchPlaceDetailsForList로 일정 장소 상세 보강 */
export function usePlanRoutePlaceDetails(routes: RouteItem[]) {
  const detailsByPlaceId = usePlaceDetailCacheStore(s => s.detailsByPlaceId);
  const mergeDetails = usePlaceDetailCacheStore(s => s.mergeDetails);
  const pendingRef = useRef<Set<string>>(new Set());

  const pendingRoutes = useMemo(
    () => routesNeedingDetail(routes, detailsByPlaceId),
    [routes, detailsByPlaceId],
  );
  const pendingKey = pendingRoutes.map(r => r.placeId).join('|');

  useEffect(() => {
    if (pendingRoutes.length === 0) {
      return;
    }

    const targets = pendingRoutes.filter(route => !pendingRef.current.has(route.placeId));
    if (targets.length === 0) {
      return;
    }

    let cancelled = false;

    for (const route of targets) {
      pendingRef.current.add(route.placeId);
    }

    void (async () => {
      const places = targets
        .map(routeItemToBusanPlace)
        .filter((place): place is NonNullable<ReturnType<typeof routeItemToBusanPlace>> =>
          Boolean(place),
        );

      const detailsById = await fetchPlaceDetailsForList(places);

      if (cancelled) {
        return;
      }

      mergeDetails(detailsById);
    })().finally(() => {
      for (const route of targets) {
        pendingRef.current.delete(route.placeId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pendingKey, pendingRoutes, mergeDetails]);

  return detailsByPlaceId;
}
