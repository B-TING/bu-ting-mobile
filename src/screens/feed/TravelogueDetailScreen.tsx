import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NaverMapPlaceholder } from '../../components/plan/NaverMapPlaceholder';
import { BackButton } from '../../components/plan/BackButton';
import { StarRating } from '../../components/review/StarRating';
import { TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import type { RootStackParamList } from '../../navigation/types';
import { selectPlanById, useAppStore, usePlanStore, useTravelogueStore } from '../../stores';
import type { PlaceReview } from '../../types/travelReview';
import {
  flattenItineraryRoutes,
  getReviewForRoute,
  resolveTravelogueItinerary,
  snapshotToRouteItems,
} from '../../utils/travelReview';
import { formatWeekdayDate } from '../../utils/geo';

type Props = NativeStackScreenProps<RootStackParamList, 'TravelogueDetail'>;

function PlaceReviewBlock({
  review,
  copy,
}: {
  review: PlaceReview;
  copy: (typeof TRAVEL_REVIEW_COPY)['ko'];
}) {
  return (
    <View className="mt-2 border-t border-brand-border pt-2">
      <View className="flex-row items-center gap-2">
        <StarRating value={review.rating} readonly size="sm" />
        <Text className="text-xs text-brand-muted">{copy.stars(review.rating)}</Text>
      </View>
      {review.tags.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1">
          {review.tags.map(tag => (
            <View key={tag} className="rounded-full bg-brand-selected px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-brand-primary">#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {review.comment ? (
        <Text className="mt-2 text-sm leading-5 text-brand-text">{review.comment}</Text>
      ) : null}
      {review.media.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {review.media.map(item => (
            <View
              key={item.mediaId}
              className="h-12 w-12 items-center justify-center rounded-xl bg-brand-selected">
              <Text className="text-lg">{item.thumbnailUri ?? '📎'}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function TravelogueDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = TRAVEL_REVIEW_COPY[language];
  const travelogue = useTravelogueStore(s =>
    s.publishedTravelogues.find(t => t.travelogueId === route.params.travelogueId),
  );
  const linkedPlan = usePlanStore(
    travelogue ? selectPlanById(travelogue.planId) : () => null,
  );

  const itinerary = useMemo(
    () => (travelogue ? resolveTravelogueItinerary(travelogue, linkedPlan) : []),
    [travelogue, linkedPlan],
  );

  const mapRoutes = useMemo(
    () => snapshotToRouteItems(flattenItineraryRoutes(itinerary)),
    [itinerary],
  );

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    if (mapRoutes.length === 0) {
      setSelectedRouteId(null);
      return;
    }
    setSelectedRouteId(prev =>
      prev && mapRoutes.some(r => r.itemId === prev) ? prev : mapRoutes[0].itemId,
    );
  }, [mapRoutes]);

  if (!travelogue) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6">
        <Text className="text-brand-muted">
          {language === 'ko' ? '여행기를 찾을 수 없어요' : 'Travelogue not found'}
        </Text>
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const publishedDate = new Date(travelogue.publishedAt).toLocaleDateString();
  const tripPeriod =
    travelogue.startDate && travelogue.endDate
      ? copy.tripPeriod(travelogue.startDate, travelogue.endDate)
      : null;

  let globalOrder = 0;

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {copy.feedTitle}
        </Text>
      </View>

      {mapRoutes.length > 0 ? (
        <View className="border-b border-brand-border bg-brand-surface px-4 py-3">
          <NaverMapPlaceholder
            title={copy.mapTitle}
            subtitle={copy.mapSubtitle}
            routes={mapRoutes}
            highlightItemId={selectedRouteId}
          />
        </View>
      ) : null}

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        <Text className="text-[10px] font-bold tracking-wide text-brand-primary">
          TRAVELOGUE
        </Text>
        <Text className="mt-1 text-2xl font-bold text-brand-text">{travelogue.title}</Text>
        <Text className="mt-2 text-sm text-brand-muted">
          {copy.detailBy(travelogue.authorName)} · {travelogue.destinationLabel} ·{' '}
          {publishedDate}
        </Text>
        {tripPeriod ? (
          <Text className="mt-1 text-xs text-brand-muted">{tripPeriod}</Text>
        ) : null}

        <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
          <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallRating}</Text>
          <View className="flex-row items-center gap-2">
            <StarRating value={travelogue.overallRating} readonly />
            <Text className="text-sm font-bold text-brand-primary">
              {copy.stars(travelogue.overallRating)}
            </Text>
          </View>
          {travelogue.overallReview ? (
            <>
              <Text className="mb-2 mt-4 text-xs font-bold text-brand-muted">
                {copy.overallSummary}
              </Text>
              <Text className="text-sm leading-6 text-brand-text">{travelogue.overallReview}</Text>
            </>
          ) : null}
        </View>

        {itinerary.length > 0 ? (
          <>
            <Text className="mb-3 mt-6 text-base font-bold text-brand-text">
              {copy.itinerarySection}
            </Text>
            {itinerary.map(day => (
              <View key={`day-${day.dayNumber}`} className="mb-4">
                <Text className="mb-2 text-sm font-bold text-brand-primary">
                  {copy.dayLabel(day.dayNumber)} · {formatWeekdayDate(day.date, language)}
                </Text>
                {day.routes.map(routeItem => {
                  globalOrder += 1;
                  const order = globalOrder;
                  const review = getReviewForRoute(
                    travelogue.placeReviews,
                    routeItem.itemId,
                  );
                  const selected = selectedRouteId === routeItem.itemId;

                  return (
                    <Pressable
                      key={routeItem.itemId}
                      onPress={() => setSelectedRouteId(routeItem.itemId)}
                      className={`mb-2 rounded-2xl border p-4 ${
                        selected
                          ? 'border-brand-primary bg-brand-selected'
                          : 'border-brand-border bg-brand-surface'
                      } active:opacity-90`}>
                      <View className="flex-row items-start">
                        <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-brand-primary">
                          <Text className="text-sm font-bold text-white">{order}</Text>
                        </View>
                        <View className="min-w-0 flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="flex-1 text-base font-bold text-brand-text">
                              {routeItem.placeName}
                            </Text>
                            <View
                              className={`rounded-full px-2 py-0.5 ${
                                routeItem.isVisited ? 'bg-brand-selected' : 'bg-brand-border'
                              }`}>
                              <Text
                                className={`text-[10px] font-semibold ${
                                  routeItem.isVisited
                                    ? 'text-brand-primary'
                                    : 'text-brand-muted'
                                }`}>
                                {routeItem.isVisited
                                  ? copy.visitedBadge
                                  : copy.notVisitedBadge}
                              </Text>
                            </View>
                          </View>
                          {review ? (
                            <PlaceReviewBlock review={review} copy={copy} />
                          ) : (
                            <Text className="mt-2 text-xs text-brand-muted">
                              {copy.noReviewForPlace}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </>
        ) : (
          <>
            <Text className="mb-3 mt-6 text-base font-bold text-brand-text">
              {copy.placeReviewsSection}
            </Text>
            {travelogue.placeReviews.length === 0 ? (
              <Text className="text-sm text-brand-muted">{copy.noReviewsYet}</Text>
            ) : (
              travelogue.placeReviews.map(review => (
                <View
                  key={review.reviewId}
                  className="mb-3 rounded-2xl border border-brand-border bg-brand-surface p-4">
                  <Text className="text-base font-bold text-brand-text">{review.placeName}</Text>
                  <PlaceReviewBlock review={review} copy={copy} />
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
