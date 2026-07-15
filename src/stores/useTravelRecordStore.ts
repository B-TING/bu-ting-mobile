import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type {
  PlaceReview,
  TravelRecord,
  TravelRecordComment,
  TravelRecordSocial,
} from '../types/travelReview';
import { createId } from '../utils/common/id';

export const EMPTY_REVIEWS: PlaceReview[] = [];
export const EMPTY_SOCIAL: TravelRecordSocial = { likedUserIds: [], comments: [] };

const LEGACY_PERSIST_KEY = '@buting/travel-records';

/** 이전 로컬 여행기 persist 잔여 데이터 제거 */
void AsyncStorage.removeItem(LEGACY_PERSIST_KEY).catch(() => undefined);

type TravelRecordState = {
  /** 세션 메모리 캐시 (API 응답 반영). 디스크 저장 없음 */
  reviewsByTravelId: Record<string, PlaceReview[]>;
  publishedTravelRecords: TravelRecord[];
  publishedTravelIds: string[];
  socialByTravelRecord: Record<string, TravelRecordSocial>;
  upsertPlaceReview: (
    travelId: string,
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
      /** route id → 서버 place id 매칭 시 기존 후기 교체용 */
      matchTravelRecordPlaceIds?: string[];
    },
  ) => PlaceReview;
  getReviewsForTravel: (travelId: string) => PlaceReview[];
  /** Merge API records by travelRecordId (remote wins). */
  upsertTravelRecords: (records: TravelRecord[]) => void;
  /** Replace session list (e.g. after feed/me fetch). */
  setTravelRecords: (records: TravelRecord[]) => void;
  clearTravelRecords: () => void;
  getTravelRecordForTravel: (travelId: string) => TravelRecord | undefined;
  isTravelPublished: (travelId: string) => boolean;
  getSocialForTravelRecord: (travelRecordId: string) => TravelRecordSocial;
  toggleLike: (travelRecordId: string, userId: string) => void;
  addComment: (
    travelRecordId: string,
    payload: { authorId: string; authorNickname: string; content: string },
  ) => TravelRecordComment;
};

function isPublishedStatus(status: TravelRecord['status']): boolean {
  return status === 'PUBLISHED' || status === 'HIDDEN';
}

export const useTravelRecordStore = create<TravelRecordState>()((set, get) => ({
  reviewsByTravelId: {},
  publishedTravelRecords: [],
  publishedTravelIds: [],
  socialByTravelRecord: {},
  upsertPlaceReview: (travelId, payload) => {
    const now = new Date().toISOString();
    const existing = get().reviewsByTravelId[travelId] ?? [];
    const { matchTravelRecordPlaceIds, placeReviewId, ...rest } = payload;
    const found =
      (placeReviewId
        ? existing.find(r => r.placeReviewId === placeReviewId)
        : undefined) ??
      existing.find(r => r.travelRecordPlaceId === rest.travelRecordPlaceId) ??
      (matchTravelRecordPlaceIds?.length
        ? existing.find(r => matchTravelRecordPlaceIds.includes(r.travelRecordPlaceId))
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
  getReviewsForTravel: travelId => get().reviewsByTravelId[travelId] ?? EMPTY_REVIEWS,
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
            .filter(r => isPublishedStatus(r.status))
            .map(r => r.originalTravelId)
            .filter((id): id is string => Boolean(id)),
        ]),
      ];
      return { publishedTravelRecords, publishedTravelIds };
    });
  },
  setTravelRecords: records => {
    set({
      publishedTravelRecords: records,
      publishedTravelIds: [
        ...new Set(
          records
            .filter(r => isPublishedStatus(r.status))
            .map(r => r.originalTravelId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
    });
  },
  clearTravelRecords: () => {
    set({
      reviewsByTravelId: {},
      publishedTravelRecords: [],
      publishedTravelIds: [],
      socialByTravelRecord: {},
    });
  },
  getTravelRecordForTravel: travelId =>
    get().publishedTravelRecords.find(t => t.originalTravelId === travelId),
  isTravelPublished: travelId => {
    const record = get().getTravelRecordForTravel(travelId);
    if (record) {
      return isPublishedStatus(record.status);
    }
    return get().publishedTravelIds.includes(travelId);
  },
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
}));
