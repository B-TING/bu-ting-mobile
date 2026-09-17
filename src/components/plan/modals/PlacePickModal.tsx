import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  buildPlaceListMetaLine,
  isFestivalPlaceSearch,
} from '../../../constants/places/placeSearch';
import { useCopy } from '../../../i18n';
import {
  fetchPlaceDetail,
  fetchPlaceDetailsForList,
  searchPlacesByKeyword,
} from '../../../services/places/placesApiService';
import { usePlaceDetailCacheStore, usePlaceSearchStore } from '../../../stores';
import { placeSearchCatchMessage } from '../../../stores';
import { TransportModePicker } from '../schedule/TransportModePicker';
import type { BusanPlace } from '../../../types/placeSearch';
import type { PlaceContentTypeId } from '../../../types/placesApi';
import type { PlaceDetailVO } from '../../../types/googlePlaces';
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
  PLAN_PICK_CONTENT_TYPES,
  busanPlaceToRebootCandidate,
} from '../../../utils/places/placeModelBridge';
import { currentMonthDateRangeYyyymmdd } from '../../../utils/places/festivalApiMapper';
import { haversineKm } from '../../../utils/geo/geo';
import { enrichBusanPlaceFromDetail } from '../../../utils/places/placesApiMapper';
import { logPlacesApiError } from '../../../utils/places/placesApiLogger';
import {
  AppModal,
  AppModalPrimaryFooter,
} from '../../shared/modals';
import { PlaceDetailPanel } from '../../places/PlaceDetailPanel';
import { PlaceMapView } from '../../places/PlaceMapView';
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
  /** true면 TourAPI location/keyword/festival 검색 */
  useTourApiNearby?: boolean;
  contentTypeId?: PlaceContentTypeId;
  onClose: () => void;
  onSelect: (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => void;
};

function rebootCandidateToBusanPlace(candidate: RebootPlaceCandidate): BusanPlace {
  return {
    id: candidate.placeId,
    contentId: candidate.placeId,
    contentTypeId: candidate.contentTypeId ?? PLAN_PICK_CONTENT_TYPE,
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
  contentTypeId: contentTypeIdProp = PLAN_PICK_CONTENT_TYPE,
  onClose,
  onSelect,
}: PlacePickModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const bodyMaxHeight = Math.round(windowHeight * 0.55);
  const [contentTypeId, setContentTypeId] =
    useState<PlaceContentTypeId>(contentTypeIdProp);
  const [queryDraft, setQueryDraft] = useState('');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [keywordPlaces, setKeywordPlaces] = useState<BusanPlace[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordErrorMessage, setKeywordErrorMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [legMode, setLegMode] = useState<TravelLegMode>(defaultLegMode);
  const [detailPlace, setDetailPlace] = useState<BusanPlace | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const keywordRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const festivalDateRange = useMemo(() => currentMonthDateRangeYyyymmdd(), []);

  const searchCopy = useCopy('placeSearch');
  const cacheEntry = usePlaceSearchStore(s => s.cacheByType[contentTypeId]);
  const nearbyLoading = usePlaceSearchStore(s => s.isLoading(contentTypeId));
  const searchByLocation = usePlaceSearchStore(s => s.searchByLocation);
  const searchFestivalsByDateRange = usePlaceSearchStore(s => s.searchFestivalsByDateRange);
  const hasCacheForCenter = usePlaceSearchStore(s => s.hasCacheForCenter);
  const hasCacheForFestivalRange = usePlaceSearchStore(s => s.hasCacheForFestivalRange);
  const mergePlaceDetails = usePlaceDetailCacheStore(s => s.mergeDetails);
  const globalDetails = usePlaceDetailCacheStore(s => s.detailsByPlaceId);

  const isFestivalMode = isFestivalPlaceSearch(contentTypeId);
  const isKeywordMode = useTourApiNearby && activeKeyword != null && activeKeyword.length > 0;
  const showingDetail = useTourApiNearby && detailPlace != null;

  const detailVo: PlaceDetailVO | null = detailPlace
    ? (cacheEntry?.placeDetailsById?.[detailPlace.contentId] ??
      globalDetails[detailPlace.contentId] ??
      null)
    : null;

  useEffect(() => {
    if (!visible) {
      return;
    }
    setContentTypeId(contentTypeIdProp);
    setLegMode(defaultLegMode);
    setDetailPlace(null);
    setDetailLoading(false);
  }, [visible, contentTypeIdProp, defaultLegMode]);

  const clearKeywordState = useCallback(() => {
    keywordRequestIdRef.current += 1;
    setQueryDraft('');
    setActiveKeyword(null);
    setKeywordPlaces([]);
    setKeywordLoading(false);
    setKeywordErrorMessage(null);
    setSelectedId(null);
  }, []);

  const handleChangeContentType = useCallback(
    (typeId: PlaceContentTypeId) => {
      if (typeId === contentTypeId) {
        return;
      }
      clearKeywordState();
      setDetailPlace(null);
      setContentTypeId(typeId);
    },
    [clearKeywordState, contentTypeId],
  );

  useEffect(() => {
    if (!visible || !useTourApiNearby || !anchor || isKeywordMode || showingDetail) {
      return;
    }

    if (isFestivalMode) {
      if (
        hasCacheForFestivalRange(
          festivalDateRange.eventStartDate,
          festivalDateRange.eventEndDate,
        )
      ) {
        return;
      }
      void searchFestivalsByDateRange({
        eventStartDate: festivalDateRange.eventStartDate,
        eventEndDate: festivalDateRange.eventEndDate,
        mapCenter: anchor,
        serverErrorMessage: searchCopy.searchServerError,
        refreshTooSoonMessage: searchCopy.searchRefreshTooSoon,
      });
      return;
    }

    if (hasCacheForCenter(contentTypeId, anchor)) {
      return;
    }

    void searchByLocation({
      contentTypeId,
      searchCenter: anchor,
      mapCenter: anchor,
      serverErrorMessage: searchCopy.searchServerError,
      refreshTooSoonMessage: searchCopy.searchRefreshTooSoon,
    });
  }, [
    visible,
    useTourApiNearby,
    contentTypeId,
    anchor,
    isKeywordMode,
    isFestivalMode,
    showingDetail,
    festivalDateRange.eventStartDate,
    festivalDateRange.eventEndDate,
    hasCacheForCenter,
    hasCacheForFestivalRange,
    searchByLocation,
    searchFestivalsByDateRange,
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
    setDetailPlace(null);

    try {
      const result = await searchPlacesByKeyword({
        keyword,
        contentTypeId,
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
        contentTypeId,
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
    contentTypeId,
    useTourApiNearby,
  ]);

  const handleClearKeyword = useCallback(() => {
    clearKeywordState();
  }, [clearKeywordState]);

  const handleClose = () => {
    clearKeywordState();
    detailRequestIdRef.current += 1;
    setDetailPlace(null);
    setDetailLoading(false);
    setLegMode(defaultLegMode);
    setContentTypeId(contentTypeIdProp);
    onClose();
  };

  const selectPlace = useCallback(
    (place: BusanPlace) => {
      const candidate = busanPlaceToRebootCandidate(place, anchor);
      const mode = showTransportMode ? legMode : undefined;
      clearKeywordState();
      detailRequestIdRef.current += 1;
      setDetailPlace(null);
      setDetailLoading(false);
      setLegMode(defaultLegMode);
      setContentTypeId(contentTypeIdProp);
      onSelect(candidate, mode);
      onClose();
    },
    [
      anchor,
      clearKeywordState,
      contentTypeIdProp,
      defaultLegMode,
      legMode,
      onClose,
      onSelect,
      showTransportMode,
    ],
  );

  const openPlaceDetail = useCallback(
    (place: BusanPlace) => {
      setDetailPlace(place);
      const cached =
        cacheEntry?.placeDetailsById?.[place.contentId] ??
        usePlaceDetailCacheStore.getState().detailsByPlaceId[place.contentId];
      if (cached) {
        setDetailLoading(false);
        return;
      }

      const requestId = ++detailRequestIdRef.current;
      setDetailLoading(true);
      const googleSearchText =
        [place.name, place.address].filter(Boolean).join(' ').trim() || undefined;
      void fetchPlaceDetail({
        contentId: place.contentId,
        contentTypeId: place.contentTypeId,
        googleSearchText,
        fallbackName: place.name,
        fallbackAddress: place.address,
        fallbackImageUrl: place.imageUrl,
      })
        .then(detail => {
          if (requestId !== detailRequestIdRef.current || !detail) {
            return;
          }
          mergePlaceDetails({ [place.contentId]: detail });
          setDetailPlace(prev =>
            prev && prev.contentId === place.contentId
              ? enrichBusanPlaceFromDetail(prev, detail)
              : prev,
          );
        })
        .catch(error => {
          if (requestId !== detailRequestIdRef.current) {
            return;
          }
          logPlacesApiError('GET', '(place-pick-detail)', error, {
            contentId: place.contentId,
            contentTypeId: place.contentTypeId,
          });
        })
        .finally(() => {
          if (requestId === detailRequestIdRef.current) {
            setDetailLoading(false);
          }
        });
    },
    [cacheEntry?.placeDetailsById, mergePlaceDetails],
  );

  const handleApplyLocal = () => {
    const pick = listPlaces.find(place => place.contentId === selectedId);
    if (!pick) {
      return;
    }
    selectPlace(pick);
  };

  const nearbyTitle = isFestivalMode
    ? searchCopy.festivalSummary(listPlaces.length)
    : copy.nearbyTitle;

  const footer = showingDetail ? (
    <AppModalPrimaryFooter
      className="px-5 pt-2 pb-1"
      confirmLabel={copy.applyLabel}
      onConfirm={() => {
        if (detailPlace) {
          selectPlace(detailPlace);
        }
      }}
      cancelLabel={searchCopy.backToList}
      onCancel={() => {
        detailRequestIdRef.current += 1;
        setDetailPlace(null);
        setDetailLoading(false);
      }}
    />
  ) : useTourApiNearby ? undefined : (
    <AppModalPrimaryFooter
      confirmLabel={copy.applyLabel}
      onConfirm={handleApplyLocal}
      confirmDisabled={!selectedId}
      cancelLabel={copy.cancelLabel}
      onCancel={handleClose}
    />
  );

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      title={showingDetail ? detailPlace?.name ?? copy.title : copy.title}
      subtitle={showingDetail ? undefined : copy.subtitle}
      maxHeight="88%"
      keyboardAware={!showingDetail}
      contentStyle={{ paddingBottom: 0 }}
      footer={footer}>
      {showingDetail && detailPlace ? (
        <ScrollView
          style={{ maxHeight: bodyMaxHeight }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>
          <View className="mx-5 mb-3 h-48 overflow-hidden rounded-2xl border border-brand-border">
            <PlaceMapView
              places={[detailPlace]}
              mapCenter={detailPlace.location}
              selectedId={detailPlace.id}
              mapTitle={searchCopy.mapTitle}
              mapSubtitle={
                isFestivalMode ? searchCopy.festivalMapSubtitle : searchCopy.mapSubtitle
              }
              showFooter={false}
            />
          </View>

          <PlaceDetailPanel
            place={detailPlace}
            detail={detailVo}
            language={language}
            copy={searchCopy}
            loading={detailLoading}
            layout="default"
            showHeroImage={false}
          />
        </ScrollView>
      ) : (
        <ScrollView
          className="px-5"
          style={{ maxHeight: bodyMaxHeight }}
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

          {useTourApiNearby ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {PLAN_PICK_CONTENT_TYPES.map(typeId => {
                const selected = contentTypeId === typeId;
                const label = searchCopy.categoryLabels[typeId];
                return (
                  <Pressable
                    key={typeId}
                    onPress={() => handleChangeContentType(typeId)}
                    accessibilityRole="button"
                    accessibilityLabel={searchCopy.categoryTabA11y(label)}
                    className={`mr-2 rounded-full px-3 py-1.5 ${
                      selected ? 'bg-brand-primary' : 'bg-brand-background'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        selected ? 'text-white' : 'text-brand-text'
                      }`}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <Text className="mb-2 text-sm font-bold text-brand-text">
            {isKeywordMode ? copy.searchPlaceholder : nearbyTitle}
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
                  ? (cacheEntry?.error ??
                    (isFestivalMode
                      ? searchCopy.festivalEmptySub
                      : searchCopy.searchNoResults))
                  : copy.searchEmpty}
            </Text>
          ) : (
            listPlaces.map(place => {
              const selected = selectedId === place.contentId;
              const distLabel =
                anchor && useTourApiNearby && !isFestivalMode
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
                  onPress={() =>
                    setSelectedId(prev =>
                      prev === place.contentId ? null : place.contentId,
                    )
                  }
                  expandActions={
                    useTourApiNearby
                      ? {
                          viewDetailLabel: searchCopy.viewDetail,
                          addLabel: copy.applyLabel,
                          onViewDetail: () => openPlaceDetail(place),
                          onAdd: () => selectPlace(place),
                        }
                      : undefined
                  }
                />
              );
            })
          )}
        </ScrollView>
      )}
    </AppModal>
  );
}
