import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PlaceDetailVO } from '../types/googlePlaces';
import type { RouteItem, RouteItemType } from '../types/travelPlan';
import {
  fetchRoutePlaceDetail,
  shouldPrefetchRouteDetail,
} from '../utils/places/routePlaceDetail';

type PlaceDetailCacheState = {
  detailsByPlaceId: Record<string, PlaceDetailVO | null>;
  loadingIds: Record<string, boolean>;
  hasDetail: (placeId: string) => boolean;
  getDetail: (placeId: string) => PlaceDetailVO | null | undefined;
  isLoading: (placeId: string) => boolean;
  isRouteDetailPending: (route: RouteItem) => boolean;
  mergeDetails: (details: Record<string, PlaceDetailVO | null>) => void;
  prefetchRoutes: (routes: RouteItem[]) => void;
  fetchForRoute: (
    placeId: string,
    type: RouteItemType,
    options?: { placeName?: string; address?: string; imageUrl?: string },
  ) => Promise<PlaceDetailVO | null>;
};

const pendingFetches = new Map<string, Promise<PlaceDetailVO | null>>();

function uniquePrefetchRoutes(routes: RouteItem[]): RouteItem[] {
  const seen = new Set<string>();
  const result: RouteItem[] = [];

  for (const route of routes) {
    if (!shouldPrefetchRouteDetail(route)) {
      continue;
    }
    if (seen.has(route.placeId)) {
      continue;
    }
    seen.add(route.placeId);
    result.push(route);
  }

  return result;
}

export const usePlaceDetailCacheStore = create<PlaceDetailCacheState>()(
  persist(
    (set, get) => ({
      detailsByPlaceId: {},
      loadingIds: {},

      hasDetail: placeId => placeId in get().detailsByPlaceId,

      getDetail: placeId => get().detailsByPlaceId[placeId],

      isLoading: placeId => get().loadingIds[placeId] ?? false,

      isRouteDetailPending: route => {
        if (!shouldPrefetchRouteDetail(route)) {
          return false;
        }
        return !get().hasDetail(route.placeId);
      },

      mergeDetails: details => {
        if (Object.keys(details).length === 0) {
          return;
        }
        set(state => ({
          detailsByPlaceId: { ...state.detailsByPlaceId, ...details },
        }));
      },

      prefetchRoutes: routes => {
        for (const route of uniquePrefetchRoutes(routes)) {
          if (get().hasDetail(route.placeId) || pendingFetches.has(route.placeId)) {
            continue;
          }
          void get().fetchForRoute(route.placeId, route.type, {
            placeName: route.placeName,
            address: route.placeInfo?.address,
            imageUrl: route.placeInfo?.imageUrl,
          });
        }
      },

      fetchForRoute: async (placeId, type, options) => {
        if (get().hasDetail(placeId)) {
          return get().getDetail(placeId) ?? null;
        }

        const pending = pendingFetches.get(placeId);
        if (pending) {
          return pending;
        }

        set(state => ({
          loadingIds: { ...state.loadingIds, [placeId]: true },
        }));

        const promise = fetchRoutePlaceDetail(placeId, type, options)
          .then(result => {
            get().mergeDetails({ [placeId]: result });
            return result;
          })
          .finally(() => {
            pendingFetches.delete(placeId);
            set(state => {
              const nextLoading = { ...state.loadingIds };
              delete nextLoading[placeId];
              return { loadingIds: nextLoading };
            });
          });

        pendingFetches.set(placeId, promise);
        return promise;
      },
    }),
    {
      name: 'buting-place-detail-cache',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ detailsByPlaceId: state.detailsByPlaceId }),
    },
  ),
);
