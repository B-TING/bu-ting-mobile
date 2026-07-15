import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import type { PlaceReviewResponse } from '../../types/travelRecordApi';
import { mapTravelRecordResponse } from '../../types/travelRecordApi';
import type { PlaceReview, ReviewMedia, TravelRecord } from '../../types/travelReview';
import {
  createPlaceReview,
  fetchMyTravelRecord,
  fetchMyTravelRecords,
  fetchTravelRecordDraft,
  updatePlaceReview,
} from './travelRecordService';

export class PlaceReviewSyncError extends Error {
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'PlaceReviewSyncError';
    this.cause = options?.cause;
  }
}

export type SavePlaceReviewInput = {
  accessToken: string | null | undefined;
  plan: TravelPlan;
  route: RouteItem;
  authorNickname?: string;
  payload: {
    placeReviewId?: string;
    rating: number;
    content: string | null;
    tags: string[];
    media?: ReviewMedia[];
  };
};

function travelIdOf(plan: TravelPlan): string {
  return plan.apiTravelId ?? plan.planId;
}

function localReviewPlaceKey(route: RouteItem): string {
  return route.apiPlanPlaceId ?? route.itemId;
}

/**
 * 서버 초안 장소 ↔ 일정 route 매칭.
 * `originalPlanPlaceId` / `travelRecordPlaceId` ≡ `route.apiPlanPlaceId` 만 허용.
 */
function findTravelRecordPlaceId(
  travelRecord: TravelRecord | null | undefined,
  apiPlanPlaceId: string,
): string | null {
  const places = travelRecord?.days?.flatMap(day => day.places) ?? [];
  if (places.length === 0) {
    return null;
  }

  const matched = places.find(
    place =>
      place.originalPlanPlaceId === apiPlanPlaceId ||
      place.travelRecordPlaceId === apiPlanPlaceId,
  );
  return matched?.travelRecordPlaceId ?? null;
}

function isServerReviewId(placeReviewId?: string): boolean {
  return Boolean(
    placeReviewId &&
      !placeReviewId.startsWith('rev-') &&
      !placeReviewId.startsWith('local-'),
  );
}

function mapApiReviewToPlaceReview(
  dto: PlaceReviewResponse,
  placeName: string,
  localTravelRecordPlaceId: string,
  media: ReviewMedia[] = [],
): PlaceReview {
  return {
    placeReviewId: dto.placeReviewId,
    travelRecordPlaceId: localTravelRecordPlaceId,
    rating: dto.rating,
    content: dto.content,
    tags: dto.tags ?? [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    placeName,
    media,
  };
}

/**
 * 기존 여행기(초안/내 기록)만 조회. 없으면 null.
 */
async function resolveExistingTravelRecord(
  accessToken: string,
  plan: TravelPlan,
  authorNickname: string,
): Promise<TravelRecord | null> {
  const travelId = travelIdOf(plan);
  const store = useTravelRecordStore.getState();
  const cached = store.getTravelRecordForTravel(travelId);

  const loadDetail = async (travelRecordId: string): Promise<TravelRecord | null> => {
    try {
      const detail = await fetchTravelRecordDraft(accessToken, travelId, travelRecordId);
      const mapped = mapTravelRecordResponse(detail, {
        authorNickname,
        placeReviews: store.getReviewsForTravel(travelId),
      });
      store.upsertTravelRecords([mapped]);
      return mapped;
    } catch {
      try {
        const detail = await fetchMyTravelRecord(accessToken, travelRecordId);
        const mapped = mapTravelRecordResponse(detail, {
          authorNickname,
          placeReviews: store.getReviewsForTravel(travelId),
        });
        store.upsertTravelRecords([mapped]);
        return mapped;
      } catch {
        return null;
      }
    }
  };

  if (cached && !cached.travelRecordId.startsWith('local-')) {
    const fromCache = await loadDetail(cached.travelRecordId);
    if (fromCache) {
      return fromCache;
    }
  }

  try {
    const mine = await fetchMyTravelRecords(accessToken);
    const match = mine.find(item => item.originalTravelId === travelId);
    if (!match) {
      return null;
    }
    return loadDetail(match.travelRecordId);
  } catch {
    return null;
  }
}

/**
 * 관광지 후기 저장 — API 필수. 세션 메모리는 API 응답 반영용.
 */
export async function savePlaceReviewForTravel(
  input: SavePlaceReviewInput,
): Promise<PlaceReview> {
  const { accessToken, plan, route, payload } = input;
  const travelId = travelIdOf(plan);
  const authorNickname =
    input.authorNickname ?? plan.members[0]?.nickname ?? 'Traveler';
  const store = useTravelRecordStore.getState();
  const localPlaceKey = localReviewPlaceKey(route);

  if (!accessToken?.trim()) {
    throw new PlaceReviewSyncError('로그인이 필요합니다.');
  }
  if (plan.source !== 'api') {
    throw new PlaceReviewSyncError('서버 일정에서만 후기를 저장할 수 있어요.');
  }
  if (!route.apiPlanPlaceId) {
    throw new PlaceReviewSyncError(
      '장소 서버 ID가 없어 후기를 저장할 수 없어요. 일정을 새로고침한 뒤 다시 시도해 주세요.',
    );
  }

  try {
    const travelRecord = await resolveExistingTravelRecord(
      accessToken,
      plan,
      authorNickname,
    );

    if (!travelRecord) {
      throw new PlaceReviewSyncError(
        '여행기 초안이 없어요. 일정을 다시 연 뒤 후기를 작성해 주세요.',
      );
    }

    const travelRecordPlaceId = findTravelRecordPlaceId(
      travelRecord,
      route.apiPlanPlaceId,
    );

    if (!travelRecordPlaceId) {
      throw new PlaceReviewSyncError(
        '이 장소가 여행기 초안에 없어요. 일정을 동기화한 뒤 다시 시도해 주세요.',
      );
    }

    const body = {
      rating: payload.rating,
      content: payload.content,
      tags: payload.tags,
    };

    let dto: PlaceReviewResponse;
    if (isServerReviewId(payload.placeReviewId)) {
      dto = await updatePlaceReview(
        accessToken,
        travelId,
        travelRecord.travelRecordId,
        travelRecordPlaceId,
        body,
      );
    } else {
      try {
        dto = await createPlaceReview(
          accessToken,
          travelId,
          travelRecord.travelRecordId,
          travelRecordPlaceId,
          body,
        );
      } catch (createError) {
        dto = await updatePlaceReview(
          accessToken,
          travelId,
          travelRecord.travelRecordId,
          travelRecordPlaceId,
          body,
        );
        if (__DEV__) {
          console.warn(
            '[savePlaceReviewForTravel] create failed, updated instead',
            createError,
          );
        }
      }
    }

    return store.upsertPlaceReview(travelId, {
      ...mapApiReviewToPlaceReview(
        dto,
        route.placeName,
        localPlaceKey,
        payload.media ?? [],
      ),
      placeReviewId: dto.placeReviewId,
      matchTravelRecordPlaceIds: [localPlaceKey, route.itemId, dto.travelRecordPlaceId],
    });
  } catch (error) {
    if (error instanceof PlaceReviewSyncError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : '후기 저장에 실패했습니다.';
    throw new PlaceReviewSyncError(message, { cause: error });
  }
}
