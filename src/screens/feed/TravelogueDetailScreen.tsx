import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteMapView } from '../../kakaoMap';
import { TravelogueCommentsSection } from '../../components/feed/TravelogueCommentsSection';
import { ImportPlanModal } from '../../components/feed/modals/ImportPlanModal';
import { TravelogueCommentModal } from '../../components/feed/modals/TravelogueCommentModal';
import { TravelogueImageCarousel } from '../../components/feed/TravelogueImageCarousel';
import { TravelogueSocialBar } from '../../components/feed/TravelogueSocialBar';
import { useTravelogueSocialActions } from '../../components/feed/useTravelogueSocialActions';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { StarRating } from '../../components/shared/rating/StarRating';
import { ICON_COLOR_MUTED } from '../../constants/icons';
import type { CopyFor } from '../../i18n';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { selectPlanById, useAppStore, usePlanStore, useTravelogueStore } from '../../stores';
import type { PlaceReview, Travelogue } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';
import {
  flattenItineraryRoutes,
  getReviewForRoute,
  resolveTravelogueItinerary,
  snapshotToRouteItems,
  collectTravelogueImages,
  authorInitial,
} from '../../utils/review/travelReview';
import { computeTripTotalMinutes, formatDurationMinutes } from '../../utils/geo/tripDuration';
import { formatWeekdayDate } from '../../utils/geo/geo';

type Props = NativeStackScreenProps<RootStackParamList, 'TravelogueDetail'>;
type Copy = CopyFor<'travelReview'>;

function PlaceReviewBlock({
  review,
  copy,
}: {
  review: PlaceReview;
  copy: Copy;
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
              {item.thumbnailUri ? (
                <Text className="text-lg">{item.thumbnailUri}</Text>
              ) : (
                <AppIcon name="paperclip" size={18} color={ICON_COLOR_MUTED} />
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TravelogueDetailBody({
  travelogue,
  navigation,
  language,
  copy,
  insets,
}: {
  travelogue: Travelogue;
  navigation: Props['navigation'];
  language: AppLanguage;
  copy: Copy;
  insets: { top: number; bottom: number };
}) {
  const linkedPlan = usePlanStore(selectPlanById(travelogue.planId));
  const {
    social,
    userId,
    userName,
    handleToggleHelpful,
    handleAddComment,
    handleImportPlan,
    importPlanModalProps,
  } = useTravelogueSocialActions(travelogue, copy, navigation);

  const itinerary = useMemo(
    () => resolveTravelogueItinerary(travelogue, linkedPlan),
    [travelogue, linkedPlan],
  );

  const mapRoutes = useMemo(
    () => snapshotToRouteItems(flattenItineraryRoutes(itinerary)),
    [itinerary],
  );

  const feedImages = useMemo(() => collectTravelogueImages(travelogue), [travelogue]);
  const [commentOpen, setCommentOpen] = useState(false);
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

  const totalDurationLabel = useMemo(() => {
    if (itinerary.length === 0) {
      return null;
    }
    const minutes = computeTripTotalMinutes(
      itinerary.map(day => ({
        dailyId: `day-${day.dayNumber}`,
        dayNumber: day.dayNumber,
        date: day.date,
        routes: day.routes,
      })),
    );
    return copy.totalDuration(formatDurationMinutes(minutes, language));
  }, [itinerary, copy, language]);

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
          <RouteMapView
            title={copy.mapTitle}
            subtitle={copy.mapSubtitle}
            routes={mapRoutes}
            highlightItemId={selectedRouteId}
          />
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-4 py-3">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-primary">
            <Text className="text-sm font-bold text-white">
              {authorInitial(travelogue.authorName)}
            </Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-brand-text">{travelogue.authorName}</Text>
            <Text className="text-xs text-brand-muted">{travelogue.destinationLabel}</Text>
          </View>
        </View>

        <TravelogueImageCarousel travelogue={travelogue} images={feedImages} />

        <View className="px-4 pt-3">
          <TravelogueSocialBar
            copy={copy}
            social={social}
            userId={userId}
            onToggleHelpful={handleToggleHelpful}
            onImportPlan={handleImportPlan}
          />

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
          {totalDurationLabel ? (
            <Text className="mt-1 text-xs font-semibold text-brand-primary">
              {totalDurationLabel}
            </Text>
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

          <View className="mt-6 border-t border-brand-border pt-4">
            <Text className="mb-3 text-base font-bold text-brand-text">{copy.feedCommentsTitle}</Text>
            <TravelogueCommentsSection
              copy={copy}
              comments={social.comments}
              currentUserName={userName}
              language={language}
              onOpenComposer={() => setCommentOpen(true)}
            />
          </View>
        </View>
      </ScrollView>

      <TravelogueCommentModal
        visible={commentOpen}
        copy={copy}
        userName={userName}
        subtitle={travelogue.title}
        onClose={() => setCommentOpen(false)}
        onSubmit={handleAddComment}
      />
      <ImportPlanModal {...importPlanModalProps} />
    </View>
  );
}

export function TravelogueDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('travelReview');
  const travelogue = useTravelogueStore(s =>
    s.publishedTravelogues.find(t => t.travelogueId === route.params.travelogueId),
  );

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

  return (
    <TravelogueDetailBody
      travelogue={travelogue}
      navigation={navigation}
      language={language}
      copy={copy}
      insets={insets}
    />
  );
}

