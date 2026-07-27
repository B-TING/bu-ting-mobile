import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';

import { buildPlaceListMetaLine } from '../../../constants/places/placeSearch';
import { useCopy } from '../../../i18n';
import { usePlaceSearchStore } from '../../../stores';
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

function filterPlacesByQuery(places: BusanPlace[], query: string): BusanPlace[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return places;
  }
  return places.filter(place => place.name.toLowerCase().includes(q));
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
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [legMode, setLegMode] = useState<TravelLegMode>(defaultLegMode);

  const searchCopy = useCopy('placeSearch');
  const cacheEntry = usePlaceSearchStore(s => s.cacheByType[PLAN_PICK_CONTENT_TYPE]);
  const apiLoading = usePlaceSearchStore(s => s.isLoading(PLAN_PICK_CONTENT_TYPE));
  const searchByLocation = usePlaceSearchStore(s => s.searchByLocation);
  const hasCacheForCenter = usePlaceSearchStore(s => s.hasCacheForCenter);

  useEffect(() => {
    if (!visible || !useTourApiNearby || !anchor) {
      return;
    }

    if (hasCacheForCenter(PLAN_PICK_CONTENT_TYPE, anchor)) {
      return;
    }

    void searchByLocation({
      contentTypeId: PLAN_PICK_CONTENT_TYPE,
      searchCenter: anchor,
      mapCenter: anchor,
      emptyErrorFallback: copy.searchEmpty,
    });
  }, [visible, useTourApiNearby, anchor, hasCacheForCenter, searchByLocation, copy.searchEmpty]);

  const apiPlaces = useMemo(() => {
    if (!useTourApiNearby || !anchor) {
      return [];
    }
    const exclude = new Set(excludePlaceIds);
    const places = (cacheEntry?.places ?? []).filter(place => !exclude.has(place.contentId));
    return filterPlacesByQuery(places, query).sort((a, b) => {
      const da = haversineKm(anchor.lat, anchor.lng, a.location.lat, a.location.lng);
      const db = haversineKm(anchor.lat, anchor.lng, b.location.lat, b.location.lng);
      return da - db;
    });
  }, [useTourApiNearby, anchor, cacheEntry?.places, excludePlaceIds, query]);

  const localCandidates = useMemo(() => {
    if (useTourApiNearby && anchor) {
      return [];
    }
    if (query.trim()) {
      return searchRebootPlaces(query, { excludePlaceIds, language });
    }
    if (anchor) {
      return findNearbyRebootCandidates(anchor, { excludePlaceIds, language });
    }
    return listBrowseRebootPlaces({ excludePlaceIds, language });
  }, [useTourApiNearby, anchor, query, excludePlaceIds, language]);

  const localPlaces = useMemo(
    () => localCandidates.map(rebootCandidateToBusanPlace),
    [localCandidates],
  );

  const listPlaces = useTourApiNearby && anchor ? apiPlaces : localPlaces;

  const handleClose = () => {
    setQuery('');
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
    setQuery('');
    setSelectedId(null);
    setLegMode(defaultLegMode);
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
          {query.trim() ? copy.searchPlaceholder : copy.nearbyTitle}
        </Text>
        <TextInput
          className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
          value={query}
          onChangeText={text => {
            setQuery(text);
            setSelectedId(null);
          }}
          placeholder={copy.searchPlaceholder}
          autoCapitalize="none"
        />

        {apiLoading && useTourApiNearby && !query.trim() ? (
          <View className="mb-4 items-center py-4">
            <ActivityIndicator color="#0077B6" />
            <Text className="mt-2 text-xs text-brand-muted">{searchCopy.loading}</Text>
          </View>
        ) : null}

        {useTourApiNearby && !anchor && !query.trim() ? (
          <View className="mb-4 items-center py-4">
            <ActivityIndicator color="#0077B6" />
            <Text className="mt-2 text-xs text-brand-muted">{searchCopy.loading}</Text>
          </View>
        ) : null}

        {listPlaces.length === 0 && !apiLoading && !(useTourApiNearby && !anchor) ? (
          <Text className="mb-6 text-center text-sm text-brand-muted">{copy.searchEmpty}</Text>
        ) : (
          listPlaces.map(place => {
            const selected = selectedId === place.contentId;
            const dist =
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
            const meta = buildPlaceListMetaLine(place, searchCopy, dist);

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
