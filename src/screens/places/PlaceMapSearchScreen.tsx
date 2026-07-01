import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceDetailSheet } from '../../components/places/PlaceDetailSheet';
import { PlaceMapView } from '../../components/places/PlaceMapView';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  defaultPlaceContentTypeId,
  PLACE_SEARCH_COPY,
} from '../../constants/places/placeSearch';
import { useCurrentEventZone } from '../../hooks/useCurrentEventZone';
import type { RootStackParamList } from '../../navigation/types';
import { searchPlaces } from '../../services/places/placesApiService';
import { useAppStore, usePlaceBookmarkStore } from '../../stores';
import type { BusanPlace } from '../../types/placeSearch';
import { PLACE_MAP_SEARCH_TYPES } from '../../types/placesApi';
import type { PlaceContentTypeId } from '../../types/placesApi';
import { sortBookmarkedFirst } from '../../utils/bookmark/sortBookmarkedFirst';
import {
  resolveNearestTourApiDistrictCode,
  tourApiDistrictLabelKo,
} from '../../utils/places/tourApiDistrict';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceMapSearch'>;

export function PlaceMapSearchScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = PLACE_SEARCH_COPY[language];

  const initialType = defaultPlaceContentTypeId(route.params?.contentTypeId);
  const [contentTypeId, setContentTypeId] = useState<PlaceContentTypeId>(initialType);
  const [places, setPlaces] = useState<BusanPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<BusanPlace | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { location } = useCurrentEventZone();
  const districtCode = useMemo(
    () => resolveNearestTourApiDistrictCode(location),
    [location],
  );
  const districtLabel = tourApiDistrictLabelKo(districtCode);

  const bookmarkedIds = usePlaceBookmarkStore(s => s.getBookmarkedIdsForType(contentTypeId));
  const togglePlaceBookmark = usePlaceBookmarkStore(s => s.togglePlaceBookmark);
  const isPlaceBookmarked = usePlaceBookmarkStore(s => s.isPlaceBookmarked);

  useEffect(() => {
    if (route.params?.contentTypeId) {
      setContentTypeId(defaultPlaceContentTypeId(route.params.contentTypeId));
    }
  }, [route.params?.contentTypeId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedPlace(null);
    setDetailOpen(false);

    searchPlaces({
      contentTypeId,
      districtCode,
      page: 1,
      size: 20,
    })
      .then(data => {
        if (!cancelled) {
          setPlaces(data);
        }
      })
      .catch(fetchError => {
        if (!cancelled) {
          setPlaces([]);
          const message =
            fetchError instanceof Error ? fetchError.message : copy.emptySub;
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [contentTypeId, districtCode, copy.emptySub]);

  const sortedPlaces = useMemo(
    () => sortBookmarkedFirst(places, bookmarkedIds, (a, b) => a.name.localeCompare(b.name, 'ko')),
    [places, bookmarkedIds],
  );

  const handleSelectPlace = useCallback((place: BusanPlace) => {
    setSelectedPlace(place);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    togglePlaceBookmark(selectedPlace.contentTypeId, selectedPlace.contentId);
  }, [selectedPlace, togglePlaceBookmark]);

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
                onPress={() => setContentTypeId(typeId)}
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
        <Text className="mt-2 text-sm font-semibold text-brand-text">
          {copy.summary(places.length, districtLabel)}
        </Text>
        <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.dataHint}</Text>
        {error ? <Text className="mt-1 text-xs text-red-500">{error}</Text> : null}
      </View>

      <View className="relative min-h-0 flex-1">
        <View className="min-h-0 flex-1">
          <PlaceMapView
            places={sortedPlaces}
            mapCenter={location}
            selectedId={selectedPlace?.id}
            bookmarkedIds={bookmarkedIds}
            onSelectPlace={handleSelectPlace}
            mapTitle={copy.mapTitle}
            mapSubtitle={copy.mapSubtitle}
            captionSuffix={captionSuffix}
          />
        </View>

        {loading ? (
          <View className="absolute inset-0 z-10 items-center justify-center bg-brand-background/70">
            <ActivityIndicator size="large" color="#0077B6" />
            <Text className="mt-3 text-sm text-brand-muted">{copy.loading}</Text>
          </View>
        ) : null}

        {!detailOpen ? (
          <View className="border-t border-brand-border bg-brand-surface">
            {sortedPlaces.length === 0 ? (
              <View className="px-4 py-4">
                <Text className="text-center text-sm font-semibold text-brand-text">
                  {copy.empty}
                </Text>
                <Text className="mt-1 text-center text-xs text-brand-muted">{copy.emptySub}</Text>
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
                          {bookmarked ? <Text className="text-xs">📌</Text> : null}
                          <Text className="text-sm font-bold text-brand-text">{place.name}</Text>
                        </View>
                        <Text className="mt-0.5 text-xs text-brand-muted">
                          {copy.categoryLabels[place.contentTypeId]} ·{' '}
                          {copy.ratingSummary(place.rating, place.userRatingsTotal)}
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
        language={language}
        copy={copy}
        bookmarked={
          selectedPlace
            ? isPlaceBookmarked(selectedPlace.contentTypeId, selectedPlace.contentId)
            : false
        }
        onToggleBookmark={handleToggleBookmark}
        onClose={handleCloseDetail}
      />
    </View>
  );
}
