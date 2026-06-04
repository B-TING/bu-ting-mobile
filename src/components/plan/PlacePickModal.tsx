import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogThumbnail } from '../../constants/placeCatalog';
import type { AppLanguage } from '../../types/user';
import {
  findNearbyRebootCandidates,
  formatDistanceKm,
  listBrowseRebootPlaces,
  searchRebootPlaces,
  type RebootPlaceCandidate,
} from '../../utils/rebootPlaces';
import { cn } from '../../utils/cn';

export type PlacePickModalCopy = {
  title: string;
  subtitle?: string;
  nearbyTitle: string;
  searchPlaceholder: string;
  searchEmpty: string;
  applyLabel: string;
  cancelLabel: string;
  distance: (d: string) => string;
};

type PlacePickModalProps = {
  visible: boolean;
  anchor?: { lat: number; lng: number };
  language: AppLanguage;
  copy: PlacePickModalCopy;
  excludePlaceIds: string[];
  onClose: () => void;
  onSelect: (candidate: RebootPlaceCandidate) => void;
};

export function PlacePickModal({
  visible,
  anchor,
  language,
  copy,
  excludePlaceIds,
  onClose,
  onSelect,
}: PlacePickModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    onClose();
  };

  const handleApply = () => {
    const pick = list.find(c => c.placeId === selectedId);
    if (pick) {
      onSelect(pick);
      setQuery('');
      setSelectedId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          className="rounded-t-3xl bg-brand-background">
          <View className="my-2 h-1 w-10 self-center rounded-full bg-brand-border" />
          <ScrollView
            className="max-h-[72%] px-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            <Text className="mb-1 text-xl font-bold text-brand-text">{copy.title}</Text>
            {copy.subtitle ? (
              <Text className="mb-4 text-sm text-brand-muted">{copy.subtitle}</Text>
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
              <Text className="mb-6 text-center text-sm text-brand-muted">
                {copy.searchEmpty}
              </Text>
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
                    <View
                      className="mr-3 h-12 w-12 rounded-xl"
                      style={{ backgroundColor: thumb }}
                    />
                    <View className="flex-1">
                      <Text className="text-base font-bold text-brand-text">
                        {candidate.placeName}
                      </Text>
                      {dist && (
                        <Text className="mt-0.5 text-xs text-brand-muted">{dist}</Text>
                      )}
                    </View>
                    {selected && (
                      <Text className="text-lg font-bold text-brand-primary">✓</Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View className="px-5 pt-2">
            <Pressable
              onPress={handleApply}
              disabled={!selectedId}
              className={cn(
                'mb-2 items-center rounded-2xl py-3.5 active:opacity-90',
                selectedId ? 'bg-brand-primary' : 'bg-brand-border',
              )}>
              <Text
                className={cn(
                  'text-[15px] font-bold',
                  selectedId ? 'text-white' : 'text-brand-muted',
                )}>
                {copy.applyLabel}
              </Text>
            </Pressable>
            <Pressable onPress={handleClose} className="items-center py-2 active:opacity-80">
              <Text className="text-sm font-semibold text-brand-muted">{copy.cancelLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '88%',
  },
});
