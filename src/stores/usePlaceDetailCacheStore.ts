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
  detailsByPlaceId: Record<string, PlaceDetailVO>;
  loadingIds: Record<string, boolean>;
  hasDetail: (placeId: string) => boolean;
  getDetail: (placeId: string) => PlaceDetailVO | undefined;
  isLoading: (placeId: string) => boolean;
  isRouteDetailPending: (route: RouteItem) => boolean;
  mergeDetails: (details: Record<string, PlaceDetailVO | null | undefined>) => void;
  prefetchRoutes: (routes: RouteItem[]) => void;
  fetchForRoute: (
    placeId: string,
    type: RouteItemType,
    options?: { placeName?: string; address?: string; imageUrl?: string },
  ) => Promise<PlaceDetailVO | null>;
};

const pendingFetches = new Map<string, Promise<PlaceDetailVO | null>>();

/** 실패 직후 프리패치 폭주 방지 (명시적 fetchForRoute는 재시도 가능) */
const PREFETCH_FAILURE_COOLDOWN_MS = 30_000;
const prefetchFailedAtByPlaceId = new Map<string, number>();

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

function isPrefetchCoolingDown(placeId: string): boolean {
  const failedAt = prefetchFailedAtByPlaceId.get(placeId);
  if (failedAt == null) {
    return false;
  }
  return Date.now() - failedAt < PREFETCH_FAILURE_COOLDOWN_MS;
}

function stripNullDetails(
  details: Record<string, PlaceDetailVO | null | undefined>,
): Record<string, PlaceDetailVO> {
  const next: Record<string, PlaceDetailVO> = {};
  for (const [placeId, detail] of Object.entries(details)) {
    if (detail != null) {
      next[placeId] = detail;
    }
  }
  return next;
}

export const usePlaceDetailCacheStore = create<PlaceDetailCacheState>()(
  persist(
    (set, get) => ({
      detailsByPlaceId: {},
      loadingIds: {},

      hasDetail: placeId => get().detailsByPlaceId[placeId] != null,

      getDetail: placeId => get().detailsByPlaceId[placeId],

      isLoading: placeId => get().loadingIds[placeId] ?? false,

      isRouteDetailPending: route => {
        if (!shouldPrefetchRouteDetail(route)) {
          return false;
        }
        if (get().hasDetail(route.placeId)) {
          return false;
        }
        return get().isLoading(route.placeId) || pendingFetches.has(route.placeId);
      },

      mergeDetails: details => {
        if (Object.keys(details).length === 0) {
          return;
        }
        set(state => {
          const next = { ...state.detailsByPlaceId };
          let changed = false;
          for (const [placeId, detail] of Object.entries(details)) {
            if (detail == null) {
              if (placeId in next) {
                delete next[placeId];
                changed = true;
              }
              continue;
            }
            if (next[placeId] !== detail) {
              next[placeId] = detail;
              changed = true;
            }
          }
          return changed ? { detailsByPlaceId: next } : state;
        });
      },

      prefetchRoutes: routes => {
        for (const route of uniquePrefetchRoutes(routes)) {
          if (
            get().hasDetail(route.placeId) ||
            pendingFetches.has(route.placeId) ||
            isPrefetchCoolingDown(route.placeId)
          ) {
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
            if (result != null) {
              prefetchFailedAtByPlaceId.delete(placeId);
              get().mergeDetails({ [placeId]: result });
            } else {
              prefetchFailedAtByPlaceId.set(placeId, Date.now());
              // 과거 null poison 캐시가 있으면 제거해 재시도 가능하게 한다.
              get().mergeDetails({ [placeId]: null });
            }
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
      partialize: state => ({
        detailsByPlaceId: stripNullDetails(state.detailsByPlaceId),
      }),
      merge: (persisted, current) => {
        const persistedState = (persisted ?? {}) as Partial<PlaceDetailCacheState>;
        return {
          ...current,
          ...persistedState,
          detailsByPlaceId: stripNullDetails({
            ...current.detailsByPlaceId,
            ...(persistedState.detailsByPlaceId ?? {}),
          }),
        };
      },
    },
  ),
);
