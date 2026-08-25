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

/** 검색 완료 후 UI에서 결과/에러를 분기하기 위한 결과 */
export type PlaceSearchOutcome = 'success' | 'empty' | 'cooldown' | 'error' | 'stale';

const NO_RESULTS_MESSAGE_RE =
  /400\s*\(\s*null\s*\)|Places request failed\s*\(\s*400\s*\)|Festivals request failed\s*\(\s*400\s*\)|검색\s*결과.*400|Places request failed\s*\(\s*404\s*\)|Festivals request failed\s*\(\s*404\s*\)/i;

/** UI에 남은 400/404 empty 응답 메시지 */
export function isPlaceSearchNoResultsMessage(message: string): boolean {
  return NO_RESULTS_MESSAGE_RE.test(message);
}

function readErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return undefined;
  }
  const status = Number((error as { status: unknown }).status);
  return Number.isFinite(status) ? status : undefined;
}

/** HTTP 400/404(결과 없음) → 검색 결과 없음으로 취급 */
export function isPlaceSearchNoResultsError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  if (message && isPlaceSearchNoResultsMessage(message)) {
    return true;
  }
  const status = readErrorStatus(error);
  return status === 400 || status === 404;
}

export function isPlaceSearchServerError(error: unknown): boolean {
  const status = readErrorStatus(error);
  return typeof status === 'number' && status >= 500;
}

/** catch 분기용 사용자 문구 (토스트 없이 인라인 표시) */
export function placeSearchCatchMessage(
  error: unknown,
  messages: { noResults: string; serverError: string },
): string {
  if (isPlaceSearchNoResultsError(error)) {
    return messages.noResults;
  }
  return messages.serverError;
}

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
  serverErrorMessage: string;
  refreshTooSoonMessage: string;
};

type SearchFestivalsParams = {
  eventStartDate: string;
  eventEndDate: string;
  mapCenter: EventZoneCoordinate;
  serverErrorMessage: string;
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
  searchByLocation: (params: SearchByLocationParams) => Promise<PlaceSearchOutcome>;
  searchFestivalsByDateRange: (params: SearchFestivalsParams) => Promise<PlaceSearchOutcome>;
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
    // 같은 중심이면 성공/실패 모두 캐시로 취급 — 지도만 움직여도 자동 재검색하지 않음.
    // 재검색은 「이곳에서 검색하기」(clearTypeCache + searchCenter 갱신)로만.
    return searchCenterKey(entry.searchCenter) === searchCenterKey(searchCenter);
  },

  hasCacheForFestivalRange: (eventStartDate, eventEndDate) => {
    const entry = get().cacheByType[PLACE_CONTENT_TYPE.festival];
    if (!entry?.festivalDateRange) {
      return false;
    }
    return (
      entry.festivalDateRange.eventStartDate === eventStartDate &&
      entry.festivalDateRange.eventEndDate === eventEndDate
    );
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
    serverErrorMessage,
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
      return 'cooldown';
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
        return 'stale';
      }

      const detailsById = await fetchPlaceDetailsForList(data);

      if (get().requestIdByType[contentTypeId] !== requestId) {
        return 'stale';
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
      return 'success';
    } catch (fetchError) {
      if (get().requestIdByType[contentTypeId] !== requestId) {
        return 'stale';
      }

      logPlacesApiError('GET', '(location-search)', fetchError, {
        contentTypeId,
        searchCenter,
      });

      if (isPlaceSearchNoResultsError(fetchError)) {
        set(state => ({
          cacheByType: {
            ...state.cacheByType,
            [contentTypeId]: {
              places: [],
              placeDetailsById: {},
              searchCenter,
              mapCenter: resolvedMapCenter,
              error: null,
            },
          },
          loadingByType: { ...state.loadingByType, [contentTypeId]: false },
        }));
        return 'empty';
      }

      set(state => ({
        cacheByType: {
          ...state.cacheByType,
          [contentTypeId]: {
            places: [],
            placeDetailsById: {},
            searchCenter,
            mapCenter: resolvedMapCenter,
            error: serverErrorMessage,
          },
        },
        loadingByType: { ...state.loadingByType, [contentTypeId]: false },
      }));
      return 'error';
    }
  },

  searchFestivalsByDateRange: async ({
    eventStartDate,
    eventEndDate,
    mapCenter,
    serverErrorMessage,
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
      return 'cooldown';
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
        return 'stale';
      }

      const data = result.festivals.map(mapFestivalToBusanPlace);

      const detailsById = await fetchPlaceDetailsForList(data);

      if (get().requestIdByType[contentTypeId] !== requestId) {
        return 'stale';
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
      return 'success';
    } catch (fetchError) {
      if (get().requestIdByType[contentTypeId] !== requestId) {
        return 'stale';
      }

      logPlacesApiError('GET', '(festivals-search)', fetchError, {
        eventStartDate,
        eventEndDate,
      });

      if (isPlaceSearchNoResultsError(fetchError)) {
        set(state => ({
          cacheByType: {
            ...state.cacheByType,
            [contentTypeId]: {
              places: [],
              placeDetailsById: {},
              searchCenter: mapCenter,
              mapCenter,
              error: null,
              festivalDateRange: { eventStartDate, eventEndDate },
            },
          },
          loadingByType: { ...state.loadingByType, [contentTypeId]: false },
        }));
        return 'empty';
      }

      set(state => ({
        cacheByType: {
          ...state.cacheByType,
          [contentTypeId]: {
            places: [],
            placeDetailsById: {},
            searchCenter: mapCenter,
            mapCenter,
            error: serverErrorMessage,
            festivalDateRange: { eventStartDate, eventEndDate },
          },
        },
        loadingByType: { ...state.loadingByType, [contentTypeId]: false },
      }));
      return 'error';
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
