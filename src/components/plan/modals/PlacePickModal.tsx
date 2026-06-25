import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { catalogThumbnail } from '../../../constants/places/placeCatalog';
import { TransportModePicker } from '../schedule/TransportModePicker';
import type { AppLanguage } from '../../../types/user';
import type { TravelLegMode } from '../../../types/travelPlan';
import {
  findNearbyRebootCandidates,
  formatDistanceKm,
  listBrowseRebootPlaces,
  searchRebootPlaces,
  type RebootPlaceCandidate,
} from '../../../utils/places/rebootPlaces';
import { cn } from '../../../utils/common/cn';
import { AppModal, AppModalPrimaryFooter } from '../../shared/modals';

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
  onClose: () => void;
  onSelect: (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => void;
};

export function PlacePickModal({
  visible,
  anchor,
  language,
  copy,
  excludePlaceIds,
  showTransportMode = false,
  defaultLegMode = 'walk',
  onClose,
  onSelect,
}: PlacePickModalProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [legMode, setLegMode] = useState<TravelLegMode>(defaultLegMode);

  const nearby = useMemo(() => {
    if (anchor) {
      return findNearbyRebootCandidates(anchor, { excludePlaceIds, language });
    }
    return listBrowseRebootPlaces({ excludePlaceIds, language });
  }, [anchor, excludePlaceIds, language]);

  const searchResults = useMemo(
    () =>
      searchRebootPlaces(query, {
        excludePlaceIds,
        language,
      }),
    [query, excludePlaceIds, language],
  );

  const list = query.trim() ? searchResults : nearby;

  const handleClose = () => {
    setQuery('');
    setSelectedId(null);
    setLegMode(defaultLegMode);
    onClose();
  };

  const handleApply = () => {
    const pick = list.find(c => c.placeId === selectedId);
    if (pick) {
      onSelect(pick, showTransportMode ? legMode : undefined);
      setQuery('');
      setSelectedId(null);
      setLegMode(defaultLegMode);
    }
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

        {list.length === 0 ? (
          <Text className="mb-6 text-center text-sm text-brand-muted">{copy.searchEmpty}</Text>
        ) : (
          list.map(candidate => {
            const selected = selectedId === candidate.placeId;
            const thumb = catalogThumbnail(candidate.placeId);
            const dist =
              candidate.distanceKm > 0
                ? copy.distance(formatDistanceKm(candidate.distanceKm, language))
                : null;
            return (
              <Pressable
                key={candidate.placeId}
                onPress={() => setSelectedId(candidate.placeId)}
                className={cn(
                  'mb-2 flex-row items-center rounded-2xl border p-3 active:opacity-90',
                  selected
                    ? 'border-brand-primary bg-brand-selected'
                    : 'border-brand-border bg-brand-surface',
                )}>
                <View className="mr-3 h-12 w-12 rounded-xl" style={{ backgroundColor: thumb }} />
                <View className="flex-1">
                  <Text className="text-base font-bold text-brand-text">{candidate.placeName}</Text>
                  {dist && <Text className="mt-0.5 text-xs text-brand-muted">{dist}</Text>}
                </View>
                {selected && <Text className="text-lg font-bold text-brand-primary">✓</Text>}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </AppModal>
  );
}
