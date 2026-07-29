import { create } from 'zustand';

import { PLACE_SEARCH_RADIUS_M, PLACE_SEARCH_REFRESH_COOLDOWN_MS } from '../constants/places/placeSearch';
import {
  fetchPlaceDetailsForList,
  searchFestivals,
  searchPlacesByLocation,
} from '../services/places/placesApiService';
import type { EventZoneCoordinate } from '../types/eventZone';
import type { PlaceDetailVO } from '../types/googlePlaces';
import type { BusanPlace } from '../types/placeSearch';
import { PLACE_CONTENT_TYPE, type PlaceContentTypeId } from '../types/placesApi';
import { enrichBusanPlaceFromDetail } from '../utils/places/placesApiMapper';
import { mapFestivalToBusanPlace } from '../utils/places/festivalApiMapper';
import { logPlacesApiError } from '../utils/places/placesApiLogger';
import { usePlaceDetailCacheStore } from './usePlaceDetailCacheStore';

export type PlaceSearchCacheEntry = {
  places: BusanPlace[];
  placeDetailsById: Record<string, PlaceDetailVO | null>;
  searchCenter: EventZoneCoordinate;
  mapCenter: EventZoneCoordinate;
  error: string | null;
  festivalDateRange?: { eventStartDate: string; eventEndDate: string };
};

type SearchByLocationParams = {
  contentTypeId: PlaceContentTypeId;
  searchCenter: EventZoneCoordinate;
  mapCenter?: EventZoneCoordinate;
  emptyErrorFallback: string;
  refreshTooSoonMessage: string;
};

type SearchFestivalsParams = {
  eventStartDate: string;
  eventEndDate: string;
  mapCenter: EventZoneCoordinate;
  emptyErrorFallback: string;
  refreshTooSoonMessage: string;
};

type PlaceSearchState = {
  cacheByType: Partial<Record<PlaceContentTypeId, PlaceSearchCacheEntry>>;
  loadingByType: Partial<Record<PlaceContentTypeId, boolean>>;
  requestIdByType: Partial<Record<PlaceContentTypeId, number>>;
  /** 카테고리별 마지막 검색 시각 — 같은 항목 재검색만 10초 쿨다운 */
  lastSearchRequestedAtByType: Partial<Record<PlaceContentTypeId, number>>;
  getEntry: (contentTypeId: PlaceContentTypeId) => PlaceSearchCacheEntry | undefined;
  isLoading: (contentTypeId: PlaceContentTypeId) => boolean;
  getSearchCooldownRemainingMs: (contentTypeId: PlaceContentTypeId) => number;
  hasCacheForCenter: (
    contentTypeId: PlaceContentTypeId,
    searchCenter: EventZoneCoordinate,
  ) => boolean;
  hasCacheForFestivalRange: (eventStartDate: string, eventEndDate: string) => boolean;
  updateMapCenter: (contentTypeId: PlaceContentTypeId, mapCenter: EventZoneCoordinate) => void;
  searchByLocation: (params: SearchByLocationParams) => Promise<void>;
  searchFestivalsByDateRange: (params: SearchFestivalsParams) => Promise<void>;
  clearTypeCache: (contentTypeId: PlaceContentTypeId) => void;
  clearCache: () => void;
};

export function searchCenterKey(center: EventZoneCoordinate): string {
  return `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
}

function cooldownRemainingMs(
  lastRequestedAt: number | undefined,
  now = Date.now(),
): number {
  if (lastRequestedAt == null) {
    return 0;
  }
  return Math.max(0, PLACE_SEARCH_REFRESH_COOLDOWN_MS - (now - lastRequestedAt));
}

/**
 * 쿨다운 차단 시에도 요청한 searchCenter를 캐시에 기록한다.
 * (이전 중심을 유지하면 hasCacheForCenter=false가 되어 쿨다운 후 자동 재검색이 반복됨)
 */
function applyCooldownBlock(
  state: PlaceSearchState,
  contentTypeId: PlaceContentTypeId,
  message: string,
  searchCenter: EventZoneCoordinate,
  mapCenter: EventZoneCoordinate,
  festivalDateRange?: { eventStartDate: string; eventEndDate: string },
): Partial<PlaceSearchState> {
  const previous = state.cacheByType[contentTypeId];
  return {
    cacheByType: {
      ...state.cacheByType,
      [contentTypeId]: {
        places: previous?.places ?? [],
        placeDetailsById: previous?.placeDetailsById ?? {},
        searchCenter,
        mapCenter,
        error: message,
        festivalDateRange: festivalDateRange ?? previous?.festivalDateRange,
      },
    },
  };
}

export const usePlaceSearchStore = create<PlaceSearchState>()((set, get) => ({
  cacheByType: {},
  loadingByType: {},
  requestIdByType: {},
  lastSearchRequestedAtByType: {},

  getEntry: contentTypeId => get().cacheByType[contentTypeId],

  isLoading: contentTypeId => get().loadingByType[contentTypeId] ?? false,

  getSearchCooldownRemainingMs: contentTypeId =>
    cooldownRemainingMs(get().lastSearchRequestedAtByType[contentTypeId]),

  hasCacheForCenter: (contentTypeId, searchCenter) => {
    const entry = get().cacheByType[contentTypeId];
    if (!entry) {
      return false;
    }
    if (searchCenterKey(entry.searchCenter) !== searchCenterKey(searchCenter)) {
      return false;
    }
    // 결과 없이 에러만 남은 캐시: 쿨다운 중에만 "검색 완료"로 취급 (자동 재시도 방지).
    // 쿨다운이 끝나면 false → 화면 재진입/탭 선택 시 정상 검색 가능.
    if (entry.error != null && entry.places.length === 0) {
      return cooldownRemainingMs(get().lastSearchRequestedAtByType[contentTypeId]) > 0;
    }
    return true;
  },

  hasCacheForFestivalRange: (eventStartDate, eventEndDate) => {
    const entry = get().cacheByType[PLACE_CONTENT_TYPE.festival];
    if (!entry?.festivalDateRange) {
      return false;
    }
    if (
      entry.festivalDateRange.eventStartDate !== eventStartDate ||
      entry.festivalDateRange.eventEndDate !== eventEndDate
    ) {
      return false;
    }
    if (entry.error != null && entry.places.length === 0) {
      return (
        cooldownRemainingMs(get().lastSearchRequestedAtByType[PLACE_CONTENT_TYPE.festival]) > 0
      );
    }
    return true;
  },

  clearTypeCache: contentTypeId => {
    set(state => {
      const nextCache = { ...state.cacheByType };
      delete nextCache[contentTypeId];
      return { cacheByType: nextCache };
    });
  },

  updateMapCenter: (contentTypeId, mapCenter) => {
    const entry = get().cacheByType[contentTypeId];
    if (!entry) {
      return;
    }
    set(state => ({
      cacheByType: {
        ...state.cacheByType,
        [contentTypeId]: { ...entry, mapCenter },
      },
    }));
  },

  searchByLocation: async ({
    contentTypeId,
    searchCenter,
    mapCenter,
    emptyErrorFallback,
    refreshTooSoonMessage,
  }) => {
    const resolvedMapCenter = mapCenter ?? searchCenter;
    if (cooldownRemainingMs(get().lastSearchRequestedAtByType[contentTypeId]) > 0) {
      set(state =>
        applyCooldownBlock(
          state,
          contentTypeId,
          refreshTooSoonMessage,
          searchCenter,
          resolvedMapCenter,
        ),
      );
      return;
    }

    const requestId = (get().requestIdByType[contentTypeId] ?? 0) + 1;
    set(state => ({
      lastSearchRequestedAtByType: {
        ...state.lastSearchRequestedAtByType,
        [contentTypeId]: Date.now(),
      },
      loadingByType: { ...state.loadingByType, [contentTypeId]: true },
      requestIdByType: { ...state.requestIdByType, [contentTypeId]: requestId },
    }));

    try {
      const data = await searchPlacesByLocation({
        mapX: searchCenter.lng,
        mapY: searchCenter.lat,
        radius: PLACE_SEARCH_RADIUS_M,
        contentTypeId,
        page: 1,
        size: 20,
      });

      if (get().requestIdByType[contentTypeId] !== requestId) {
        return;
      }

      const detailsById = await fetchPlaceDetailsForList(data);

      if (get().requestIdByType[contentTypeId] !== requestId) {
        return;
      }

      usePlaceDetailCacheStore.getState().mergeDetails(detailsById);

      const enriched = data.map(place =>
        enrichBusanPlaceFromDetail(place, detailsById[place.contentId]),
      );

      set(state => ({
        cacheByType: {
          ...state.cacheByType,
          [contentTypeId]: {
            places: enriched,
            placeDetailsById: detailsById,
            searchCenter,
            mapCenter: resolvedMapCenter,
            error: null,
          },
        },
        loadingByType: { ...state.loadingByType, [contentTypeId]: false },
      }));
    } catch (fetchError) {
      if (get().requestIdByType[contentTypeId] !== requestId) {
        return;
      }

      const message =
        fetchError instanceof Error ? fetchError.message : emptyErrorFallback;

      logPlacesApiError('GET', '(location-search)', fetchError, {
        contentTypeId,
        searchCenter,
      });

      const previous = get().cacheByType[contentTypeId];
      set(state => ({
        cacheByType: {
          ...state.cacheByType,
          [contentTypeId]: {
            places: previous?.places ?? [],
            placeDetailsById: previous?.placeDetailsById ?? {},
            searchCenter,
            mapCenter: resolvedMapCenter,
            error: message,
          },
        },
        loadingByType: { ...state.loadingByType, [contentTypeId]: false },
      }));
    }
  },

  searchFestivalsByDateRange: async ({
    eventStartDate,
    eventEndDate,
    mapCenter,
    emptyErrorFallback,
    refreshTooSoonMessage,
  }) => {
    const contentTypeId = PLACE_CONTENT_TYPE.festival;
    if (cooldownRemainingMs(get().lastSearchRequestedAtByType[contentTypeId]) > 0) {
      set(state =>
        applyCooldownBlock(
          state,
          contentTypeId,
          refreshTooSoonMessage,
          mapCenter,
          mapCenter,
          { eventStartDate, eventEndDate },
        ),
      );
      return;
    }

    const requestId = (get().requestIdByType[contentTypeId] ?? 0) + 1;
    set(state => ({
      lastSearchRequestedAtByType: {
        ...state.lastSearchRequestedAtByType,
        [contentTypeId]: Date.now(),
      },
      loadingByType: { ...state.loadingByType, [contentTypeId]: true },
      requestIdByType: { ...state.requestIdByType, [contentTypeId]: requestId },
    }));

    try {
      const result = await searchFestivals({
        eventStartDate,
        eventEndDate,
        page: 1,
        size: 100,
        arrange: 'C',
      });

      if (get().requestIdByType[contentTypeId] !== requestId) {
        return;
      }

      const data = result.festivals.map(mapFestivalToBusanPlace);

      const detailsById = await fetchPlaceDetailsForList(data);

      if (get().requestIdByType[contentTypeId] !== requestId) {
        return;
      }

      usePlaceDetailCacheStore.getState().mergeDetails(detailsById);

      const enriched = data.map(place =>
        enrichBusanPlaceFromDetail(place, detailsById[place.contentId]),
      );

      set(state => ({
        cacheByType: {
          ...state.cacheByType,
          [contentTypeId]: {
            places: enriched,
            placeDetailsById: detailsById,
            searchCenter: mapCenter,
            mapCenter,
            error: null,
            festivalDateRange: { eventStartDate, eventEndDate },
          },
        },
        loadingByType: { ...state.loadingByType, [contentTypeId]: false },
      }));
    } catch (fetchError) {
      if (get().requestIdByType[contentTypeId] !== requestId) {
        return;
      }

      const message =
        fetchError instanceof Error ? fetchError.message : emptyErrorFallback;

      logPlacesApiError('GET', '(festivals-search)', fetchError, {
        eventStartDate,
        eventEndDate,
      });

      const previous = get().cacheByType[contentTypeId];
      set(state => ({
        cacheByType: {
          ...state.cacheByType,
          [contentTypeId]: {
            places: previous?.places ?? [],
            placeDetailsById: previous?.placeDetailsById ?? {},
            searchCenter: mapCenter,
            mapCenter,
            error: message,
            festivalDateRange: { eventStartDate, eventEndDate },
          },
        },
        loadingByType: { ...state.loadingByType, [contentTypeId]: false },
      }));
    }
  },

  clearCache: () =>
    set({
      cacheByType: {},
      loadingByType: {},
      requestIdByType: {},
      lastSearchRequestedAtByType: {},
    }),
}));
