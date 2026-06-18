import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttractionDetailSheet } from '../../components/attraction/AttractionDetailSheet';
import { AttractionMapView } from '../../components/attraction/AttractionMapView';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { ATTRACTION_COPY } from '../../constants/attractions';
import type { RootStackParamList } from '../../navigation/types';
import { fetchBusanAttractions } from '../../services/googlePlacesService';
import { useAppStore, usePlaceBookmarkStore } from '../../stores';
import type { BusanAttraction } from '../../types/attraction';
import { sortBookmarkedFirst } from '../../utils/sortBookmarkedFirst';

type Props = NativeStackScreenProps<RootStackParamList, 'BusanAttraction'>;

export function BusanAttractionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = ATTRACTION_COPY[language];

  const bookmarkedAttractionIds = usePlaceBookmarkStore(s => s.bookmarkedAttractionIds);
  const toggleAttractionBookmark = usePlaceBookmarkStore(s => s.toggleAttractionBookmark);
  const isAttractionBookmarked = usePlaceBookmarkStore(s => s.isAttractionBookmarked);

  const [attractions, setAttractions] = useState<BusanAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttraction, setSelectedAttraction] = useState<BusanAttraction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchBusanAttractions(language)
      .then(data => {
        if (!cancelled) {
          setAttractions(data);
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

  const sortedAttractions = useMemo(
    () => sortBookmarkedFirst(attractions, bookmarkedAttractionIds, (a, b) => a.name.localeCompare(b.name, 'ko')),
    [attractions, bookmarkedAttractionIds],
  );

  const handleSelectAttraction = useCallback((attraction: BusanAttraction) => {
    setSelectedAttraction(attraction);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    if (!selectedAttraction) {
      return;
    }
    toggleAttractionBookmark(selectedAttraction.id);
  }, [selectedAttraction, toggleAttractionBookmark]);

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
      ) : attractions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base font-semibold text-brand-text">{copy.empty}</Text>
          <Text className="mt-2 text-center text-sm text-brand-muted">{copy.emptySub}</Text>
        </View>
      ) : (
        <View className="min-h-0 flex-1">
          <View className="border-b border-brand-border bg-brand-surface px-4 py-2">
            <Text className="text-sm font-semibold text-brand-text">
              {copy.summary(attractions.length)}
            </Text>
            <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.dataHint}</Text>
          </View>

          <View className="min-h-0 flex-1">
            <AttractionMapView
              attractions={sortedAttractions}
              selectedId={selectedAttraction?.id}
              bookmarkedIds={bookmarkedAttractionIds}
              language={language}
              onSelectAttraction={handleSelectAttraction}
              mapTitle={copy.mapTitle}
              mapSubtitle={copy.mapSubtitle}
              categoryLabel={copy.categoryLabel}
            />
          </View>

          {!detailOpen ? (
            <View className="max-h-40 border-t border-brand-border bg-brand-surface">
              <Text className="px-4 pt-3 text-xs text-brand-muted">{copy.selectHint}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
                {sortedAttractions.map(attraction => {
                  const bookmarked = isAttractionBookmarked(attraction.id);
                  const selected = selectedAttraction?.id === attraction.id;

                  return (
                    <Pressable
                      key={attraction.id}
                      onPress={() => handleSelectAttraction(attraction)}
                      className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                        selected
                          ? 'border-brand-primary bg-brand-selected'
                          : bookmarked
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-brand-border bg-brand-background'
                      }`}>
                      <View className="flex-row items-center gap-1">
                        {bookmarked ? <Text className="text-xs">📌</Text> : null}
                        <Text className="text-sm font-bold text-brand-text">{attraction.name}</Text>
                      </View>
                      <Text className="mt-0.5 text-xs text-brand-muted">
                        {copy.categoryLabel(attraction.categoryLabel[language])} ·{' '}
                        {copy.ratingSummary(attraction.rating, attraction.userRatingsTotal)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      )}

      <AttractionDetailSheet
        visible={detailOpen}
        attraction={selectedAttraction}
        language={language}
        copy={copy}
        bookmarked={selectedAttraction ? isAttractionBookmarked(selectedAttraction.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onClose={handleCloseDetail}
      />
    </View>
  );
}
