import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PlaceDetailVO } from '../types/googlePlaces';
import type { RouteItem, RouteItemType } from '../types/travelPlan';
import {
  fetchRoutePlaceDetail,
  fetchRoutePlaceImageViaKeywordSearch,
  isRouteImageOnlyDetail,
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
  seedImageUrl: (
    placeId: string,
    imageUrl: string | undefined,
    meta?: { name?: string; address?: string },
  ) => void;
  prefetchRoutes: (routes: RouteItem[]) => void;
  prefetchImageForRoute: (route: RouteItem) => Promise<PlaceDetailVO | null>;
  fetchForRoute: (
    placeId: string,
    type: RouteItemType,
    options?: { placeName?: string; address?: string; imageUrl?: string },
  ) => Promise<PlaceDetailVO | null>;
};

const pendingFetches = new Map<string, Promise<PlaceDetailVO | null>>();
const pendingImagePrefetches = new Map<string, Promise<PlaceDetailVO | null>>();

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

function hasCachedRouteImage(
  detailsByPlaceId: Record<string, PlaceDetailVO>,
  placeId: string,
  route?: RouteItem,
): boolean {
  if (route?.placeInfo?.imageUrl?.trim()) {
    return true;
  }
  return Boolean(detailsByPlaceId[placeId]?.imageUrl?.trim());
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
        if (hasCachedRouteImage(get().detailsByPlaceId, route.placeId, route)) {
          return false;
        }
        return (
          get().isLoading(route.placeId) ||
          pendingImagePrefetches.has(route.placeId)
        );
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

      seedImageUrl: (placeId, imageUrl, meta) => {
        const trimmed = imageUrl?.trim();
        if (!placeId || !trimmed) {
          return;
        }

        const existing = get().detailsByPlaceId[placeId];
        if (existing?.imageUrl?.trim()) {
          return;
        }

        if (existing) {
          get().mergeDetails({ [placeId]: { ...existing, imageUrl: trimmed } });
          return;
        }

        get().mergeDetails({
          [placeId]: {
            googlePlaceId: placeId,
            name: meta?.name?.trim() || '',
            kind: 'attraction',
            googleTypes: [],
            formattedAddress: meta?.address?.trim() || '',
            location: { lat: 0, lng: 0 },
            reviews: [],
            photos: [],
            imageUrl: trimmed,
          },
        });
      },

      prefetchRoutes: routes => {
        for (const route of uniquePrefetchRoutes(routes)) {
          const placeId = route.placeId;
          if (
            hasCachedRouteImage(get().detailsByPlaceId, placeId, route) ||
            pendingImagePrefetches.has(placeId) ||
            isPrefetchCoolingDown(placeId)
          ) {
            continue;
          }
          void get().prefetchImageForRoute(route);
        }
      },

      prefetchImageForRoute: async route => {
        const placeId = route.placeId;
        const pending = pendingImagePrefetches.get(placeId);
        if (pending) {
          return pending;
        }

        set(state => ({
          loadingIds: { ...state.loadingIds, [placeId]: true },
        }));

        const promise = fetchRoutePlaceImageViaKeywordSearch(placeId, route.type, {
          placeName: route.placeName,
          address: route.placeInfo?.address,
          imageUrl: route.placeInfo?.imageUrl,
        })
          .then(result => {
            if (result?.imageUrl?.trim()) {
              prefetchFailedAtByPlaceId.delete(placeId);
              const existing = get().detailsByPlaceId[placeId];
              if (existing && !isRouteImageOnlyDetail(existing)) {
                get().mergeDetails({
                  [placeId]: { ...existing, imageUrl: result.imageUrl },
                });
              } else {
                get().mergeDetails({ [placeId]: result });
              }
            } else {
              prefetchFailedAtByPlaceId.set(placeId, Date.now());
            }
            return result;
          })
          .finally(() => {
            pendingImagePrefetches.delete(placeId);
            set(state => {
              const nextLoading = { ...state.loadingIds };
              delete nextLoading[placeId];
              return { loadingIds: nextLoading };
            });
          });

        pendingImagePrefetches.set(placeId, promise);
        return promise;
      },

      fetchForRoute: async (placeId, type, options) => {
        const existing = get().getDetail(placeId);
        if (existing && !isRouteImageOnlyDetail(existing)) {
          return existing;
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
              const previous = get().detailsByPlaceId[placeId];
              const merged =
                previous?.imageUrl?.trim() && !result.imageUrl?.trim()
                  ? { ...result, imageUrl: previous.imageUrl }
                  : result;
              get().mergeDetails({ [placeId]: merged });
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
