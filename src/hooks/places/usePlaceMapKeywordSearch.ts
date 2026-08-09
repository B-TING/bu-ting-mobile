import { useCallback, useRef, useState } from 'react';

import {
  fetchPlaceDetailsForList,
  searchPlacesByKeyword,
} from '../../services/places/placesApiService';
import { placeSearchCatchMessage, usePlaceDetailCacheStore } from '../../stores';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { BusanPlace } from '../../types/placeSearch';
import type { PlaceContentTypeId } from '../../types/placesApi';
import type { EventZoneCoordinate } from '../../types/eventZone';
import { enrichBusanPlaceFromDetail } from '../../utils/places/placesApiMapper';
import { logPlacesApiError } from '../../utils/places/placesApiLogger';

type KeywordSearchCopy = {
  searchNoResults: string;
  searchServerError: string;
};

type UsePlaceMapKeywordSearchParams = {
  copy: KeywordSearchCopy;
  onSearchStart?: () => void;
  onFirstResult?: (location: EventZoneCoordinate) => void;
};

export function usePlaceMapKeywordSearch({
  copy,
  onSearchStart,
  onFirstResult,
}: UsePlaceMapKeywordSearchParams) {
  const mergePlaceDetails = usePlaceDetailCacheStore(s => s.mergeDetails);
  const requestIdRef = useRef(0);

  const [keywordDraft, setKeywordDraft] = useState('');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [keywordPlaces, setKeywordPlaces] = useState<BusanPlace[]>([]);
  const [keywordDetailsById, setKeywordDetailsById] = useState<
    Record<string, PlaceDetailVO | null>
  >({});
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordErrorMessage, setKeywordErrorMessage] = useState<string | null>(null);

  const isKeywordMode = activeKeyword != null && activeKeyword.length > 0;

  const runKeywordSearch = useCallback(
    async (rawKeyword: string, typeId: PlaceContentTypeId) => {
      const keyword = rawKeyword.trim();
      if (!keyword) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setActiveKeyword(keyword);
      setKeywordDraft(keyword);
      setKeywordLoading(true);
      setKeywordErrorMessage(null);
      onSearchStart?.();

      try {
        const result = await searchPlacesByKeyword({
          keyword,
          contentTypeId: typeId,
          page: 1,
          size: 20,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (result.places.length === 0) {
          setKeywordPlaces([]);
          setKeywordDetailsById({});
          setKeywordErrorMessage(copy.searchNoResults);
          return;
        }

        setKeywordPlaces(result.places);
        setKeywordErrorMessage(null);
        setKeywordLoading(false);

        const first = result.places[0];
        if (first) {
          onFirstResult?.(first.location);
        }

        try {
          const detailsById = await fetchPlaceDetailsForList(result.places);
          if (requestId !== requestIdRef.current) {
            return;
          }
          const enriched = result.places.map(place =>
            enrichBusanPlaceFromDetail(place, detailsById[place.contentId]),
          );
          setKeywordPlaces(enriched);
          setKeywordDetailsById(detailsById);
          mergePlaceDetails(detailsById);
        } catch (detailError) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          logPlacesApiError('GET', '(keyword-details)', detailError, {
            keyword,
            contentTypeId: typeId,
            count: result.places.length,
          });
          setKeywordDetailsById({});
        }
      } catch (searchError) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        logPlacesApiError('GET', '/api/v1/places/search', searchError, {
          keyword,
          contentTypeId: typeId,
        });
        setKeywordPlaces([]);
        setKeywordDetailsById({});
        setKeywordErrorMessage(
          placeSearchCatchMessage(searchError, {
            noResults: copy.searchNoResults,
            serverError: copy.searchServerError,
          }),
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setKeywordLoading(false);
        }
      }
    },
    [copy.searchNoResults, copy.searchServerError, mergePlaceDetails, onFirstResult, onSearchStart],
  );

  const clearKeyword = useCallback(() => {
    requestIdRef.current += 1;
    setActiveKeyword(null);
    setKeywordDraft('');
    setKeywordPlaces([]);
    setKeywordDetailsById({});
    setKeywordLoading(false);
    setKeywordErrorMessage(null);
  }, []);

  const applyDetailToKeywordPlace = useCallback(
    (contentId: string, detail: PlaceDetailVO) => {
      setKeywordDetailsById(prev => ({ ...prev, [contentId]: detail }));
      setKeywordPlaces(prev =>
        prev.map(item =>
          item.contentId === contentId ? enrichBusanPlaceFromDetail(item, detail) : item,
        ),
      );
    },
    [],
  );

  return {
    keywordDraft,
    setKeywordDraft,
    activeKeyword,
    keywordPlaces,
    keywordDetailsById,
    keywordLoading,
    keywordErrorMessage,
    isKeywordMode,
    runKeywordSearch,
    clearKeyword,
    applyDetailToKeywordPlace,
  };
}
