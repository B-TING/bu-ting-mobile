import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LockerMapView } from '../../components/locker/LockerMapView';
import { SubwayLockerDetailSheet } from '../../components/locker/SubwayLockerDetailSheet';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { LUGGAGE_STORAGE_COPY } from '../../constants/luggageStorage';
import type { RootStackParamList } from '../../navigation/types';
import { fetchSubwayLockerStations } from '../../services/subwayLockerService';
import { useAppStore, useLockerBookmarkStore } from '../../stores';
import type { SubwayLockerStation } from '../../types/subwayLocker';
import { sortLockerStations } from '../../utils/subwayLockerSort';

type Props = NativeStackScreenProps<RootStackParamList, 'LuggageStorage'>;

export function LuggageStorageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = LUGGAGE_STORAGE_COPY[language];

  const bookmarkedStationIds = useLockerBookmarkStore(s => s.bookmarkedStationIds);
  const toggleBookmark = useLockerBookmarkStore(s => s.toggleBookmark);
  const isBookmarked = useLockerBookmarkStore(s => s.isBookmarked);

  const [stations, setStations] = useState<SubwayLockerStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<SubwayLockerStation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchSubwayLockerStations()
      .then(data => {
        if (!cancelled) {
          setStations(data);
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
  }, []);

  const sortedStations = useMemo(
    () => sortLockerStations(stations, bookmarkedStationIds),
    [stations, bookmarkedStationIds],
  );

  const totalLockers = useMemo(
    () => stations.reduce((sum, station) => sum + station.lockers.total, 0),
    [stations],
  );

  const handleSelectStation = useCallback((station: SubwayLockerStation) => {
    setSelectedStation(station);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    if (!selectedStation) {
      return;
    }
    toggleBookmark(selectedStation.id);
  }, [selectedStation, toggleBookmark]);

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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0077B6" />
          <Text className="mt-3 text-sm text-brand-muted">{copy.loading}</Text>
        </View>
      ) : stations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base font-semibold text-brand-text">{copy.empty}</Text>
          <Text className="mt-2 text-center text-sm text-brand-muted">{copy.emptySub}</Text>
        </View>
      ) : (
        <View className="min-h-0 flex-1">
          <View className="border-b border-brand-border bg-brand-surface px-4 py-2">
            <Text className="text-sm font-semibold text-brand-text">
              {copy.summary(stations.length, totalLockers)}
            </Text>
            <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.dataHint}</Text>
          </View>

          <View className="min-h-0 flex-1">
            <LockerMapView
              stations={sortedStations}
              selectedId={selectedStation?.id}
              bookmarkedIds={bookmarkedStationIds}
              onSelectStation={handleSelectStation}
              mapTitle={copy.mapTitle}
              mapSubtitle={copy.mapSubtitle}
              pinA11y={copy.pinA11y}
              bookmarkedPinA11y={copy.bookmarkedPinA11y}
              lineLabel={copy.lineLabel}
            />
          </View>

          {!detailOpen ? (
            <View className="max-h-40 border-t border-brand-border bg-brand-surface">
              <Text className="px-4 pt-3 text-xs text-brand-muted">{copy.selectStationHint}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
                {sortedStations.map(station => {
                  const bookmarked = isBookmarked(station.id);
                  const selected = selectedStation?.id === station.id;

                  return (
                    <Pressable
                      key={station.id}
                      onPress={() => handleSelectStation(station)}
                      className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                        selected
                          ? 'border-brand-primary bg-brand-selected'
                          : bookmarked
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-brand-border bg-brand-background'
                      }`}>
                      <View className="flex-row items-center gap-1">
                        {bookmarked ? <Text className="text-xs">📌</Text> : null}
                        <Text className="text-sm font-bold text-brand-text">{station.name}</Text>
                      </View>
                      <Text className="mt-0.5 text-xs text-brand-muted">
                        {copy.lineLabel(station.line)} · 🧳 {station.lockers.total}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      )}

      <SubwayLockerDetailSheet
        visible={detailOpen}
        station={selectedStation}
        copy={copy}
        bookmarked={selectedStation ? isBookmarked(selectedStation.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onClose={handleCloseDetail}
      />
    </View>
  );
}
