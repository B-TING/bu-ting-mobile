import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceDetailSheet } from '../../components/places/PlaceDetailSheet';
import { PlaceMapView } from '../../components/places/PlaceMapView';
import { TransientBottomToast } from '../../components/shared/feedback/TransientBottomToast';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import {
  defaultPlaceContentTypeId,
  isFestivalPlaceSearch,
  PLACE_SEARCH_CENTER_THRESHOLD_M,
  PLACE_SEARCH_RADIUS_M,
  PLACE_SEARCH_REFRESH_COOLDOWN_MS,
  buildPlaceListMetaLine,
} from '../../constants/places/placeSearch';
import { ICON_COLOR_PRIMARY } from '../../constants/icons';
import { useAppLanguage, useCopy } from '../../i18n';
import { usePlaceMapUserLocation } from '../../hooks/usePlaceMapUserLocation';
import { useTransientBottomToast } from '../../hooks/useTransientBottomToast';
import type { RootStackParamList } from '../../navigation/types';
import {
  fetchPlaceDetail,
  fetchPlaceDetailsForList,
  searchPlacesByKeyword,
} from '../../services/places/placesApiService';
import { usePlaceBookmarkStore, usePlaceDetailCacheStore, usePlaceSearchStore } from '../../stores';
import { isPlaceSearchNoResultsMessage } from '../../stores';
import type { EventZoneCoordinate } from '../../types/eventZone';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { BusanPlace } from '../../types/placeSearch';
import { PLACE_MAP_SEARCH_TYPES } from '../../types/placesApi';
import type { PlaceContentTypeId } from '../../types/placesApi';
import { sortBookmarkedFirst } from '../../utils/bookmark/sortBookmarkedFirst';
import {
  currentMonthDateRangeYyyymmdd,
  upcomingFestivalDateRangeYyyymmdd,
} from '../../utils/places/festivalApiMapper';
import { haversineKm } from '../../utils/geo/geo';
import { enrichBusanPlaceFromDetail } from '../../utils/places/placesApiMapper';
import { logPlacesApiError } from '../../utils/places/placesApiLogger';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceMapSearch'>;

function centersDifferBeyondThreshold(
  a: EventZoneCoordinate,
  b: EventZoneCoordinate,
  thresholdM: number,
): boolean {
  const distanceM = haversineKm(a.lat, a.lng, b.lat, b.lng) * 1000;
  return distanceM > thresholdM;
}

function resolveFestivalDateRange(
  params: RootStackParamList['PlaceMapSearch'],
): { eventStartDate: string; eventEndDate: string } {
  if (params?.festivalEventStartDate) {
    return {
      eventStartDate: params.festivalEventStartDate,
      eventEndDate: params.festivalEventEndDate ?? params.festivalEventStartDate,
    };
  }
  if (params?.selectedContentId) {
    return upcomingFestivalDateRangeYyyymmdd();
  }
  return currentMonthDateRangeYyyymmdd();
}

function notifyNoSearchResults(message: string, showToast: (text: string) => void) {
  // 지도 WebView가 RN absolute 뷰를 가리므로 Android는 시스템 토스트 사용
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  showToast(message);
}

export function PlaceMapSearchScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('placeSearch');
  const radiusKm = PLACE_SEARCH_RADIUS_M / 1000;
  const { text: toastText, opacity: toastOpacity, showToast } = useTransientBottomToast();

  const initialType = defaultPlaceContentTypeId(route.params?.contentTypeId);
  const [contentTypeId, setContentTypeId] = useState<PlaceContentTypeId>(initialType);
  const [selectedPlace, setSelectedPlace] = useState<BusanPlace | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchCenter, setSearchCenter] = useState<EventZoneCoordinate | null>(null);
  const [mapCenter, setMapCenter] = useState<EventZoneCoordinate | null>(null);
  const [festivalDateRange, setFestivalDateRange] = useState(() =>
    resolveFestivalDateRange(route.params),
  );
  const selectedContentHandledRef = useRef<string | null>(null);

  const [keywordDraft, setKeywordDraft] = useState('');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [keywordPlaces, setKeywordPlaces] = useState<BusanPlace[]>([]);
  const [keywordDetailsById, setKeywordDetailsById] = useState<
    Record<string, PlaceDetailVO | null>
  >({});
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const keywordRequestIdRef = useRef(0);

  const isFestivalMode = isFestivalPlaceSearch(contentTypeId);
  const isKeywordMode = activeKeyword != null && activeKeyword.length > 0;
  const { location } = usePlaceMapUserLocation();
  const mergePlaceDetails = usePlaceDetailCacheStore(s => s.mergeDetails);

  const cacheEntry = usePlaceSearchStore(s => s.cacheByType[contentTypeId]);
  const locationLoading = usePlaceSearchStore(s => s.isLoading(contentTypeId));
  const hasCacheForCenter = usePlaceSearchStore(s => s.hasCacheForCenter);
  const hasCacheForFestivalRange = usePlaceSearchStore(s => s.hasCacheForFestivalRange);
  const searchByLocation = usePlaceSearchStore(s => s.searchByLocation);
  const searchFestivalsByDateRange = usePlaceSearchStore(s => s.searchFestivalsByDateRange);
  const updateMapCenterInCache = usePlaceSearchStore(s => s.updateMapCenter);
  const getCacheEntry = usePlaceSearchStore(s => s.getEntry);
  const lastSearchRequestedAt = usePlaceSearchStore(
    s => s.lastSearchRequestedAtByType[contentTypeId] ?? null,
  );

  const [nowMs, setNowMs] = useState(() => Date.now());
  const searchCooldownRemainingMs = Math.max(
    0,
    lastSearchRequestedAt == null
      ? 0
      : PLACE_SEARCH_REFRESH_COOLDOWN_MS - (nowMs - lastSearchRequestedAt),
  );
  const searchCooldownSeconds = Math.max(1, Math.ceil(searchCooldownRemainingMs / 1000));
  const isSearchCooldownActive = searchCooldownRemainingMs > 0;

  useEffect(() => {
    if (!isSearchCooldownActive) {
      return;
    }
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 250);
    return () => clearInterval(timer);
  }, [isSearchCooldownActive, lastSearchRequestedAt]);

  const bookmarkedIds = usePlaceBookmarkStore(s => s.getBookmarkedIdsForType(contentTypeId));
  const togglePlaceBookmark = usePlaceBookmarkStore(s => s.togglePlaceBookmark);
  const isPlaceBookmarked = usePlaceBookmarkStore(s => s.isPlaceBookmarked);

  const locationPlaces = useMemo(() => cacheEntry?.places ?? [], [cacheEntry]);
  const places = isKeywordMode ? keywordPlaces : locationPlaces;
  const placeDetailsById = isKeywordMode
    ? keywordDetailsById
    : (cacheEntry?.placeDetailsById ?? {});
  const globalPlaceDetails = usePlaceDetailCacheStore(s => s.detailsByPlaceId);
  const rawError = isKeywordMode ? null : (cacheEntry?.error ?? null);
  const isNoResultsError = rawError != null && isPlaceSearchNoResultsMessage(rawError);
  const error = isNoResultsError ? null : rawError;
  const loading = isKeywordMode ? keywordLoading : locationLoading;

  useEffect(() => {
    if (!isNoResultsError || !rawError) {
      return;
    }
    notifyNoSearchResults(copy.searchNoResults, showToast);
    const entry = usePlaceSearchStore.getState().getEntry(contentTypeId);
    if (!entry?.error) {
      return;
    }
    usePlaceSearchStore.setState(state => ({
      cacheByType: {
        ...state.cacheByType,
        [contentTypeId]: { ...entry, error: null },
      },
    }));
  }, [isNoResultsError, rawError, contentTypeId, showToast, copy.searchNoResults]);

  useEffect(() => {
    if (route.params?.contentTypeId) {
      setContentTypeId(defaultPlaceContentTypeId(route.params.contentTypeId));
    }
    if (route.params?.festivalEventStartDate || route.params?.festivalEventEndDate) {
      setFestivalDateRange(resolveFestivalDateRange(route.params));
    }
    selectedContentHandledRef.current = null;
    // Quick로 카테고리를 바꿔 다시 들어오면 이전 검색 중심이 남지 않게 함
    setSearchCenter(null);
    setMapCenter(null);
  }, [
    route.params?.contentTypeId,
    route.params?.festivalEventStartDate,
    route.params?.festivalEventEndDate,
    route.params?.selectedContentId,
  ]);

  const applyCachedCenters = useCallback((typeId: PlaceContentTypeId) => {
    const cached = getCacheEntry(typeId);
    if (!cached) {
      return false;
    }
    setSearchCenter(cached.searchCenter);
    setMapCenter(cached.mapCenter);
    if (cached.festivalDateRange) {
      setFestivalDateRange(cached.festivalDateRange);
    }
    return true;
  }, [getCacheEntry]);

  // Quick 진입: GPS/동의 완료를 기다리지 않음.
  // usePlaceMapUserLocation 초기값이 부산역이라 status=loading 이어도 바로 검색 가능.
  useEffect(() => {
    if (applyCachedCenters(contentTypeId)) {
      return;
    }
    setSearchCenter(prev => prev ?? location);
    setMapCenter(prev => prev ?? location);
  }, [contentTypeId, location, applyCachedCenters]);

  useEffect(() => {
    if (isKeywordMode) {
      return;
    }

    if (isFestivalMode) {
      if (!mapCenter) {
        return;
      }
      if (
        hasCacheForFestivalRange(
          festivalDateRange.eventStartDate,
          festivalDateRange.eventEndDate,
        )
      ) {
        return;
      }

      setSelectedPlace(null);
      setDetailOpen(false);

      void searchFestivalsByDateRange({
        eventStartDate: festivalDateRange.eventStartDate,
        eventEndDate: festivalDateRange.eventEndDate,
        mapCenter,
        emptyErrorFallback: copy.festivalEmptySub,
        refreshTooSoonMessage: copy.searchRefreshTooSoon,
      }).then(outcome => {
        if (outcome === 'empty') {
          notifyNoSearchResults(copy.searchNoResults, showToast);
        }
      });
      return;
    }

    if (!searchCenter) {
      return;
    }
    if (hasCacheForCenter(contentTypeId, searchCenter)) {
      return;
    }

    setSelectedPlace(null);
    setDetailOpen(false);

    void searchByLocation({
      contentTypeId,
      searchCenter,
      mapCenter: mapCenter ?? searchCenter,
      emptyErrorFallback: copy.emptySub,
      refreshTooSoonMessage: copy.searchRefreshTooSoon,
    }).then(outcome => {
      if (outcome === 'empty') {
        notifyNoSearchResults(copy.searchNoResults, showToast);
      }
    });
  }, [
    isKeywordMode,
    isFestivalMode,
    contentTypeId,
    searchCenter,
    mapCenter,
    festivalDateRange,
    hasCacheForCenter,
    hasCacheForFestivalRange,
    searchByLocation,
    searchFestivalsByDateRange,
    showToast,
    copy.emptySub,
    copy.festivalEmptySub,
    copy.searchNoResults,
    copy.searchRefreshTooSoon,
  ]);

  useEffect(() => {
    const selectedContentId = route.params?.selectedContentId;
    if (!selectedContentId || places.length === 0) {
      return;
    }
    const handleKey = `${selectedContentId}:${places.length}`;
    if (selectedContentHandledRef.current === handleKey) {
      return;
    }

    const place = places.find(item => item.contentId === selectedContentId);
    if (!place) {
      return;
    }

    selectedContentHandledRef.current = handleKey;
    setSelectedPlace(place);
    setDetailOpen(true);
    setMapCenter(place.location);
  }, [route.params?.selectedContentId, places]);

  const showSearchHere = useMemo(() => {
    if (isKeywordMode || isFestivalMode) {
      return false;
    }
    if (!searchCenter || !mapCenter) {
      return false;
    }
    return centersDifferBeyondThreshold(
      searchCenter,
      mapCenter,
      PLACE_SEARCH_CENTER_THRESHOLD_M,
    );
  }, [isFestivalMode, isKeywordMode, searchCenter, mapCenter]);

  const sortedPlaces = useMemo(
    () => sortBookmarkedFirst(places, bookmarkedIds, (a, b) => a.name.localeCompare(b.name, 'ko')),
    [places, bookmarkedIds],
  );

  const summaryText = isKeywordMode && activeKeyword
    ? copy.keywordSummary(activeKeyword, places.length)
    : isFestivalMode
      ? copy.festivalSummary(places.length)
      : copy.summary(places.length, radiusKm);

  const mapSubtitle = isFestivalMode ? copy.festivalMapSubtitle : copy.mapSubtitle;

  const handleSelectPlace = useCallback(
    (place: BusanPlace) => {
      setSelectedPlace(place);
      setDetailOpen(true);
      setMapCenter(place.location);

      const cached =
        (isKeywordMode ? keywordDetailsById[place.contentId] : undefined) ??
        usePlaceSearchStore.getState().getEntry(contentTypeId)?.placeDetailsById[place.contentId] ??
        usePlaceDetailCacheStore.getState().detailsByPlaceId[place.contentId];

      if (cached) {
        return;
      }

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
          if (!detail) {
            return;
          }
          mergePlaceDetails({ [place.contentId]: detail });
          if (isKeywordMode) {
            setKeywordDetailsById(prev => ({ ...prev, [place.contentId]: detail }));
            setKeywordPlaces(prev =>
              prev.map(item =>
                item.contentId === place.contentId
                  ? enrichBusanPlaceFromDetail(item, detail)
                  : item,
              ),
            );
          }
        })
        .catch(detailError => {
          logPlacesApiError('GET', `/api/v1/places/${place.contentId}/detail`, detailError, {
            contentId: place.contentId,
            contentTypeId: place.contentTypeId,
          });
        })
        .finally(() => {
          setDetailLoading(false);
        });
    },
    [contentTypeId, isKeywordMode, keywordDetailsById, mergePlaceDetails],
  );

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    togglePlaceBookmark(selectedPlace.contentTypeId, selectedPlace.contentId);
  }, [selectedPlace, togglePlaceBookmark]);

  const handleMapCenterChange = useCallback(
    (center: EventZoneCoordinate) => {
      setMapCenter(center);
      updateMapCenterInCache(contentTypeId, center);
    },
    [contentTypeId, updateMapCenterInCache],
  );

  const clearTypeCache = usePlaceSearchStore(s => s.clearTypeCache);

  const handleSearchHere = useCallback(() => {
    if (!mapCenter || isSearchCooldownActive || isKeywordMode) {
      return;
    }
    // 같은 중심이라도 사용자가 명시적으로 누르면 다시 검색
    clearTypeCache(contentTypeId);
    setSearchCenter({ lat: mapCenter.lat, lng: mapCenter.lng });
  }, [clearTypeCache, contentTypeId, isKeywordMode, isSearchCooldownActive, mapCenter]);

  const runKeywordSearch = useCallback(
    async (rawKeyword: string, typeId: PlaceContentTypeId) => {
      const keyword = rawKeyword.trim();
      if (!keyword) {
        return;
      }

      const requestId = ++keywordRequestIdRef.current;
      setActiveKeyword(keyword);
      setKeywordDraft(keyword);
      setKeywordLoading(true);
      setSelectedPlace(null);
      setDetailOpen(false);

      try {
        const result = await searchPlacesByKeyword({
          keyword,
          contentTypeId: typeId,
          page: 1,
          size: 20,
        });

        if (requestId !== keywordRequestIdRef.current) {
          return;
        }

        if (result.places.length === 0) {
          setKeywordPlaces([]);
          setKeywordDetailsById({});
          notifyNoSearchResults(copy.searchNoResults, showToast);
          return;
        }

        setKeywordPlaces(result.places);
        setKeywordLoading(false);

        const first = result.places[0];
        if (first) {
          setMapCenter(first.location);
        }

        try {
          const detailsById = await fetchPlaceDetailsForList(result.places);
          if (requestId !== keywordRequestIdRef.current) {
            return;
          }
          const enriched = result.places.map(place =>
            enrichBusanPlaceFromDetail(place, detailsById[place.contentId]),
          );
          setKeywordPlaces(enriched);
          setKeywordDetailsById(detailsById);
          mergePlaceDetails(detailsById);
        } catch (detailError) {
          if (requestId !== keywordRequestIdRef.current) {
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
        if (requestId !== keywordRequestIdRef.current) {
          return;
        }
        logPlacesApiError('GET', '/api/v1/places/search', searchError, {
          keyword,
          contentTypeId: typeId,
        });
        setKeywordPlaces([]);
        setKeywordDetailsById({});
        notifyNoSearchResults(copy.searchNoResults, showToast);
      } finally {
        if (requestId === keywordRequestIdRef.current) {
          setKeywordLoading(false);
        }
      }
    },
    [copy.searchNoResults, mergePlaceDetails, showToast],
  );

  const handleSubmitKeyword = useCallback(() => {
    void runKeywordSearch(keywordDraft, contentTypeId);
  }, [contentTypeId, keywordDraft, runKeywordSearch]);

  const handleClearKeyword = useCallback(() => {
    keywordRequestIdRef.current += 1;
    setActiveKeyword(null);
    setKeywordDraft('');
    setKeywordPlaces([]);
    setKeywordDetailsById({});
    setKeywordLoading(false);
    setSelectedPlace(null);
    setDetailOpen(false);
  }, []);

  const handleChangeContentType = useCallback(
    (typeId: PlaceContentTypeId) => {
      if (typeId === contentTypeId) {
        return;
      }

      setContentTypeId(typeId);
      setSelectedPlace(null);
      setDetailOpen(false);
      selectedContentHandledRef.current = null;

      if (isFestivalPlaceSearch(typeId)) {
        setFestivalDateRange(currentMonthDateRangeYyyymmdd());
      }

      if (isKeywordMode && activeKeyword) {
        void runKeywordSearch(activeKeyword, typeId);
        return;
      }

      if (applyCachedCenters(typeId)) {
        return;
      }

      const center = mapCenter ?? searchCenter ?? location;
      if (center) {
        // 탭 전환 시 항상 새 중심으로 검색 effect가 돌도록 참조 갱신
        setSearchCenter({ lat: center.lat, lng: center.lng });
        setMapCenter({ lat: center.lat, lng: center.lng });
      }
    },
    [
      activeKeyword,
      applyCachedCenters,
      contentTypeId,
      isKeywordMode,
      location,
      mapCenter,
      runKeywordSearch,
      searchCenter,
    ],
  );

  const captionSuffix = useCallback(
    (place: BusanPlace) => copy.subtitleLabel(copy.categoryLabels[place.contentTypeId]),
    [copy],
  );

  return (
    <View
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {copy.screenTitle}
        </Text>
      </View>

      <View className="border-b border-brand-border bg-brand-surface px-4 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PLACE_MAP_SEARCH_TYPES.map(typeId => {
            const selected = contentTypeId === typeId;
            const label = copy.categoryLabels[typeId];
            return (
              <Pressable
                key={typeId}
                onPress={() => handleChangeContentType(typeId)}
                accessibilityRole="button"
                accessibilityLabel={copy.categoryTabA11y(label)}
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
        <Text className="mt-2 text-sm font-semibold text-brand-text">{summaryText}</Text>
        <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.dataHint}</Text>
        {error ? <Text className="mt-1 text-xs text-red-500">{error}</Text> : null}
        {isSearchCooldownActive ? (
          <Text className="mt-1 text-xs text-brand-muted">
            {copy.searchCooldown(searchCooldownSeconds)}
          </Text>
        ) : null}
      </View>

      <View className="relative min-h-0 flex-1">
        <View className="min-h-0 flex-1">
          <PlaceMapView
            places={sortedPlaces}
            mapCenter={mapCenter ?? location}
            selectedId={selectedPlace?.id}
            bookmarkedIds={bookmarkedIds}
            onSelectPlace={handleSelectPlace}
            onMapCenterChange={handleMapCenterChange}
            mapTitle={copy.mapTitle}
            mapSubtitle={mapSubtitle}
            captionSuffix={captionSuffix}
          />
        </View>

        {showSearchHere ? (
          <View className="absolute left-0 right-0 top-3 z-20 items-center px-4">
            <Pressable
              onPress={handleSearchHere}
              disabled={isSearchCooldownActive}
              accessibilityRole="button"
              accessibilityLabel={
                isSearchCooldownActive
                  ? copy.searchCooldown(searchCooldownSeconds)
                  : copy.searchHere
              }
              className={`rounded-full px-4 py-2.5 shadow-md ${
                isSearchCooldownActive ? 'bg-brand-muted' : 'bg-brand-primary active:opacity-90'
              }`}>
              <Text className="text-sm font-bold text-white">
                {isSearchCooldownActive
                  ? copy.searchCooldown(searchCooldownSeconds)
                  : copy.searchHere}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View className="absolute inset-0 z-10 items-center justify-center bg-brand-background/70">
            <ActivityIndicator size="large" color="#0077B6" />
            <Text className="mt-3 text-sm text-brand-muted">{copy.loading}</Text>
          </View>
        ) : null}

        {!detailOpen ? (
          <View className="border-t border-brand-border bg-brand-surface">
            <View className="flex-row items-center gap-2 px-4 pt-3">
              <TextInput
                className="min-h-11 flex-1 rounded-2xl border border-brand-border bg-brand-background px-3 py-2.5 text-sm text-brand-text"
                value={keywordDraft}
                onChangeText={setKeywordDraft}
                placeholder={copy.keywordPlaceholder}
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                onSubmitEditing={handleSubmitKeyword}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={copy.keywordSearchA11y}
              />
              {isKeywordMode || keywordDraft.trim().length > 0 ? (
                <Pressable
                  onPress={handleClearKeyword}
                  accessibilityRole="button"
                  accessibilityLabel={copy.keywordClearA11y}
                  className="h-11 w-11 items-center justify-center rounded-2xl border border-brand-border bg-brand-background active:opacity-80">
                  <Text className="text-base font-bold text-brand-muted">×</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleSubmitKeyword}
                disabled={keywordDraft.trim().length === 0 || keywordLoading}
                accessibilityRole="button"
                accessibilityLabel={copy.keywordSearchA11y}
                className={`h-11 items-center justify-center rounded-2xl px-3 ${
                  keywordDraft.trim().length === 0 || keywordLoading
                    ? 'bg-brand-muted'
                    : 'bg-brand-primary active:opacity-90'
                }`}>
                <Text className="text-sm font-bold text-white">
                  {copy.keywordSearchButton}
                </Text>
              </Pressable>
            </View>

            {sortedPlaces.length === 0 ? (
              <View className="px-4 py-4">
                <Text className="text-center text-sm font-semibold text-brand-text">
                  {copy.empty}
                </Text>
                <Text className="mt-1 text-center text-xs text-brand-muted">
                  {isKeywordMode
                    ? copy.keywordEmptySub
                    : isFestivalMode
                      ? copy.festivalEmptySub
                      : copy.emptySub}
                </Text>
              </View>
            ) : (
              <>
                <Text className="px-4 pt-3 text-xs text-brand-muted">{copy.selectHint}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="max-h-40"
                  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
                  {sortedPlaces.map(place => {
                    const bookmarked = isPlaceBookmarked(place.contentTypeId, place.contentId);
                    const selected = selectedPlace?.id === place.id;

                    return (
                      <Pressable
                        key={place.id}
                        onPress={() => handleSelectPlace(place)}
                        className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                          selected
                            ? 'border-brand-primary bg-brand-selected'
                            : bookmarked
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-brand-border bg-brand-background'
                        }`}>
                        <View className="flex-row items-center gap-1">
                          {bookmarked ? (
                            <AppIcon name="mapPin" size={12} color={ICON_COLOR_PRIMARY} filled />
                          ) : null}
                          <Text className="text-sm font-bold text-brand-text">{place.name}</Text>
                        </View>
                        <Text className="mt-0.5 text-xs text-brand-muted">
                          {buildPlaceListMetaLine(place, copy)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        ) : null}
      </View>

      <PlaceDetailSheet
        visible={detailOpen}
        place={selectedPlace}
        detail={
          selectedPlace
            ? (placeDetailsById[selectedPlace.contentId] ??
              globalPlaceDetails[selectedPlace.contentId] ??
              null)
            : null
        }
        language={language}
        copy={copy}
        loading={detailLoading}
        bookmarked={
          selectedPlace
            ? isPlaceBookmarked(selectedPlace.contentTypeId, selectedPlace.contentId)
            : false
        }
        onToggleBookmark={handleToggleBookmark}
        onClose={handleCloseDetail}
      />

      <TransientBottomToast
        text={toastText}
        opacity={toastOpacity}
        bottom={Math.max(insets.bottom, 12) + 96}
      />
    </View>
  );
}
