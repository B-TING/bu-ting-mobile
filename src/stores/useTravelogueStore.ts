import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PlaceReview, Travelogue } from '../types/travelReview';
import { createId } from '../utils/id';

export const EMPTY_REVIEWS: PlaceReview[] = [];

type TravelogueState = {
  reviewsByPlan: Record<string, PlaceReview[]>;
  publishedTravelogues: Travelogue[];
  publishedPlanIds: string[];
  upsertPlaceReview: (
    planId: string,
    payload: Omit<PlaceReview, 'reviewId' | 'createdAt' | 'updatedAt'> & {
      reviewId?: string;
    },
  ) => PlaceReview;
  getReviewsForPlan: (planId: string) => PlaceReview[];
  publishTravelogue: (travelogue: Omit<Travelogue, 'travelogueId' | 'publishedAt'>) => Travelogue;
  getTravelogueForPlan: (planId: string) => Travelogue | undefined;
  isPlanPublished: (planId: string) => boolean;
};

export const useTravelogueStore = create<TravelogueState>()(
  persist(
    (set, get) => ({
      reviewsByPlan: {},
      publishedTravelogues: [],
      publishedPlanIds: [],
      upsertPlaceReview: (planId, payload) => {
        const now = new Date().toISOString();
        const existing = get().reviewsByPlan[planId] ?? [];
        const found = payload.reviewId
          ? existing.find(r => r.reviewId === payload.reviewId)
          : existing.find(r => r.routeItemId === payload.routeItemId);

        const review: PlaceReview = found
          ? {
              ...found,
              ...payload,
              reviewId: found.reviewId,
              createdAt: found.createdAt,
              updatedAt: now,
            }
          : {
              ...payload,
              reviewId: createId('rev-'),
              createdAt: now,
              updatedAt: now,
            };

        const next = found
          ? existing.map(r => (r.reviewId === review.reviewId ? review : r))
          : [...existing, review];

        set(state => ({
          reviewsByPlan: { ...state.reviewsByPlan, [planId]: next },
        }));
        return review;
      },
      getReviewsForPlan: planId => get().reviewsByPlan[planId] ?? EMPTY_REVIEWS,
      publishTravelogue: payload => {
        const travelogue: Travelogue = {
          ...payload,
          travelogueId: createId('tlg-'),
          publishedAt: new Date().toISOString(),
        };
        set(state => ({
          publishedTravelogues: [travelogue, ...state.publishedTravelogues],
          publishedPlanIds: state.publishedPlanIds.includes(payload.planId)
            ? state.publishedPlanIds
            : [...state.publishedPlanIds, payload.planId],
        }));
        return travelogue;
      },
      getTravelogueForPlan: planId =>
        get().publishedTravelogues.find(t => t.planId === planId),
      isPlanPublished: planId => get().publishedPlanIds.includes(planId),
    }),
    {
      name: '@buting/travelogues',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        reviewsByPlan: state.reviewsByPlan,
        publishedTravelogues: state.publishedTravelogues,
        publishedPlanIds: state.publishedPlanIds,
      }),
    },
  ),
);
