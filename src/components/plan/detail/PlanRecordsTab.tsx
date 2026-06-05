import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlaceReviewCard } from '../../review/PlaceReviewCard';
import { PlaceReviewFormModal } from '../../review/PlaceReviewFormModal';
import { TravelogueComposeModal } from '../../review/TravelogueComposeModal';
import { TRAVEL_REVIEW_COPY } from '../../../constants/travelReview';
import { EMPTY_REVIEWS, useTravelogueStore } from '../../../stores/useTravelogueStore';
import type { AppLanguage } from '../../../types/user';
import type { RouteItem, TravelPlan } from '../../../types/travelPlan';
import {
  buildItinerarySnapshot,
  collectPlanRoutes,
  getReviewForRoute,
  isTraveloguePublic,
  reviewProgress,
} from '../../../utils/travelReview';

type PlanRecordsTabProps = {
  plan: TravelPlan;
  allRoutes: RouteItem[];
  language: AppLanguage;
  authorName: string;
  destinationLabel: string;
  isTripActive: boolean;
  onPublished?: () => void;
  onEndTrip?: () => void;
  onViewFeed?: () => void;
  onViewTravelogue?: (travelogueId: string) => void;
};

export function PlanRecordsTab({
  plan,
  allRoutes,
  language,
  authorName,
  destinationLabel,
  isTripActive,
  onPublished,
  onEndTrip,
  onViewFeed,
  onViewTravelogue,
}: PlanRecordsTabProps) {
  const copy = TRAVEL_REVIEW_COPY[language];
  const reviews =
    useTravelogueStore(s => s.reviewsByPlan[plan.planId]) ?? EMPTY_REVIEWS;
  const upsertReview = useTravelogueStore(s => s.upsertPlaceReview);
  const publishTravelogue = useTravelogueStore(s => s.publishTravelogue);
  const isPublished = useTravelogueStore(s => s.publishedPlanIds.includes(plan.planId));
  const publishedTravelogue = useTravelogueStore(s =>
    s.publishedTravelogues.find(t => t.planId === plan.planId),
  );

  const [reviewRoute, setReviewRoute] = useState<RouteItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const eligibleRoutes = useMemo(() => collectPlanRoutes(allRoutes), [allRoutes]);
  const progress = useMemo(
    () => reviewProgress(allRoutes, reviews),
    [allRoutes, reviews],
  );

  const handlePublish = (payload: {
    title: string;
    overallReview: string;
    overallRating: number;
    isPublic: boolean;
  }) => {
    publishTravelogue({
      planId: plan.planId,
      title: payload.title,
      authorName,
      authorId: plan.members[0]?.userId ?? 'local-user',
      overallRating: payload.overallRating,
      overallReview: payload.overallReview,
      placeReviews: reviews,
      destinationLabel,
      startDate: plan.startDate,
      endDate: plan.endDate,
      itinerary: buildItinerarySnapshot(plan),
      isPublic: payload.isPublic,
    });
    setSuccessMsg(
      payload.isPublic ? copy.publishedSuccessPublic : copy.publishedSuccessPrivate,
    );
    onPublished?.();
  };

  return (
    <View className="px-4 pb-8">
      <Text className="mb-1 text-lg font-bold text-brand-text">{copy.recordsTitle}</Text>
      <Text className="mb-4 text-sm text-brand-muted">{copy.recordsSub}</Text>

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
          const review = getReviewForRoute(reviews, route.itemId);
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

      {isPublished && publishedTravelogue ? (
        <View className="mt-4 rounded-2xl border border-brand-primary/30 bg-brand-selected px-4 py-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-bold text-brand-primary">{copy.published}</Text>
            <View className="rounded-full bg-brand-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-brand-primary">
                {isTraveloguePublic(publishedTravelogue)
                  ? copy.publishedPublic
                  : copy.publishedPrivate}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-base font-bold text-brand-text">
            {publishedTravelogue.title}
          </Text>
          {onViewTravelogue ? (
            <Pressable
              onPress={() => onViewTravelogue(publishedTravelogue.travelogueId)}
              className="mt-3 active:opacity-80">
              <Text className="text-sm font-bold text-brand-primary">
                {copy.viewMyTravelogue}
              </Text>
            </Pressable>
          ) : null}
          {isTraveloguePublic(publishedTravelogue) && onViewFeed ? (
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
          reviewRoute ? getReviewForRoute(reviews, reviewRoute.itemId) : undefined
        }
        copy={copy}
        language={language}
        planId={plan.planId}
        onClose={() => setReviewRoute(null)}
        onSave={payload => upsertReview(plan.planId, payload)}
      />

      <TravelogueComposeModal
        visible={composeOpen}
        copy={copy}
        language={language}
        authorName={authorName}
        destinationLabel={destinationLabel}
        placeReviews={reviews}
        defaultTitle={plan.title}
        onClose={() => setComposeOpen(false)}
        onPublish={handlePublish}
      />
    </View>
  );
}
