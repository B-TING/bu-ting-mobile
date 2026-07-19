import { create } from 'zustand';

import type { PlaceReview } from '../types/travelReview';
import { createId } from '../utils/common/id';

export const EMPTY_REVIEWS: PlaceReview[] = [];

/**
 * 장소 후기 세션 캐시만 유지 (여행기 본문은 스토어에 두지 않음).
 * 디스크 persist 없음.
 */
type PlaceReviewState = {
  reviewsByTravelId: Record<string, PlaceReview[]>;
  upsertPlaceReview: (
    travelId: string,
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
      matchPlaceKeys?: string[];
      /** @deprecated matchPlaceKeys 사용 */
      matchTravelRecordPlaceIds?: string[];
    },
  ) => PlaceReview;
  removePlaceReview: (travelId: string, placeReviewId: string) => void;
  getReviewsForTravel: (travelId: string) => PlaceReview[];
  clearPlaceReviews: () => void;
};

export const useTravelRecordStore = create<PlaceReviewState>()((set, get) => ({
  reviewsByTravelId: {},
  upsertPlaceReview: (travelId, payload) => {
    const now = new Date().toISOString();
    const existing = get().reviewsByTravelId[travelId] ?? [];
    const {
      matchPlaceKeys,
      matchTravelRecordPlaceIds,
      placeReviewId,
      ...rest
    } = payload;
    const keys = [
      ...(matchPlaceKeys ?? []),
      ...(matchTravelRecordPlaceIds ?? []),
    ];
    const found =
      (placeReviewId
        ? existing.find(r => r.placeReviewId === placeReviewId)
        : undefined) ??
      (rest.planPlaceId
        ? existing.find(r => r.planPlaceId === rest.planPlaceId)
        : undefined) ??
      (rest.travelRecordPlaceId
        ? existing.find(r => r.travelRecordPlaceId === rest.travelRecordPlaceId)
        : undefined) ??
      (keys.length
        ? existing.find(
            r =>
              (r.planPlaceId != null && keys.includes(r.planPlaceId)) ||
              (r.travelRecordPlaceId != null &&
                keys.includes(r.travelRecordPlaceId)),
          )
        : undefined);

    const hasServerId = Boolean(
      placeReviewId &&
        !placeReviewId.startsWith('rev-') &&
        !placeReviewId.startsWith('local-'),
    );

    const review: PlaceReview = found
      ? {
          ...found,
          ...rest,
          placeReviewId: hasServerId ? placeReviewId! : found.placeReviewId,
          createdAt: found.createdAt,
          updatedAt: now,
        }
      : {
          ...rest,
          placeReviewId: hasServerId ? placeReviewId! : createId('rev-'),
          createdAt: now,
          updatedAt: now,
        };

    const next = found
      ? existing.map(r =>
          r.placeReviewId === found.placeReviewId ? review : r,
        )
      : [...existing, review];

    set(state => ({
      reviewsByTravelId: { ...state.reviewsByTravelId, [travelId]: next },
    }));
    return review;
  },
  removePlaceReview: (travelId, placeReviewId) => {
    set(state => {
      const existing = state.reviewsByTravelId[travelId] ?? [];
      return {
        reviewsByTravelId: {
          ...state.reviewsByTravelId,
          [travelId]: existing.filter(r => r.placeReviewId !== placeReviewId),
        },
      };
    });
  },
  getReviewsForTravel: travelId => get().reviewsByTravelId[travelId] ?? EMPTY_REVIEWS,
  clearPlaceReviews: () => {
    set({ reviewsByTravelId: {} });
  },
}));
