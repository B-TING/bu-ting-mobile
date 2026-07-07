import { useEffect, useMemo } from 'react';

import { usePlaceDetailCacheStore } from '../stores/usePlaceDetailCacheStore';
import type { RouteItem } from '../types/travelPlan';
import { shouldPrefetchRouteDetail } from '../utils/places/routePlaceDetail';

function prefetchKey(routes: RouteItem[]): string {
  return routes
    .filter(shouldPrefetchRouteDetail)
    .map(route => route.placeId)
    .filter((placeId, index, list) => list.indexOf(placeId) === index)
    .sort()
    .join('|');
}

/** 일정 장소 상세 — 진입 시 비동기 프리로드, 캐시 스토어에 중복 없이 적재 */
export function usePlanRoutePlaceDetails(routes: RouteItem[], enabled = true) {
  const detailsByPlaceId = usePlaceDetailCacheStore(s => s.detailsByPlaceId);
  const prefetchRoutes = usePlaceDetailCacheStore(s => s.prefetchRoutes);
  const key = useMemo(() => prefetchKey(routes), [routes]);

  useEffect(() => {
    if (!enabled || key.length === 0) {
      return;
    }
    prefetchRoutes(routes);
  }, [enabled, key, routes, prefetchRoutes]);

  return detailsByPlaceId;
}
