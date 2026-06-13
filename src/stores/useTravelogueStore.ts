import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PlaceReview, Travelogue, TravelogueComment, TravelogueSocial } from '../types/travelReview';
import { createId } from '../utils/id';

export const EMPTY_REVIEWS: PlaceReview[] = [];
export const EMPTY_SOCIAL: TravelogueSocial = { helpfulUserIds: [], comments: [] };

type TravelogueState = {
  reviewsByPlan: Record<string, PlaceReview[]>;
  publishedTravelogues: Travelogue[];
  publishedPlanIds: string[];
  socialByTravelogue: Record<string, TravelogueSocial>;
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
  getSocialForTravelogue: (travelogueId: string) => TravelogueSocial;
  toggleHelpful: (travelogueId: string, userId: string) => void;
  addComment: (
    travelogueId: string,
    payload: { authorId: string; authorName: string; text: string },
  ) => TravelogueComment;
};

export const useTravelogueStore = create<TravelogueState>()(
  persist(
    (set, get) => ({
      reviewsByPlan: {},
      publishedTravelogues: [],
      publishedPlanIds: [],
      socialByTravelogue: {},
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
      getSocialForTravelogue: travelogueId =>
        get().socialByTravelogue[travelogueId] ?? EMPTY_SOCIAL,
      toggleHelpful: (travelogueId, userId) => {
        const current = get().getSocialForTravelogue(travelogueId);
        const liked = current.helpfulUserIds.includes(userId);
        const helpfulUserIds = liked
          ? current.helpfulUserIds.filter(id => id !== userId)
          : [...current.helpfulUserIds, userId];
        set(state => ({
          socialByTravelogue: {
            ...state.socialByTravelogue,
            [travelogueId]: { ...current, helpfulUserIds },
          },
        }));
      },
      addComment: (travelogueId, payload) => {
        const current = get().getSocialForTravelogue(travelogueId);
        const comment: TravelogueComment = {
          commentId: createId('cmt-'),
          authorId: payload.authorId,
          authorName: payload.authorName,
          text: payload.text.trim(),
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          socialByTravelogue: {
            ...state.socialByTravelogue,
            [travelogueId]: {
              ...current,
              comments: [...current.comments, comment],
            },
          },
        }));
        return comment;
      },
    }),
    {
      name: '@buting/travelogues',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        reviewsByPlan: state.reviewsByPlan,
        publishedTravelogues: state.publishedTravelogues,
        publishedPlanIds: state.publishedPlanIds,
        socialByTravelogue: state.socialByTravelogue,
      }),
    },
  ),
);
