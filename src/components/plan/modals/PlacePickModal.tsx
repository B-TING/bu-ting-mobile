import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { buildPlaceListMetaLine } from '../../../constants/places/placeSearch';
import { useCopy } from '../../../i18n';
import {
  fetchPlaceDetailsForList,
  searchPlacesByKeyword,
} from '../../../services/places/placesApiService';
import { usePlaceDetailCacheStore, usePlaceSearchStore } from '../../../stores';
import { placeSearchCatchMessage } from '../../../stores';
import { TransportModePicker } from '../schedule/TransportModePicker';
import type { BusanPlace } from '../../../types/placeSearch';
import type { AppLanguage } from '../../../types/user';
import type { TravelLegMode } from '../../../types/travelPlan';
import {
  findNearbyRebootCandidates,
  formatDistanceKm,
  listBrowseRebootPlaces,
  searchRebootPlaces,
  type RebootPlaceCandidate,
} from '../../../utils/places/rebootPlaces';
import {
  PLAN_PICK_CONTENT_TYPE,
  busanPlaceToRebootCandidate,
} from '../../../utils/places/placeModelBridge';
import { haversineKm } from '../../../utils/geo/geo';
import { enrichBusanPlaceFromDetail } from '../../../utils/places/placesApiMapper';
import { logPlacesApiError } from '../../../utils/places/placesApiLogger';
import { AppModal, AppModalPrimaryFooter } from '../../shared/modals';
import { PlaceSearchListItem } from '../../places/PlaceSearchListItem';

export type PlacePickModalCopy = {
  title: string;
  subtitle?: string;
  nearbyTitle: string;
  searchPlaceholder: string;
  searchEmpty: string;
  applyLabel: string;
  cancelLabel: string;
  distance: (d: string) => string;
  transportModeTitle?: string;
  legWalk?: string;
  legDrive?: string;
  legTransit?: string;
};

type PlacePickModalProps = {
  visible: boolean;
  anchor?: { lat: number; lng: number };
  language: AppLanguage;
  copy: PlacePickModalCopy;
  excludePlaceIds: string[];
  showTransportMode?: boolean;
  defaultLegMode?: TravelLegMode;
  /** true면 관광지 검색과 동일한 location + detail API */
  useTourApiNearby?: boolean;
  onClose: () => void;
  onSelect: (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => void;
};

function rebootCandidateToBusanPlace(candidate: RebootPlaceCandidate): BusanPlace {
  return {
    id: candidate.placeId,
    contentId: candidate.placeId,
    contentTypeId: PLAN_PICK_CONTENT_TYPE,
    name: candidate.placeName,
    address: candidate.address ?? '',
    location: candidate.location,
    rating: 0,
    userRatingsTotal: 0,
    imageUrl: candidate.imageUrl,
  };
}

function sortByAnchorDistance(
  places: BusanPlace[],
  anchor?: { lat: number; lng: number },
): BusanPlace[] {
  if (!anchor) {
    return places;
  }
  return [...places].sort((a, b) => {
    const da = haversineKm(anchor.lat, anchor.lng, a.location.lat, a.location.lng);
    const db = haversineKm(anchor.lat, anchor.lng, b.location.lat, b.location.lng);
    return da - db;
  });
}

export function PlacePickModal({
  visible,
  anchor,
  language,
  copy,
  excludePlaceIds,
  showTransportMode = false,
  defaultLegMode = 'walk',
  useTourApiNearby = false,
  onClose,
  onSelect,
}: PlacePickModalProps) {
  const [queryDraft, setQueryDraft] = useState('');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [keywordPlaces, setKeywordPlaces] = useState<BusanPlace[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordErrorMessage, setKeywordErrorMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [legMode, setLegMode] = useState<TravelLegMode>(defaultLegMode);
  const keywordRequestIdRef = useRef(0);

  const searchCopy = useCopy('placeSearch');
  const cacheEntry = usePlaceSearchStore(s => s.cacheByType[PLAN_PICK_CONTENT_TYPE]);
  const nearbyLoading = usePlaceSearchStore(s => s.isLoading(PLAN_PICK_CONTENT_TYPE));
  const searchByLocation = usePlaceSearchStore(s => s.searchByLocation);
  const hasCacheForCenter = usePlaceSearchStore(s => s.hasCacheForCenter);
  const mergePlaceDetails = usePlaceDetailCacheStore(s => s.mergeDetails);

  const isKeywordMode = useTourApiNearby && activeKeyword != null && activeKeyword.length > 0;

  useEffect(() => {
    if (!visible || !useTourApiNearby || !anchor || isKeywordMode) {
      return;
    }

    if (hasCacheForCenter(PLAN_PICK_CONTENT_TYPE, anchor)) {
      return;
    }

    void searchByLocation({
      contentTypeId: PLAN_PICK_CONTENT_TYPE,
      searchCenter: anchor,
      mapCenter: anchor,
      serverErrorMessage: searchCopy.searchServerError,
      refreshTooSoonMessage: searchCopy.searchRefreshTooSoon,
    });
  }, [
    visible,
    useTourApiNearby,
    anchor,
    isKeywordMode,
    hasCacheForCenter,
    searchByLocation,
    searchCopy.searchServerError,
    searchCopy.searchRefreshTooSoon,
  ]);

  const nearbyPlaces = useMemo(() => {
    if (!useTourApiNearby || !anchor) {
      return [];
    }
    const exclude = new Set(excludePlaceIds);
    const places = (cacheEntry?.places ?? []).filter(place => !exclude.has(place.contentId));
    return sortByAnchorDistance(places, anchor);
  }, [useTourApiNearby, anchor, cacheEntry?.places, excludePlaceIds]);

  const localCandidates = useMemo(() => {
    if (useTourApiNearby) {
      return [];
    }
    if (queryDraft.trim()) {
      return searchRebootPlaces(queryDraft, { excludePlaceIds, language });
    }
    if (anchor) {
      return findNearbyRebootCandidates(anchor, { excludePlaceIds, language });
    }
    return listBrowseRebootPlaces({ excludePlaceIds, language });
  }, [useTourApiNearby, anchor, queryDraft, excludePlaceIds, language]);

  const localPlaces = useMemo(
    () => localCandidates.map(rebootCandidateToBusanPlace),
    [localCandidates],
  );

  const listPlaces = isKeywordMode
    ? keywordPlaces
    : useTourApiNearby && anchor
      ? nearbyPlaces
      : localPlaces;

  const listLoading =
    (isKeywordMode && keywordLoading) ||
    (!isKeywordMode && useTourApiNearby && Boolean(anchor) && nearbyLoading);

  const runKeywordSearch = useCallback(async () => {
    if (!useTourApiNearby) {
      return;
    }
    const keyword = queryDraft.trim();
    if (!keyword || keywordLoading) {
      return;
    }

    const requestId = ++keywordRequestIdRef.current;
    setActiveKeyword(keyword);
    setKeywordLoading(true);
    setKeywordErrorMessage(null);
    setSelectedId(null);

    try {
      const result = await searchPlacesByKeyword({
        keyword,
        contentTypeId: PLAN_PICK_CONTENT_TYPE,
        page: 1,
        size: 20,
      });

      if (requestId !== keywordRequestIdRef.current) {
        return;
      }

      const exclude = new Set(excludePlaceIds);
      const places = sortByAnchorDistance(
        result.places.filter(place => !exclude.has(place.contentId)),
        anchor,
      );
      setKeywordPlaces(places);
      setKeywordErrorMessage(
        places.length === 0 ? searchCopy.searchNoResults : null,
      );
      setKeywordLoading(false);

      if (places.length === 0) {
        return;
      }

      try {
        const detailsById = await fetchPlaceDetailsForList(places);
        if (requestId !== keywordRequestIdRef.current) {
          return;
        }
        const enriched = places.map(place =>
          enrichBusanPlaceFromDetail(place, detailsById[place.contentId]),
        );
        setKeywordPlaces(enriched);
        mergePlaceDetails(detailsById);
      } catch (detailError) {
        if (requestId !== keywordRequestIdRef.current) {
          return;
        }
        logPlacesApiError('GET', '(place-pick-keyword-details)', detailError, {
          keyword,
          count: places.length,
        });
      }
    } catch (searchError) {
      if (requestId !== keywordRequestIdRef.current) {
        return;
      }
      logPlacesApiError('GET', '/api/v1/places/search', searchError, {
        keyword,
        contentTypeId: PLAN_PICK_CONTENT_TYPE,
      });
      setKeywordPlaces([]);
      setKeywordErrorMessage(
        placeSearchCatchMessage(searchError, {
          noResults: searchCopy.searchNoResults,
          serverError: searchCopy.searchServerError,
        }),
      );
      setKeywordLoading(false);
    } finally {
      if (requestId === keywordRequestIdRef.current) {
        setKeywordLoading(false);
      }
    }
  }, [
    anchor,
    excludePlaceIds,
    keywordLoading,
    mergePlaceDetails,
    queryDraft,
    searchCopy.searchNoResults,
    searchCopy.searchServerError,
    useTourApiNearby,
  ]);

  const handleClearKeyword = useCallback(() => {
    keywordRequestIdRef.current += 1;
    setQueryDraft('');
    setActiveKeyword(null);
    setKeywordPlaces([]);
    setKeywordLoading(false);
    setKeywordErrorMessage(null);
    setSelectedId(null);
  }, []);

  const handleClose = () => {
    keywordRequestIdRef.current += 1;
    setQueryDraft('');
    setActiveKeyword(null);
    setKeywordPlaces([]);
    setKeywordLoading(false);
    setKeywordErrorMessage(null);
    setSelectedId(null);
    setLegMode(defaultLegMode);
    onClose();
  };

  const handleApply = () => {
    const pick = listPlaces.find(place => place.contentId === selectedId);
    if (!pick) {
      return;
    }
    const candidate = busanPlaceToRebootCandidate(pick, anchor);
    onSelect(candidate, showTransportMode ? legMode : undefined);
    handleClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      title={copy.title}
      subtitle={copy.subtitle}
      maxHeight="88%"
      keyboardAware
      footer={
        <AppModalPrimaryFooter
          confirmLabel={copy.applyLabel}
          onConfirm={handleApply}
          confirmDisabled={!selectedId}
          cancelLabel={copy.cancelLabel}
          onCancel={handleClose}
        />
      }>
      <ScrollView
        className="max-h-[72%] px-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        {showTransportMode && copy.transportModeTitle && copy.legWalk ? (
          <View className="mb-4">
            <TransportModePicker
              title={copy.transportModeTitle}
              value={legMode}
              onChange={setLegMode}
              labels={{
                walk: copy.legWalk!,
                drive: copy.legDrive!,
                transit: copy.legTransit!,
              }}
            />
          </View>
        ) : null}

        <Text className="mb-2 text-sm font-bold text-brand-text">
          {isKeywordMode ? copy.searchPlaceholder : copy.nearbyTitle}
        </Text>

        {useTourApiNearby ? (
          <View className="mb-4 flex-row items-center gap-2">
            <TextInput
              className="min-h-12 flex-1 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
              value={queryDraft}
              onChangeText={text => {
                setQueryDraft(text);
                setSelectedId(null);
              }}
              placeholder={copy.searchPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => {
                void runKeywordSearch();
              }}
              accessibilityLabel={searchCopy.keywordSearchA11y}
            />
            {isKeywordMode || queryDraft.trim().length > 0 ? (
              <Pressable
                onPress={handleClearKeyword}
                accessibilityRole="button"
                accessibilityLabel={searchCopy.keywordClearA11y}
                className="h-12 w-12 items-center justify-center rounded-2xl border-2 border-brand-border bg-brand-surface active:opacity-80">
                <Text className="text-base font-bold text-brand-muted">×</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                void runKeywordSearch();
              }}
              disabled={queryDraft.trim().length === 0 || keywordLoading}
              accessibilityRole="button"
              accessibilityLabel={searchCopy.keywordSearchA11y}
              className={`h-12 items-center justify-center rounded-2xl px-3 ${
                queryDraft.trim().length === 0 || keywordLoading
                  ? 'bg-brand-muted'
                  : 'bg-brand-primary active:opacity-90'
              }`}>
              <Text className="text-sm font-bold text-white">
                {searchCopy.keywordSearchButton}
              </Text>
            </Pressable>
          </View>
        ) : (
          <TextInput
            className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
            value={queryDraft}
            onChangeText={text => {
              setQueryDraft(text);
              setSelectedId(null);
            }}
            placeholder={copy.searchPlaceholder}
            autoCapitalize="none"
          />
        )}

        {listLoading ? (
          <View className="mb-4 items-center py-4">
            <ActivityIndicator color="#0077B6" />
            <Text className="mt-2 text-xs text-brand-muted">{searchCopy.loading}</Text>
          </View>
        ) : null}

        {!listLoading && listPlaces.length === 0 ? (
          <Text className="mb-6 text-center text-sm text-brand-muted">
            {isKeywordMode
              ? (keywordErrorMessage ?? searchCopy.keywordEmptySub)
              : useTourApiNearby
                ? (cacheEntry?.error ?? searchCopy.searchNoResults)
                : copy.searchEmpty}
          </Text>
        ) : (
          listPlaces.map(place => {
            const selected = selectedId === place.contentId;
            const distLabel =
              anchor && useTourApiNearby
                ? copy.distance(
                    formatDistanceKm(
                      haversineKm(
                        anchor.lat,
                        anchor.lng,
                        place.location.lat,
                        place.location.lng,
                      ),
                      language,
                    ),
                  )
                : undefined;
            const meta = buildPlaceListMetaLine(place, searchCopy, distLabel);

            return (
              <PlaceSearchListItem
                key={place.contentId}
                place={place}
                selected={selected}
                meta={meta}
                onPress={() => setSelectedId(place.contentId)}
              />
            );
          })
        )}
      </ScrollView>
    </AppModal>
  );
}
