import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlaceReviewCard } from '../../review/cards/PlaceReviewCard';
import { PlaceReviewFormModal } from '../../review/modals/PlaceReviewFormModal';
import { TravelogueComposeModal } from '../../review/modals/TravelogueComposeModal';
import { useCopy } from '../../../i18n';
import { EMPTY_REVIEWS, useTravelRecordStore } from '../../../stores/useTravelRecordStore';
import type { AppLanguage } from '../../../types/user';
import type { RouteItem, TravelPlan } from '../../../types/travelPlan';
import type { TravelRecordStatus } from '../../../types/travelReview';
import {
  buildTravelRecordDays,
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
  const copy = useCopy('travelReview');
  const travelId = plan.apiTravelId ?? plan.planId;
  const reviews =
    useTravelRecordStore(s => s.reviewsByTravelId[travelId]) ?? EMPTY_REVIEWS;
  const upsertReview = useTravelRecordStore(s => s.upsertPlaceReview);
  const publishTravelRecord = useTravelRecordStore(s => s.publishTravelRecord);
  const isPublished = useTravelRecordStore(s => s.publishedTravelIds.includes(travelId));
  const publishedTravelRecord = useTravelRecordStore(s =>
    s.publishedTravelRecords.find(t => t.originalTravelId === travelId),
  );

  const [reviewRoute, setReviewRoute] = useState<RouteItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const handlePublish = (payload: {
    title: string;
    content: string;
    status: Extract<TravelRecordStatus, 'PUBLISHED' | 'HIDDEN'>;
  }) => {
    const firstImage = reviews.flatMap(r => r.media ?? []).find(m => m.type === 'image');
    publishTravelRecord({
      originalTravelId: travelId,
      authorId: plan.members[0]?.userId ?? 'local-user',
      authorNickname,
      title: payload.title,
      content: payload.content || null,
      coverImageUrl: firstImage?.uri ?? null,
      travelStartDate: plan.startDate,
      travelEndDate: plan.endDate,
      status: payload.status,
      days: buildTravelRecordDays(plan),
      placeReviews: reviews,
    });
    setSuccessMsg(
      payload.status === 'PUBLISHED'
        ? copy.publishedSuccessPublic
        : copy.publishedSuccessPrivate,
    );
    onPublished?.();
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
        onClose={() => setReviewRoute(null)}
        onSave={payload => upsertReview(travelId, payload)}
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
        onClose={() => setComposeOpen(false)}
        onPublish={handlePublish}
      />
    </View>
  );
}
