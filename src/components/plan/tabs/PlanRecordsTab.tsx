import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlaceReviewCard } from '../../review/cards/PlaceReviewCard';
import { PlaceReviewFormModal } from '../../review/modals/PlaceReviewFormModal';
import { TravelogueComposeModal } from '../../review/modals/TravelogueComposeModal';
import { useAppAlert } from '../../shared/modals';
import { useCopy } from '../../../i18n';
import {
  publishTravelRecordForTravel,
  PublishTravelRecordError,
} from '../../../services/travel/publishTravelRecordForTravel';
import { savePlaceReviewForTravel } from '../../../services/travel/savePlaceReviewForTravel';
import {
  fetchMyTravelRecords,
  TravelRecordServiceError,
} from '../../../services/travel/travelRecordService';
import { mapTravelRecordManageItem } from '../../../types/travelRecordApi';
import { EMPTY_REVIEWS, useTravelRecordStore } from '../../../stores/useTravelRecordStore';
import { useAuthStore } from '../../../stores';
import { selectReusableAccessToken } from '../../../stores/useAuthStore';
import type { AppLanguage } from '../../../types/user';
import type { RouteItem, TravelPlan } from '../../../types/travelPlan';
import type { PlaceReview, TravelRecordStatus } from '../../../types/travelReview';
import {
  collectPlanRoutes,
  getReviewForPlace,
  isTravelRecordPublic,
  reviewProgress,
} from '../../../utils/review/travelReview';
import { computeTripTotalMinutes, formatDurationMinutes } from '../../../utils/geo/tripDuration';

function placeKey(route: RouteItem): string {
  return route.apiPlanPlaceId ?? route.itemId;
}

type PlanRecordsTabProps = {
  plan: TravelPlan;
  allRoutes: RouteItem[];
  language: AppLanguage;
  authorNickname: string;
  destinationLabel: string;
  isTripActive: boolean;
  onPublished?: () => void;
  onEndTrip?: () => void;
  onViewFeed?: () => void;
  onViewTravelRecord?: (travelRecordId: string) => void;
};

export function PlanRecordsTab({
  plan,
  allRoutes,
  language,
  authorNickname,
  destinationLabel,
  isTripActive,
  onPublished,
  onEndTrip,
  onViewFeed,
  onViewTravelRecord,
}: PlanRecordsTabProps) {
  const { alert } = useAppAlert();
  const copy = useCopy('travelReview');
  const accessToken = useAuthStore(selectReusableAccessToken);
  const travelId = plan.apiTravelId ?? plan.planId;
  const reviews =
    useTravelRecordStore(s => s.reviewsByTravelId[travelId]) ?? EMPTY_REVIEWS;
  const upsertTravelRecords = useTravelRecordStore(s => s.upsertTravelRecords);
  const isPublished = useTravelRecordStore(s => s.isTravelPublished(travelId));
  const publishedTravelRecord = useTravelRecordStore(s =>
    s.publishedTravelRecords.find(
      t =>
        t.travelId === travelId &&
        (t.status === 'PUBLISHED' || t.status === 'HIDDEN'),
    ),
  );

  const [reviewRoute, setReviewRoute] = useState<RouteItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!accessToken?.trim() || plan.source !== 'api') {
      return;
    }
    let cancelled = false;
    void fetchMyTravelRecords(accessToken)
      .then(list => {
        if (cancelled) {
          return;
        }
        const mapped = list.map(item =>
          mapTravelRecordManageItem(item, authorNickname),
        );
        upsertTravelRecords(mapped);
      })
      .catch(error => {
        if (__DEV__) {
          const message =
            error instanceof TravelRecordServiceError ? error.message : String(error);
          console.warn('[PlanRecordsTab] fetchMyTravelRecords failed:', message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, authorNickname, plan.source, upsertTravelRecords]);

  const eligibleRoutes = useMemo(() => collectPlanRoutes(allRoutes), [allRoutes]);
  const progress = useMemo(
    () => reviewProgress(allRoutes, reviews),
    [allRoutes, reviews],
  );

  const totalDurationLabel = useMemo(() => {
    const minutes = computeTripTotalMinutes(plan.itinerary);
    if (minutes <= 0) {
      return null;
    }
    return copy.totalDuration(formatDurationMinutes(minutes, language));
  }, [copy, plan.itinerary, language]);

  const handleSavePlaceReview = async (
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
    },
  ) => {
    if (!reviewRoute) {
      return;
    }
    setSavingReview(true);
    try {
      await savePlaceReviewForTravel({
        accessToken,
        plan,
        route: reviewRoute,
        authorNickname,
        payload: {
          placeReviewId: payload.placeReviewId,
          rating: payload.rating,
          content: payload.content,
          tags: payload.tags,
          media: payload.media,
        },
      });
    } catch (error) {
      alert({
        title:
          error instanceof Error
            ? error.message
            : language === 'ko'
              ? '후기 저장에 실패했습니다.'
              : 'Failed to save review.',
      });
      throw error;
    } finally {
      setSavingReview(false);
    }
  };

  const handlePublish = async (payload: {
    title: string;
    content: string;
    status: Extract<TravelRecordStatus, 'PUBLISHED' | 'HIDDEN'>;
  }) => {
    if (!accessToken?.trim()) {
      alert({
        title:
          language === 'ko' ? '로그인이 필요합니다.' : 'Please sign in to publish.',
      });
      throw new Error('login required');
    }

    setPublishing(true);
    try {
      const firstImage = reviews.flatMap(r => r.media ?? []).find(m => m.type === 'image');
      await publishTravelRecordForTravel({
        accessToken,
        plan,
        authorNickname,
        title: payload.title,
        content: payload.content,
        status: payload.status,
        coverImageUrl: firstImage?.uri ?? null,
      });
      setSuccessMsg(
        payload.status === 'PUBLISHED'
          ? copy.publishedSuccessPublic
          : copy.publishedSuccessPrivate,
      );
      onPublished?.();
    } catch (error) {
      alert({
        title:
          error instanceof PublishTravelRecordError
            ? error.message
            : error instanceof Error
              ? error.message
              : language === 'ko'
                ? '여행기 게시에 실패했습니다.'
                : 'Failed to publish travelogue.',
      });
      throw error;
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View className="px-4 py-4">
      <Text className="mb-1 text-lg font-bold text-brand-text">{copy.recordsTitle}</Text>
      <Text className="mb-1 text-sm text-brand-muted">{copy.recordsSub}</Text>
      {totalDurationLabel ? (
        <Text className="mb-4 text-sm font-semibold text-brand-primary">{totalDurationLabel}</Text>
      ) : (
        <View className="mb-4" />
      )}

      <View className="mb-4 rounded-2xl border border-brand-border bg-brand-surface px-4 py-3">
        <Text className="text-sm font-semibold text-brand-text">
          {copy.progress(progress.completed, progress.total)}
        </Text>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-brand-border">
          <View
            className="h-full rounded-full bg-brand-primary"
            style={{
              width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
            }}
          />
        </View>
        {progress.allDone ? (
          <Text className="mt-2 text-xs font-semibold text-brand-primary">
            {copy.allReviewsDone}
          </Text>
        ) : null}
      </View>

      {eligibleRoutes.length === 0 ? (
        <Text className="text-sm text-brand-muted">{copy.noReviewsYet}</Text>
      ) : (
        eligibleRoutes.map(route => {
          const review = getReviewForPlace(reviews, placeKey(route));
          return (
            <PlaceReviewCard
              key={route.itemId}
              placeName={route.placeName}
              isVisited={route.isVisited}
              review={review}
              writeLabel={copy.writeReview}
              editLabel={copy.editReview}
              visitFirstLabel={copy.visitFirst}
              onPress={() => setReviewRoute(route)}
            />
          );
        })
      )}

      {successMsg ? (
        <View className="mt-4 rounded-2xl bg-brand-selected px-4 py-3">
          <Text className="text-sm font-semibold text-brand-primary">{successMsg}</Text>
        </View>
      ) : null}

      {isPublished && publishedTravelRecord ? (
        <View className="mt-4 rounded-2xl border border-brand-primary/30 bg-brand-selected px-4 py-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-bold text-brand-primary">{copy.published}</Text>
            <View className="rounded-full bg-brand-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-brand-primary">
                {isTravelRecordPublic(publishedTravelRecord)
                  ? copy.publishedPublic
                  : copy.publishedPrivate}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-base font-bold text-brand-text">
            {publishedTravelRecord.title}
          </Text>
          {onViewTravelRecord ? (
            <Pressable
              onPress={() => onViewTravelRecord(publishedTravelRecord.travelRecordId)}
              className="mt-3 active:opacity-80">
              <Text className="text-sm font-bold text-brand-primary">
                {copy.viewMyTravelogue}
              </Text>
            </Pressable>
          ) : null}
          {isTravelRecordPublic(publishedTravelRecord) && onViewFeed ? (
            <Pressable onPress={onViewFeed} className="mt-2 active:opacity-80">
              <Text className="text-sm font-bold text-brand-primary">{copy.viewFeed}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={() => setComposeOpen(true)}
          className="mt-4 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
          <Text className="font-bold text-white">{copy.composeTravelogue}</Text>
        </Pressable>
      )}

      {!isPublished && progress.total > 0 && !progress.allDone ? (
        <Text className="mt-2 text-center text-xs text-brand-muted">
          {copy.composePartialHint}
        </Text>
      ) : null}

      {isTripActive && onEndTrip ? (
        <Pressable
          onPress={onEndTrip}
          className="mt-3 items-center rounded-2xl border border-brand-border bg-brand-surface py-3 active:opacity-90">
          <Text className="font-bold text-brand-text">{copy.completeTrip}</Text>
        </Pressable>
      ) : null}

      <PlaceReviewFormModal
        visible={!!reviewRoute}
        route={reviewRoute}
        existing={
          reviewRoute ? getReviewForPlace(reviews, placeKey(reviewRoute)) : undefined
        }
        copy={copy}
        language={language}
        saving={savingReview}
        onClose={() => {
          if (!savingReview) {
            setReviewRoute(null);
          }
        }}
        onSave={handleSavePlaceReview}
      />

      <TravelogueComposeModal
        visible={composeOpen}
        copy={copy}
        language={language}
        authorNickname={authorNickname}
        destinationLabel={destinationLabel}
        placeReviews={reviews}
        defaultTitle={plan.title}
        totalDurationLabel={totalDurationLabel}
        publishing={publishing}
        onClose={() => {
          if (!publishing) {
            setComposeOpen(false);
          }
        }}
        onPublish={handlePublish}
      />
    </View>
  );
}
