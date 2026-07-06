import { create } from 'zustand';

import type { PlaceDetailVO } from '../types/googlePlaces';
import type { RouteItemType } from '../types/travelPlan';
import { fetchRoutePlaceDetail } from '../utils/places/routePlaceDetail';

type PlaceDetailCacheState = {
  detailsByPlaceId: Record<string, PlaceDetailVO | null>;
  loadingIds: Record<string, boolean>;
  hasDetail: (placeId: string) => boolean;
  getDetail: (placeId: string) => PlaceDetailVO | null | undefined;
  isLoading: (placeId: string) => boolean;
  mergeDetails: (details: Record<string, PlaceDetailVO | null>) => void;
  fetchForRoute: (
    placeId: string,
    type: RouteItemType,
    options?: { placeName?: string; address?: string },
  ) => Promise<PlaceDetailVO | null>;
};

const pendingFetches = new Map<string, Promise<PlaceDetailVO | null>>();

export const usePlaceDetailCacheStore = create<PlaceDetailCacheState>()((set, get) => ({
  detailsByPlaceId: {},
  loadingIds: {},

  hasDetail: placeId => placeId in get().detailsByPlaceId,

  getDetail: placeId => get().detailsByPlaceId[placeId],

  isLoading: placeId => get().loadingIds[placeId] ?? false,

  mergeDetails: details => {
    if (Object.keys(details).length === 0) {
      return;
    }
    set(state => ({
      detailsByPlaceId: { ...state.detailsByPlaceId, ...details },
    }));
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
}));
