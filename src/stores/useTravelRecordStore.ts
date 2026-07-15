import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  PlaceReview,
  TravelRecord,
  TravelRecordComment,
  TravelRecordSocial,
} from '../types/travelReview';
import { createId } from '../utils/common/id';

export const EMPTY_REVIEWS: PlaceReview[] = [];
export const EMPTY_SOCIAL: TravelRecordSocial = { likedUserIds: [], comments: [] };

type TravelRecordState = {
  reviewsByTravelId: Record<string, PlaceReview[]>;
  publishedTravelRecords: TravelRecord[];
  publishedTravelIds: string[];
  socialByTravelRecord: Record<string, TravelRecordSocial>;
  upsertPlaceReview: (
    travelId: string,
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
    },
  ) => PlaceReview;
  getReviewsForTravel: (travelId: string) => PlaceReview[];
  publishTravelRecord: (
    travelRecord: Omit<
      TravelRecord,
      'travelRecordId' | 'publishedAt' | 'likeCount' | 'viewCount'
    > & {
      travelRecordId?: string;
      publishedAt?: string | null;
      likeCount?: number;
      viewCount?: number;
    },
  ) => TravelRecord;
  /** Merge remote/local records by travelRecordId (remote wins). */
  upsertTravelRecords: (records: TravelRecord[]) => void;
  getTravelRecordForTravel: (travelId: string) => TravelRecord | undefined;
  isTravelPublished: (travelId: string) => boolean;
  getSocialForTravelRecord: (travelRecordId: string) => TravelRecordSocial;
  toggleLike: (travelRecordId: string, userId: string) => void;
  addComment: (
    travelRecordId: string,
    payload: { authorId: string; authorNickname: string; content: string },
  ) => TravelRecordComment;
};

export const useTravelRecordStore = create<TravelRecordState>()(
  persist(
    (set, get) => ({
      reviewsByTravelId: {},
      publishedTravelRecords: [],
      publishedTravelIds: [],
      socialByTravelRecord: {},
      upsertPlaceReview: (travelId, payload) => {
        const now = new Date().toISOString();
        const existing = get().reviewsByTravelId[travelId] ?? [];
        const found = payload.placeReviewId
          ? existing.find(r => r.placeReviewId === payload.placeReviewId)
          : existing.find(r => r.travelRecordPlaceId === payload.travelRecordPlaceId);

        const review: PlaceReview = found
          ? {
              ...found,
              ...payload,
              placeReviewId: found.placeReviewId,
              createdAt: found.createdAt,
              updatedAt: now,
            }
          : {
              ...payload,
              placeReviewId: createId('rev-'),
              createdAt: now,
              updatedAt: now,
            };

        const next = found
          ? existing.map(r => (r.placeReviewId === review.placeReviewId ? review : r))
          : [...existing, review];

        set(state => ({
          reviewsByTravelId: { ...state.reviewsByTravelId, [travelId]: next },
        }));
        return review;
      },
      getReviewsForTravel: travelId => get().reviewsByTravelId[travelId] ?? EMPTY_REVIEWS,
      publishTravelRecord: payload => {
        const travelId = payload.originalTravelId;
        const travelRecord: TravelRecord = {
          ...payload,
          travelRecordId: payload.travelRecordId ?? createId('tr-'),
          publishedAt: payload.publishedAt ?? new Date().toISOString(),
          likeCount: payload.likeCount ?? 0,
          viewCount: payload.viewCount ?? 0,
        };
        set(state => ({
          publishedTravelRecords: [travelRecord, ...state.publishedTravelRecords],
          publishedTravelIds:
            travelId && state.publishedTravelIds.includes(travelId)
              ? state.publishedTravelIds
              : travelId
                ? [...state.publishedTravelIds, travelId]
                : state.publishedTravelIds,
        }));
        return travelRecord;
      },
      upsertTravelRecords: records => {
        if (records.length === 0) {
          return;
        }
        set(state => {
          const byId = new Map(
            state.publishedTravelRecords.map(r => [r.travelRecordId, r] as const),
          );
          records.forEach(record => {
            const existing = byId.get(record.travelRecordId);
            byId.set(record.travelRecordId, existing ? { ...existing, ...record } : record);
          });
          const publishedTravelRecords = Array.from(byId.values());
          const publishedTravelIds = [
            ...new Set([
              ...state.publishedTravelIds,
              ...records
                .map(r => r.originalTravelId)
                .filter((id): id is string => Boolean(id)),
            ]),
          ];
          return { publishedTravelRecords, publishedTravelIds };
        });
      },
      getTravelRecordForTravel: travelId =>
        get().publishedTravelRecords.find(t => t.originalTravelId === travelId),
      isTravelPublished: travelId => get().publishedTravelIds.includes(travelId),
      getSocialForTravelRecord: travelRecordId =>
        get().socialByTravelRecord[travelRecordId] ?? EMPTY_SOCIAL,
      toggleLike: (travelRecordId, userId) => {
        const current = get().getSocialForTravelRecord(travelRecordId);
        const liked = current.likedUserIds.includes(userId);
        const likedUserIds = liked
          ? current.likedUserIds.filter(id => id !== userId)
          : [...current.likedUserIds, userId];
        set(state => ({
          socialByTravelRecord: {
            ...state.socialByTravelRecord,
            [travelRecordId]: { ...current, likedUserIds },
          },
          publishedTravelRecords: state.publishedTravelRecords.map(record =>
            record.travelRecordId === travelRecordId
              ? {
                  ...record,
                  likeCount: likedUserIds.length,
                  likedByMe: likedUserIds.includes(userId),
                }
              : record,
          ),
        }));
      },
      addComment: (travelRecordId, payload) => {
        const current = get().getSocialForTravelRecord(travelRecordId);
        const now = new Date().toISOString();
        const comment: TravelRecordComment = {
          commentId: createId('cmt-'),
          travelRecordId,
          authorId: payload.authorId,
          authorNickname: payload.authorNickname,
          authorProfileImageUrl: null,
          content: payload.content.trim(),
          createdAt: now,
          updatedAt: now,
        };
        set(state => ({
          socialByTravelRecord: {
            ...state.socialByTravelRecord,
            [travelRecordId]: {
              ...current,
              comments: [...current.comments, comment],
            },
          },
        }));
        return comment;
      },
    }),
    {
      name: '@buting/travel-records',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        reviewsByTravelId: state.reviewsByTravelId,
        publishedTravelRecords: state.publishedTravelRecords,
        publishedTravelIds: state.publishedTravelIds,
        socialByTravelRecord: state.socialByTravelRecord,
      }),
    },
  ),
);
