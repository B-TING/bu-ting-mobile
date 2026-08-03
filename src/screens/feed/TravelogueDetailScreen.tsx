import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScheduleMapView } from '../../kakaoMap';
import { TravelogueCommentsSection } from '../../components/feed/TravelogueCommentsSection';
import { ImportPlanModal } from '../../components/feed/modals/ImportPlanModal';
import { TravelogueCommentModal } from '../../components/feed/modals/TravelogueCommentModal';
import { TravelogueImageCarousel } from '../../components/feed/TravelogueImageCarousel';
import { TravelogueSocialBar } from '../../components/feed/TravelogueSocialBar';
import {
  TravelogueSocialError,
  useTravelogueSocialActions,
} from '../../components/feed/useTravelogueSocialActions';
import { PlaceReviewFormModal } from '../../components/review/modals/PlaceReviewFormModal';
import { TravelogueComposeModal } from '../../components/review/modals/TravelogueComposeModal';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { ResolvedRemoteImage } from '../../components/shared/media/ResolvedRemoteImage';
import { ReviewVideoThumb } from '../../components/shared/media/ReviewVideoViews';
import { useAppAlert } from '../../components/shared/modals';
import { StarRating } from '../../components/shared/rating/StarRating';
import { EVENT_ZONE_BY_ID } from '../../constants/eventZone/eventZone';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../constants/icons';
import { getScheduleDayColor } from '../../constants/plan/scheduleDayColors';
import type { CopyFor } from '../../i18n';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { deletePlaceReviewForTravel } from '../../services/travel/deletePlaceReviewForTravel';
import { loadTravelRecordDetail } from '../../services/travel/loadTravelRecordDetail';
import {
  PlaceReviewSyncError,
  savePlaceReviewForTravel,
} from '../../services/travel/savePlaceReviewForTravel';
import { updateTravelRecordForTravel } from '../../services/travel/updateTravelRecordForTravel';
import { useAuthStore, usePlanStore } from '../../stores';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import type {
  PlaceReview,
  TravelRecord,
  TravelRecordComment,
  TravelRecordPlace,
} from '../../types/travelReview';
import type { DailyItinerary, RouteItem, TravelPlan } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';
import { resolveEventZoneForRoute } from '../../utils/eventZone/zoneResolver';
import {
  authorInitial,
  collectTravelRecordMedia,
  getReviewForTravelRecordPlace,
  snapshotToRouteItems,
  travelRecordDestinationLabel,
  travelRecordOverallRating,
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

/**
 * 방문 여부는 여행기 API의 `visited`만 사용 (로컬 일정 스냅샷 병합 금지).
 */
function isTravelRecordPlaceVisited(place: TravelRecordPlace): boolean {
  return place.visited === true;
}

function buildApiPlanShell(travelRecord: TravelRecord): TravelPlan | null {
  const travelId = travelRecord.travelId;
  if (!travelId) {
    return null;
  }
  const start =
    travelRecord.travelStartDate ?? new Date().toISOString().slice(0, 10);
  const end = travelRecord.travelEndDate ?? start;
  return {
    planId: travelId,
    apiTravelId: travelId,
    title: travelRecord.title ?? '',
    startDate: start,
    endDate: end,
    status: 'COMPLETED',
    travelStatus: 'COMPLETED',
    constraints: {},
    members: [],
    itinerary: [],
    createdAt: travelRecord.publishedAt ?? new Date().toISOString(),
    source: 'api',
  };
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
          {(review.media ?? []).map(item => {
            const isRemoteImage =
              item.type === 'image' &&
              (item.uri.startsWith('http://') || item.uri.startsWith('https://'));
            if (item.type === 'video') {
              return (
                <ReviewVideoThumb
                  key={item.mediaId}
                  uri={item.uri}
                  fileKey={item.fileKey}
                  size={56}
                />
              );
            }
            return (
              <View
                key={item.mediaId}
                className="relative h-14 w-14 overflow-hidden rounded-xl bg-brand-selected">
                {isRemoteImage ? (
                  <ResolvedRemoteImage
                    uri={item.uri}
                    fileKey={item.fileKey}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <AppIcon name="paperclip" size={18} color={ICON_COLOR_MUTED} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function TravelRecordDetailBody({
  travelRecord,
  isOwner,
  onTravelRecordChange,
  onReloadTravelRecord,
  navigation,
  language,
  copy,
  insets,
}: {
  travelRecord: TravelRecord;
  isOwner: boolean;
  onTravelRecordChange: (next: TravelRecord) => void;
  /** 후기/여행기 수정 후 서버 상태로 다시 맞춤 */
  onReloadTravelRecord: () => Promise<void>;
  navigation: Props['navigation'];
  language: AppLanguage;
  copy: Copy;
  insets: { top: number; bottom: number };
}) {
  const { alert } = useAppAlert();
  const accessToken = useAuthStore(selectReusableAccessToken);
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
    commenting,
    handleToggleLike,
    handleToggleBookmark,
    bookmarkedByMe,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleImportPlan,
    importModalProps,
  } = useTravelogueSocialActions(travelRecord, copy, navigation, {
    onTravelRecordPatch: patch => {
      onTravelRecordChange({ ...travelRecord, ...patch });
    },
  });

  const [commentOpen, setCommentOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<TravelRecordComment | null>(
    null,
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reviewRoute, setReviewRoute] = useState<RouteItem | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reloadAfterEdit = async () => {
    try {
      await onReloadTravelRecord();
    } catch {
      // 저장은 성공했을 수 있음 — 새로고침 실패만 조용히 무시
    }
  };

  const onPullRefresh = () => {
    setRefreshing(true);
    void onReloadTravelRecord()
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  };

  const onToggleBookmark = () => {
    void handleToggleBookmark().catch(error => {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : copy.socialBookmarkFailed,
      });
    });
  };

  const onToggleLike = () => {
    void handleToggleLike().catch(error => {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : copy.socialLikeFailed,
      });
    });
  };

  const onSubmitComment = async (text: string) => {
    try {
      if (editingComment) {
        await handleUpdateComment(editingComment.commentId, text);
      } else {
        await handleAddComment(text);
      }
    } catch (error) {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : editingComment
              ? copy.socialCommentUpdateFailed
              : copy.socialCommentFailed,
      });
      throw error;
    }
  };

  const onDeleteComment = (comment: TravelRecordComment) => {
    alert({
      title: copy.feedDeleteCommentConfirmTitle,
      message: copy.feedDeleteCommentConfirmMessage,
      buttons: [
        { label: copy.cancel, variant: 'secondary', onPress: () => undefined },
        {
          label: copy.feedDeleteComment,
          variant: 'danger',
          onPress: () => {
            void handleDeleteComment(comment.commentId).catch(error => {
              alert({
                title:
                  error instanceof TravelogueSocialError
                    ? error.message
                    : copy.socialCommentDeleteFailed,
              });
            });
          },
        },
      ],
    });
  };

  const editPlan = useMemo(
    () =>
      linkedPlan?.source === 'api'
        ? linkedPlan
        : buildApiPlanShell(travelRecord),
    [linkedPlan, travelRecord],
  );

  /** 일정은 여행기 API days만 사용 (로컬 plan 스냅샷 폴백 금지) */
  const days = useMemo(() => {
    return (travelRecord.days ?? []).map(day => ({
      ...day,
      places: sortTravelRecordPlaces(day.places),
    }));
  }, [travelRecord]);

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

  const feedImages = useMemo(() => collectTravelRecordMedia(travelRecord), [travelRecord]);
  const rating = travelRecordOverallRating(travelRecord);
  const destinationLabel = travelRecordDestinationLabel(travelRecord);

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

  const existingReviewForModal = reviewRoute
    ? getReviewForTravelRecordPlace(travelRecord.placeReviews, {
        travelRecordPlaceId: reviewRoute.itemId,
        planPlaceId: reviewRoute.apiPlanPlaceId,
      })
    : undefined;

  const openPlaceReviewEditor = (place: TravelRecordPlace) => {
    const route =
      routesByPlaceId.get(place.travelRecordPlaceId) ??
      snapshotToRouteItems([place])[0];
    if (!route?.apiPlanPlaceId && place.planPlaceId) {
      setReviewRoute({ ...route, apiPlanPlaceId: place.planPlaceId });
      return;
    }
    setReviewRoute(route);
  };

  const handleSaveTravelogue = async (payload: {
    title: string;
    content: string;
    overallRating: number;
    status: 'PUBLISHED' | 'HIDDEN';
  }) => {
    if (!accessToken?.trim() || !travelRecord.travelId) {
      alert({
        title:
          language === 'ko' ? '로그인이 필요합니다.' : 'Please sign in to edit.',
      });
      throw new Error('login required');
    }
    setPublishing(true);
    try {
      const updated = await updateTravelRecordForTravel({
        accessToken,
        travelRecordId: travelRecord.travelRecordId,
        travelId: travelRecord.travelId,
        authorNickname: travelRecord.authorNickname || userName,
        title: payload.title,
        content: payload.content,
        status: payload.status,
        currentStatus: travelRecord.status,
        coverImageUrl: travelRecord.coverImageUrl,
        overallRating: payload.overallRating,
      });
      onTravelRecordChange({
        ...updated,
        placeReviews: travelRecord.placeReviews,
        days: updated.days.length > 0 ? updated.days : travelRecord.days,
      });
      await reloadAfterEdit();
    } catch (error) {
      alert({
        title:
          error instanceof Error
            ? error.message
            : language === 'ko'
              ? '여행기 수정에 실패했습니다.'
              : 'Failed to update travelogue.',
      });
      throw error;
    } finally {
      setPublishing(false);
    }
  };

  const handleSavePlaceReview = async (
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
    },
  ) => {
    if (!editPlan || !reviewRoute) {
      return;
    }
    setSavingReview(true);
    try {
      const saved = await savePlaceReviewForTravel({
        accessToken,
        plan: editPlan,
        route: reviewRoute,
        authorNickname: travelRecord.authorNickname || userName,
        payload: {
          placeReviewId: payload.placeReviewId,
          rating: payload.rating,
          content: payload.content,
          tags: payload.tags,
          media: payload.media,
        },
      });
      const nextReviews = [
        ...travelRecord.placeReviews.filter(
          r =>
            r.placeReviewId !== saved.placeReviewId &&
            !(
              saved.planPlaceId &&
              r.planPlaceId &&
              r.planPlaceId === saved.planPlaceId
            ),
        ),
        saved,
      ];
      onTravelRecordChange({ ...travelRecord, placeReviews: nextReviews });
      await reloadAfterEdit();
    } catch (error) {
      alert({
        title:
          error instanceof PlaceReviewSyncError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Failed to save review.',
      });
      throw error;
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeletePlaceReview = () =>
    new Promise<void>((resolve, reject) => {
      if (!editPlan || !reviewRoute) {
        reject(new Error('no route'));
        return;
      }
      alert({
        title: copy.deleteReviewConfirmTitle,
        message: copy.deleteReviewConfirmMessage,
        buttons: [
          {
            label: copy.cancel,
            variant: 'secondary',
            onPress: () => reject(new Error('cancelled')),
          },
          {
            label: copy.deleteReviewConfirm,
            variant: 'danger',
            onPress: () => {
              void (async () => {
                setSavingReview(true);
                try {
                  await deletePlaceReviewForTravel({
                    accessToken,
                    plan: editPlan,
                    route: reviewRoute,
                    placeReviewId: existingReviewForModal?.placeReviewId,
                  });
                  if (existingReviewForModal) {
                    onTravelRecordChange({
                      ...travelRecord,
                      placeReviews: travelRecord.placeReviews.filter(
                        r =>
                          r.placeReviewId !==
                          existingReviewForModal.placeReviewId,
                      ),
                    });
                  }
                  await reloadAfterEdit();
                  resolve();
                } catch (error) {
                  alert({
                    title:
                      error instanceof PlaceReviewSyncError
                        ? error.message
                        : error instanceof Error
                          ? error.message
                          : 'Failed to delete review.',
                  });
                  reject(error);
                } finally {
                  setSavingReview(false);
                }
              })();
            },
          },
        ],
      });
    });

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
        {isOwner ? (
          <Pressable
            onPress={() => setComposeOpen(true)}
            accessibilityLabel={copy.editTravelogue}
            hitSlop={8}
            className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-brand-selected active:opacity-80">
            <AppIcon name="pencil" size={18} color={ICON_COLOR_PRIMARY} strokeWidth={2.2} />
          </Pressable>
        ) : null}
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={ICON_COLOR_PRIMARY}
            colors={[ICON_COLOR_PRIMARY]}
          />
        }>
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
            onToggleLike={onToggleLike}
            onImportPlan={handleImportPlan}
          />

          <Text className="text-[10px] font-bold tracking-wide text-brand-primary">
            TRAVELOGUE
          </Text>
          <View className="mt-1 flex-row items-start justify-between gap-2">
            <Text className="min-w-0 flex-1 text-2xl font-bold text-brand-text">
              {travelRecord.title ?? ''}
            </Text>
            <View className="shrink-0 flex-row items-center gap-1">
              {isOwner ? (
                <Pressable
                  onPress={() => setComposeOpen(true)}
                  accessibilityLabel={copy.editTravelogue}
                  hitSlop={8}
                  className="h-9 w-9 items-center justify-center rounded-full bg-brand-selected active:opacity-80">
                  <AppIcon
                    name="pencil"
                    size={18}
                    color={ICON_COLOR_PRIMARY}
                    strokeWidth={2.2}
                  />
                </Pressable>
              ) : null}
              <Pressable
                onPress={onToggleBookmark}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={bookmarkedByMe ? copy.unbookmark : copy.bookmark}
                accessibilityState={{ selected: bookmarkedByMe }}
                className="h-9 w-9 items-center justify-center rounded-full active:opacity-80">
                <AppIcon
                  name="bookmark"
                  size={20}
                  color={bookmarkedByMe ? ICON_COLOR_PRIMARY : ICON_COLOR_MUTED}
                  filled={bookmarkedByMe}
                />
              </Pressable>
            </View>
          </View>
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

          {rating > 0 ? (
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
          ) : travelRecord.content ? (
            <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallSummary}</Text>
              <Text className="text-sm leading-6 text-brand-text">{travelRecord.content}</Text>
            </View>
          ) : null}

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
                              <View className="flex-row items-start gap-2">
                                <Text className="min-w-0 flex-1 text-base font-bold text-brand-text">
                                  {place.placeName}
                                </Text>
                                {isOwner && isTravelRecordPlaceVisited(place) ? (
                                  <Pressable
                                    onPress={event => {
                                      event.stopPropagation?.();
                                      openPlaceReviewEditor(place);
                                    }}
                                    accessibilityLabel={
                                      review ? copy.editReview : copy.writeReview
                                    }
                                    hitSlop={8}
                                    className={`h-8 w-8 items-center justify-center rounded-full active:opacity-80 ${
                                      review ? 'bg-brand-selected' : 'bg-brand-primary/10'
                                    }`}>
                                    <AppIcon
                                      name={review ? 'pencil' : 'plus'}
                                      size={15}
                                      color={
                                        review ? ICON_COLOR_MUTED : ICON_COLOR_PRIMARY
                                      }
                                      strokeWidth={2.2}
                                    />
                                  </Pressable>
                                ) : null}
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
                    <View className="flex-row items-start gap-2">
                      <Text className="min-w-0 flex-1 text-base font-bold text-brand-text">
                        {review.placeName}
                      </Text>
                      {isOwner ? (
                        <Pressable
                          onPress={() => {
                            const place =
                              days
                                .flatMap(d => d.places)
                                .find(
                                  p =>
                                    p.travelRecordPlaceId ===
                                      review.travelRecordPlaceId ||
                                    p.planPlaceId === review.planPlaceId,
                                ) ?? null;
                            if (place) {
                              openPlaceReviewEditor(place);
                            }
                          }}
                          accessibilityLabel={copy.editReview}
                          hitSlop={8}
                          className="h-8 w-8 items-center justify-center rounded-full bg-brand-selected active:opacity-80">
                          <AppIcon
                            name="pencil"
                            size={15}
                            color={ICON_COLOR_MUTED}
                            strokeWidth={2.2}
                          />
                        </Pressable>
                      ) : null}
                    </View>
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
              currentUserId={userId}
              currentUserName={userName}
              language={language}
              onOpenComposer={() => {
                setEditingComment(null);
                setCommentOpen(true);
              }}
              onEditComment={comment => {
                setEditingComment(comment);
                setCommentOpen(true);
              }}
              onDeleteComment={onDeleteComment}
            />
          </View>
        </View>
      </ScrollView>

      <TravelogueCommentModal
        visible={commentOpen}
        copy={copy}
        userName={userName}
        subtitle={travelRecord.title ?? undefined}
        mode={editingComment ? 'edit' : 'create'}
        initialContent={editingComment?.content ?? ''}
        submitting={commenting}
        onClose={() => {
          setCommentOpen(false);
          setEditingComment(null);
        }}
        onSubmit={onSubmitComment}
      />
      <ImportPlanModal {...importModalProps} />

      {isOwner ? (
        <>
          <TravelogueComposeModal
            visible={composeOpen}
            copy={copy}
            language={language}
            authorNickname={travelRecord.authorNickname || userName}
            destinationLabel={destinationLabel}
            placeReviews={travelRecord.placeReviews}
            mode="edit"
            initialTitle={travelRecord.title}
            initialContent={travelRecord.content}
            initialStatus={
              travelRecord.status === 'HIDDEN' ? 'HIDDEN' : 'PUBLISHED'
            }
            initialOverallRating={travelRecord.overallRating}
            publishing={publishing}
            onClose={() => {
              if (!publishing) {
                setComposeOpen(false);
              }
            }}
            onPublish={handleSaveTravelogue}
          />
          <PlaceReviewFormModal
            visible={!!reviewRoute}
            route={reviewRoute}
            existing={existingReviewForModal}
            copy={copy}
            language={language}
            saving={savingReview}
            onClose={() => {
              if (!savingReview) {
                setReviewRoute(null);
              }
            }}
            onSave={handleSavePlaceReview}
            onDelete={existingReviewForModal ? handleDeletePlaceReview : undefined}
          />
        </>
      ) : null}
    </View>
  );
}

export function TravelogueDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('travelReview');
  const accessToken = useAuthStore(selectReusableAccessToken);
  const authUserId = useAuthStore(s => s.user?.userId ?? null);
  const travelRecordId = route.params.travelRecordId;
  const [travelRecord, setTravelRecord] = useState<TravelRecord | null>(null);
  const [loadedAsOwner, setLoadedAsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reloadTravelRecord = useCallback(async () => {
    const { record, loadedAsOwner: asOwner } = await loadTravelRecordDetail({
      travelRecordId,
      accessToken,
    });
    setTravelRecord(record);
    setLoadedAsOwner(asOwner);
    setLoadError(false);
  }, [travelRecordId, accessToken]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setLoading(true);
    setTravelRecord(null);
    setLoadedAsOwner(false);
    void loadTravelRecordDetail({
      travelRecordId,
      accessToken,
    })
      .then(({ record, loadedAsOwner: asOwner }) => {
        if (!cancelled) {
          setTravelRecord(record);
          setLoadedAsOwner(asOwner);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setTravelRecord(null);
          setLoadedAsOwner(false);
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
  }, [travelRecordId, accessToken]);

  const isOwner = useMemo(() => {
    if (loadedAsOwner) {
      return true;
    }
    if (!authUserId || !travelRecord?.authorId) {
      return false;
    }
    return (
      String(authUserId).toLowerCase() ===
      String(travelRecord.authorId).toLowerCase()
    );
  }, [loadedAsOwner, authUserId, travelRecord?.authorId]);

  if (loading) {
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
      isOwner={isOwner}
      onTravelRecordChange={setTravelRecord}
      onReloadTravelRecord={reloadTravelRecord}
      navigation={navigation}
      language={language}
      copy={copy}
      insets={insets}
    />
  );
}
