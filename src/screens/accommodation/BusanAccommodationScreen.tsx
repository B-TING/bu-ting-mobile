import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccommodationDetailSheet } from '../../components/accommodation/AccommodationDetailSheet';
import { AccommodationMapView } from '../../components/accommodation/AccommodationMapView';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { ACCOMMODATION_COPY, localizedAreaName } from '../../constants/accommodation';
import type { RootStackParamList } from '../../navigation/types';
import { fetchBusanAccommodations } from '../../kakaoMap';
import { useAppStore, usePlaceBookmarkStore } from '../../stores';
import type { BusanAccommodation } from '../../types/accommodation';
import { sortBookmarkedFirst } from '../../utils/sortBookmarkedFirst';

type Props = NativeStackScreenProps<RootStackParamList, 'BusanAccommodation'>;

export function BusanAccommodationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = ACCOMMODATION_COPY[language];

  const bookmarkedAccommodationIds = usePlaceBookmarkStore(s => s.bookmarkedAccommodationIds);
  const toggleAccommodationBookmark = usePlaceBookmarkStore(s => s.toggleAccommodationBookmark);
  const isAccommodationBookmarked = usePlaceBookmarkStore(s => s.isAccommodationBookmarked);

  const [stays, setStays] = useState<BusanAccommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStay, setSelectedStay] = useState<BusanAccommodation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchBusanAccommodations(language)
      .then(data => {
        if (!cancelled) {
          setStays(data);
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
  }, [language]);

  const sortedStays = useMemo(
    () =>
      sortBookmarkedFirst(stays, bookmarkedAccommodationIds, (a, b) =>
        a.name.localeCompare(b.name, 'ko'),
      ),
    [stays, bookmarkedAccommodationIds],
  );

  const areaCount = useMemo(
    () => new Set(sortedStays.map(stay => stay.areaId)).size,
    [sortedStays],
  );

  const handleSelectStay = useCallback((stay: BusanAccommodation) => {
    setSelectedStay(stay);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    if (!selectedStay) {
      return;
    }
    toggleAccommodationBookmark(selectedStay.id);
  }, [selectedStay, toggleAccommodationBookmark]);

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
      ) : stays.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base font-semibold text-brand-text">{copy.empty}</Text>
          <Text className="mt-2 text-center text-sm text-brand-muted">{copy.emptySub}</Text>
        </View>
      ) : (
        <View className="min-h-0 flex-1">
          <View className="border-b border-brand-border bg-brand-surface px-4 py-2">
            <Text className="text-sm font-semibold text-brand-text">
              {copy.summary(stays.length, areaCount)}
            </Text>
            <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.dataHint}</Text>
          </View>

          <View className="min-h-0 flex-1">
            <AccommodationMapView
              stays={sortedStays}
              selectedId={selectedStay?.id}
              bookmarkedIds={bookmarkedAccommodationIds}
              language={language}
              onSelectStay={handleSelectStay}
              mapTitle={copy.mapTitle}
              mapSubtitle={copy.mapSubtitle}
              pinA11y={copy.pinA11y}
              areaLabel={copy.areaLabel}
            />
          </View>

          {!detailOpen ? (
            <View className="max-h-40 border-t border-brand-border bg-brand-surface">
              <Text className="px-4 pt-3 text-xs text-brand-muted">{copy.selectHint}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
                {sortedStays.map(stay => {
                  const bookmarked = isAccommodationBookmarked(stay.id);
                  const selected = selectedStay?.id === stay.id;

                  return (
                    <Pressable
                      key={stay.id}
                      onPress={() => handleSelectStay(stay)}
                      className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                        selected
                          ? 'border-brand-primary bg-brand-selected'
                          : bookmarked
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-brand-border bg-brand-background'
                      }`}>
                      <View className="flex-row items-center gap-1">
                        {bookmarked ? <Text className="text-xs">📌</Text> : null}
                        <Text className="text-sm font-bold text-brand-text">{stay.name}</Text>
                      </View>
                      <Text className="mt-0.5 text-xs text-brand-muted">
                        {copy.areaLabel(localizedAreaName(stay, language))} ·{' '}
                        {copy.ratingSummary(stay.rating, stay.userRatingsTotal)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      )}

      <AccommodationDetailSheet
        visible={detailOpen}
        stay={selectedStay}
        language={language}
        copy={copy}
        bookmarked={selectedStay ? isAccommodationBookmarked(selectedStay.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onClose={handleCloseDetail}
      />
    </View>
  );
}
