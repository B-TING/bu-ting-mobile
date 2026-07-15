import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import type { PlaceReviewResponse } from '../../types/travelRecordApi';
import type { PlaceReview, ReviewMedia } from '../../types/travelReview';
import {
  createPlaceReview,
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
    stayMinutes?: number | null;
    media?: ReviewMedia[];
  };
};

function travelIdOf(plan: TravelPlan): string {
  return plan.apiTravelId ?? plan.planId;
}

function isServerReviewId(placeReviewId?: string): boolean {
  return Boolean(
    placeReviewId &&
      !placeReviewId.startsWith('rev-') &&
      !placeReviewId.startsWith('local-'),
  );
}

function mediaUrlsFromLocal(media: ReviewMedia[] | undefined): string[] | undefined {
  if (!media?.length) {
    return undefined;
  }
  const urls = media
    .map(m => m.uri)
    .filter(uri => uri.startsWith('http://') || uri.startsWith('https://'));
  return urls.length > 0 ? urls : undefined;
}

function mapApiReviewToPlaceReview(
  dto: PlaceReviewResponse,
  placeName: string,
  planPlaceId: string,
  media: ReviewMedia[] = [],
): PlaceReview {
  const fromUrls =
    dto.mediaUrls?.map((uri, index) => ({
      mediaId: `api-media-${dto.placeReviewId}-${index}`,
      type: (uri.match(/\.(mp4|mov|webm)(\?|$)/i) ? 'video' : 'image') as
        | 'image'
        | 'video',
      uri,
    })) ?? [];

  return {
    placeReviewId: dto.placeReviewId,
    planPlaceId: dto.planPlaceId ?? planPlaceId,
    travelRecordPlaceId: dto.travelRecordPlaceId ?? null,
    rating: dto.rating,
    stayMinutes: dto.stayMinutes ?? null,
    content: dto.content,
    tags: dto.tags ?? [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    placeName,
    media: media.length > 0 ? media : fromUrls,
  };
}

/**
 * 일정 장소(PlanPlace) 후기 저장.
 * 여행기 초안 없이 `travelId` + `planPlaceId`로 바로 작성/수정한다.
 */
export async function savePlaceReviewForTravel(
  input: SavePlaceReviewInput,
): Promise<PlaceReview> {
  const { accessToken, plan, route, payload } = input;
  const travelId = travelIdOf(plan);
  const store = useTravelRecordStore.getState();
  const planPlaceId = route.apiPlanPlaceId;

  if (!accessToken?.trim()) {
    throw new PlaceReviewSyncError('로그인이 필요합니다.');
  }
  if (plan.source !== 'api') {
    throw new PlaceReviewSyncError('서버 일정에서만 후기를 저장할 수 있어요.');
  }
  if (!planPlaceId) {
    throw new PlaceReviewSyncError(
      '장소 서버 ID가 없어 후기를 저장할 수 없어요. 일정을 새로고침한 뒤 다시 시도해 주세요.',
    );
  }

  const body = {
    rating: payload.rating,
    content: payload.content,
    tags: payload.tags,
    stayMinutes: payload.stayMinutes ?? undefined,
    mediaUrls: mediaUrlsFromLocal(payload.media),
  };

  try {
    let dto: PlaceReviewResponse;
    if (isServerReviewId(payload.placeReviewId)) {
      dto = await updatePlaceReview(accessToken, travelId, planPlaceId, body);
    } else {
      try {
        dto = await createPlaceReview(accessToken, travelId, planPlaceId, body);
      } catch (createError) {
        // 이미 있으면 보통 중복 → PATCH로 갱신
        dto = await updatePlaceReview(accessToken, travelId, planPlaceId, body);
        if (__DEV__) {
          console.warn(
            '[savePlaceReviewForTravel] create failed, updated instead',
            createError,
          );
        }
      }
    }

    const mapped = mapApiReviewToPlaceReview(
      dto,
      route.placeName,
      planPlaceId,
      payload.media ?? [],
    );

    return store.upsertPlaceReview(travelId, {
      ...mapped,
      placeReviewId: dto.placeReviewId,
      matchPlaceKeys: [
        planPlaceId,
        route.itemId,
        dto.planPlaceId,
        dto.travelRecordPlaceId,
      ].filter((id): id is string => Boolean(id)),
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
