import { create } from 'zustand';

import { PLACE_SEARCH_RADIUS_M } from '../constants/places/placeSearch';
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
};

type SearchFestivalsParams = {
  eventStartDate: string;
  eventEndDate: string;
  mapCenter: EventZoneCoordinate;
  emptyErrorFallback: string;
};

type PlaceSearchState = {
  cacheByType: Partial<Record<PlaceContentTypeId, PlaceSearchCacheEntry>>;
  loadingByType: Partial<Record<PlaceContentTypeId, boolean>>;
  requestIdByType: Partial<Record<PlaceContentTypeId, number>>;
  getEntry: (contentTypeId: PlaceContentTypeId) => PlaceSearchCacheEntry | undefined;
  isLoading: (contentTypeId: PlaceContentTypeId) => boolean;
  hasCacheForCenter: (
    contentTypeId: PlaceContentTypeId,
    searchCenter: EventZoneCoordinate,
  ) => boolean;
  hasCacheForFestivalRange: (eventStartDate: string, eventEndDate: string) => boolean;
  updateMapCenter: (contentTypeId: PlaceContentTypeId, mapCenter: EventZoneCoordinate) => void;
  searchByLocation: (params: SearchByLocationParams) => Promise<void>;
  searchFestivalsByDateRange: (params: SearchFestivalsParams) => Promise<void>;
  clearCache: () => void;
};

export function searchCenterKey(center: EventZoneCoordinate): string {
  return `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
}

export const usePlaceSearchStore = create<PlaceSearchState>()((set, get) => ({
  cacheByType: {},
  loadingByType: {},
  requestIdByType: {},

  getEntry: contentTypeId => get().cacheByType[contentTypeId],

  isLoading: contentTypeId => get().loadingByType[contentTypeId] ?? false,

  hasCacheForCenter: (contentTypeId, searchCenter) => {
    const entry = get().cacheByType[contentTypeId];
    if (!entry) {
      return false;
    }
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
  }) => {
    const requestId = (get().requestIdByType[contentTypeId] ?? 0) + 1;
    set(state => ({
      loadingByType: { ...state.loadingByType, [contentTypeId]: true },
      requestIdByType: { ...state.requestIdByType, [contentTypeId]: requestId },
    }));

    const resolvedMapCenter = mapCenter ?? searchCenter;

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

      set(state => ({
        cacheByType: {
          ...state.cacheByType,
          [contentTypeId]: {
            places: [],
            placeDetailsById: {},
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
  }) => {
    const contentTypeId = PLACE_CONTENT_TYPE.festival;
    const requestId = (get().requestIdByType[contentTypeId] ?? 0) + 1;
    set(state => ({
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

      set(state => ({
        cacheByType: {
          ...state.cacheByType,
          [contentTypeId]: {
            places: [],
            placeDetailsById: {},
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

  clearCache: () => set({ cacheByType: {}, loadingByType: {}, requestIdByType: {} }),
}));
