import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScheduleMapView } from '../../kakaoMap';
import { TravelogueCommentsSection } from '../../components/feed/TravelogueCommentsSection';
import { ImportPlanModal } from '../../components/feed/modals/ImportPlanModal';
import { TravelogueCommentModal } from '../../components/feed/modals/TravelogueCommentModal';
import { TravelogueImageCarousel } from '../../components/feed/TravelogueImageCarousel';
import { TravelogueSocialBar } from '../../components/feed/TravelogueSocialBar';
import { useTravelogueSocialActions } from '../../components/feed/useTravelogueSocialActions';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { StarRating } from '../../components/shared/rating/StarRating';
import { EVENT_ZONE_BY_ID } from '../../constants/eventZone/eventZone';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../constants/icons';
import { getScheduleDayColor } from '../../constants/plan/scheduleDayColors';
import type { CopyFor } from '../../i18n';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { loadTravelRecordDetail } from '../../services/travel/loadTravelRecordDetail';
import { useAuthStore, usePlanStore, useTravelRecordStore } from '../../stores';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import type { PlaceReview, TravelRecord, TravelRecordPlace } from '../../types/travelReview';
import type { DailyItinerary, RouteItem } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';
import { resolveEventZoneForRoute } from '../../utils/eventZone/zoneResolver';
import {
  averageRating,
  authorInitial,
  collectTravelRecordImages,
  getReviewForTravelRecordPlace,
  resolveTravelRecordDays,
  snapshotToRouteItems,
  travelRecordDestinationLabel,
} from '../../utils/review/travelReview';
import { computeTripTotalMinutes, formatDurationMinutes } from '../../utils/geo/tripDuration';
import { formatWeekdayDate } from '../../utils/geo/geo';

type Props = NativeStackScreenProps<RootStackParamList, 'TravelRecordDetail'>;
type Copy = CopyFor<'travelReview'>;

const TRAVELOGUE_MAP_HEIGHT = 200;

function sortTravelRecordPlaces(places: TravelRecordPlace[]): TravelRecordPlace[] {
  return [...places].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
}

function zoneBaseColorForRoute(route: RouteItem): string {
  return EVENT_ZONE_BY_ID[resolveEventZoneForRoute(route)].baseColor;
}

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
      {review.content ? (
        <Text className="mt-2 text-sm leading-5 text-brand-text">{review.content}</Text>
      ) : null}
      {(review.media ?? []).length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {(review.media ?? []).map(item => (
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

function TravelRecordDetailBody({
  travelRecord,
  navigation,
  language,
  copy,
  insets,
}: {
  travelRecord: TravelRecord;
  navigation: Props['navigation'];
  language: AppLanguage;
  copy: Copy;
  insets: { top: number; bottom: number };
}) {
  const linkedPlan = usePlanStore(s => {
    const id = travelRecord.travelId;
    if (!id) {
      return null;
    }
    return s.plans.find(p => p.planId === id || p.apiTravelId === id) ?? null;
  });
  const {
    social,
    userId,
    userName,
    handleToggleLike,
    handleAddComment,
    handleImportPlan,
    importModalProps,
  } = useTravelogueSocialActions(travelRecord, copy, navigation);

  const days = useMemo(() => {
    const resolved = resolveTravelRecordDays(travelRecord, linkedPlan);
    return resolved.map(day => ({
      ...day,
      places: sortTravelRecordPlaces(day.places),
    }));
  }, [travelRecord, linkedPlan]);

  const scheduleItinerary = useMemo((): DailyItinerary[] => {
    return days.map(day => ({
      dailyId: day.travelRecordDayId,
      dayNumber: day.dayNumber,
      date: day.visitDate,
      routes: snapshotToRouteItems(day.places),
    }));
  }, [days]);

  const mapRoutes = useMemo(
    () => scheduleItinerary.flatMap(day => day.routes),
    [scheduleItinerary],
  );

  const routesByPlaceId = useMemo(
    () => new Map(mapRoutes.map(route => [route.itemId, route] as const)),
    [mapRoutes],
  );

  const feedImages = useMemo(() => collectTravelRecordImages(travelRecord), [travelRecord]);
  const rating = averageRating(travelRecord.placeReviews);
  const destinationLabel = travelRecordDestinationLabel(travelRecord);
  const [commentOpen, setCommentOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const selectedDayNumber = useMemo(() => {
    if (!selectedRouteId) {
      return undefined;
    }
    const day = scheduleItinerary.find(item =>
      item.routes.some(route => route.itemId === selectedRouteId),
    );
    return day?.dayNumber;
  }, [scheduleItinerary, selectedRouteId]);

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
    if (scheduleItinerary.length === 0) {
      return null;
    }
    const minutes = computeTripTotalMinutes(scheduleItinerary);
    return copy.totalDuration(formatDurationMinutes(minutes, language));
  }, [scheduleItinerary, copy, language]);

  const publishedDate = travelRecord.publishedAt
    ? new Date(travelRecord.publishedAt).toLocaleDateString()
    : '';
  const tripPeriod =
    travelRecord.travelStartDate && travelRecord.travelEndDate
      ? copy.tripPeriod(travelRecord.travelStartDate, travelRecord.travelEndDate)
      : null;

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

      {scheduleItinerary.some(day => day.routes.length > 0) ? (
        <View
          className="shrink-0 border-b border-brand-border bg-brand-surface"
          style={{ height: TRAVELOGUE_MAP_HEIGHT, overflow: 'hidden' }}>
          <ScheduleMapView
            itinerary={scheduleItinerary}
            selectedDayNumber={selectedDayNumber}
            highlightItemId={selectedRouteId}
            mapTitle={copy.mapTitle}
            mapSubtitle={copy.mapSubtitle}
            showFooter={false}
          />
        </View>
      ) : null}

      <ScrollView
        className="flex-1 bg-brand-background"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-primary">
            <Text className="text-sm font-bold text-white">
              {authorInitial(travelRecord.authorNickname)}
            </Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-brand-text">
              {travelRecord.authorNickname}
            </Text>
            <Text className="text-xs text-brand-muted">{destinationLabel}</Text>
          </View>
        </View>

        <TravelogueImageCarousel travelRecord={travelRecord} images={feedImages} />

        <View className="px-4 pt-3">
          <TravelogueSocialBar
            copy={copy}
            social={social}
            userId={userId}
            onToggleLike={handleToggleLike}
            onImportPlan={handleImportPlan}
          />

          <Text className="text-[10px] font-bold tracking-wide text-brand-primary">
            TRAVELOGUE
          </Text>
          <Text className="mt-1 text-2xl font-bold text-brand-text">
            {travelRecord.title ?? ''}
          </Text>
          <Text className="mt-2 text-sm text-brand-muted">
            {copy.detailBy(travelRecord.authorNickname)} · {destinationLabel}
            {publishedDate ? ` · ${publishedDate}` : ''}
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
              <StarRating value={rating} readonly />
              <Text className="text-sm font-bold text-brand-primary">
                {copy.stars(rating)}
              </Text>
            </View>
            {travelRecord.content ? (
              <>
                <Text className="mb-2 mt-4 text-xs font-bold text-brand-muted">
                  {copy.overallSummary}
                </Text>
                <Text className="text-sm leading-6 text-brand-text">{travelRecord.content}</Text>
              </>
            ) : null}
          </View>

          {days.length > 0 ? (
            <>
              <Text className="mb-3 mt-6 text-base font-bold text-brand-text">
                {copy.itinerarySection}
              </Text>
              {days.map(day => {
                const dayColor = getScheduleDayColor(day.dayNumber);
                return (
                  <View key={`day-${day.dayNumber}`} className="mb-4">
                    <Text
                      className="mb-2 text-sm font-bold"
                      style={{ color: dayColor.main }}>
                      {copy.dayLabel(day.dayNumber)} ·{' '}
                      {formatWeekdayDate(day.visitDate, language)}
                    </Text>
                    {day.places.map((place, index) => {
                      const order = index + 1;
                      const review = getReviewForTravelRecordPlace(
                        travelRecord.placeReviews,
                        place,
                      );
                      const selected = selectedRouteId === place.travelRecordPlaceId;
                      const route = routesByPlaceId.get(place.travelRecordPlaceId);
                      const zoneColor = route
                        ? zoneBaseColorForRoute(route)
                        : dayColor.main;

                      return (
                        <Pressable
                          key={place.travelRecordPlaceId}
                          onPress={() => setSelectedRouteId(place.travelRecordPlaceId)}
                          className="mb-2 rounded-2xl border bg-brand-surface p-4 active:opacity-90"
                          style={
                            selected
                              ? {
                                  borderColor: dayColor.main,
                                  borderWidth: 2,
                                  backgroundColor: dayColor.light,
                                }
                              : {
                                  borderColor: '#E2E8F0',
                                  borderLeftWidth: 4,
                                  borderLeftColor: zoneColor,
                                }
                          }>
                          <View className="flex-row items-start">
                            <View
                              className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                              style={{ backgroundColor: dayColor.main }}>
                              <Text className="text-sm font-bold text-white">{order}</Text>
                            </View>
                            <View className="min-w-0 flex-1">
                              <Text className="text-base font-bold text-brand-text">
                                {place.placeName}
                              </Text>
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
                );
              })}
            </>
          ) : (
            <>
              <Text className="mb-3 mt-6 text-base font-bold text-brand-text">
                {copy.placeReviewsSection}
              </Text>
              {travelRecord.placeReviews.length === 0 ? (
                <Text className="text-sm text-brand-muted">{copy.noReviewsYet}</Text>
              ) : (
                travelRecord.placeReviews.map(review => (
                  <View
                    key={review.placeReviewId}
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
        subtitle={travelRecord.title ?? undefined}
        onClose={() => setCommentOpen(false)}
        onSubmit={handleAddComment}
      />
      <ImportPlanModal {...importModalProps} />
    </View>
  );
}

export function TravelogueDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('travelReview');
  const accessToken = useAuthStore(selectReusableAccessToken);
  const travelRecordId = route.params.travelRecordId;
  const travelRecord = useTravelRecordStore(s =>
    s.publishedTravelRecords.find(t => t.travelRecordId === travelRecordId),
  );
  const [loading, setLoading] = useState(!travelRecord);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setLoading(true);
    void loadTravelRecordDetail({
      travelRecordId,
      accessToken,
      seed: travelRecord ?? null,
    })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
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
    // seed만 최초 진입 시 사용 — travelRecord 변경으로 루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelRecordId, accessToken]);

  if (loading && !travelRecord) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator color={ICON_COLOR_PRIMARY} />
      </View>
    );
  }

  if (!travelRecord) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6">
        <Text className="text-brand-muted">
          {loadError
            ? language === 'ko'
              ? '여행기를 불러오지 못했어요'
              : 'Could not load travelogue'
            : language === 'ko'
              ? '여행기를 찾을 수 없어요'
              : 'Travelogue not found'}
        </Text>
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <TravelRecordDetailBody
      travelRecord={travelRecord}
      navigation={navigation}
      language={language}
      copy={copy}
      insets={insets}
    />
  );
}
