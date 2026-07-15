import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type {
  PlaceReviewResponse,
  PlaceReviewSummaryItemResponse,
  TravelRecordResponse,
} from '../../types/travelRecordApi';
import { mapTravelRecordResponse } from '../../types/travelRecordApi';
import type { PlaceReview, TravelRecord, TravelRecordPlace } from '../../types/travelReview';
import {
  fetchMyTravelRecord,
  fetchPlaceReview,
  fetchPlaceReviewSummary,
  fetchPublicTravelRecord,
} from './travelRecordService';

function mediaFromUrls(placeReviewId: string, mediaUrls?: string[]) {
  return (
    mediaUrls?.map((uri, index) => ({
      mediaId: `api-media-${placeReviewId}-${index}`,
      type: (uri.match(/\.(mp4|mov|webm)(\?|$)/i) ? 'video' : 'image') as
        | 'image'
        | 'video',
      uri,
    })) ?? []
  );
}

function mapDtoToPlaceReview(
  dto: PlaceReviewResponse,
  place: TravelRecordPlace,
): PlaceReview {
  return {
    placeReviewId: dto.placeReviewId,
    planPlaceId: dto.planPlaceId ?? place.originalPlanPlaceId,
    travelRecordPlaceId: dto.travelRecordPlaceId ?? place.travelRecordPlaceId,
    rating: dto.rating,
    stayMinutes: dto.stayMinutes ?? null,
    content: dto.content,
    tags: dto.tags ?? [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    placeName: place.placeName,
    media: mediaFromUrls(dto.placeReviewId, dto.mediaUrls),
  };
}

function mapSummaryItemToPlaceReview(
  item: PlaceReviewSummaryItemResponse,
): PlaceReview {
  return {
    placeReviewId: item.placeReviewId,
    planPlaceId: null,
    travelRecordPlaceId: item.travelRecordPlaceId,
    rating: item.rating,
    content: item.content,
    tags: item.tags ?? [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    placeName: item.placeName,
    media: [],
  };
}

function flattenPlaces(record: TravelRecord): TravelRecordPlace[] {
  return record.days?.flatMap(day => day.places) ?? [];
}

/**
 * 작성자 권한이 있으면 PlanPlace 후기 GET,
 * 없으면(공개 피드) places/reviews 집계에서 해당 travelRecordId만 필터.
 */
async function fetchPlaceReviewsForRecord(options: {
  travelRecord: TravelRecord;
  accessToken?: string | null;
}): Promise<PlaceReview[]> {
  const { travelRecord, accessToken } = options;
  const places = flattenPlaces(travelRecord);
  if (places.length === 0) {
    return travelRecord.placeReviews ?? [];
  }

  const travelId = travelRecord.originalTravelId;
  const canUseAuthorApi = Boolean(accessToken?.trim() && travelId);

  if (canUseAuthorApi) {
    const results = await Promise.all(
      places.map(async place => {
        const planPlaceId = place.originalPlanPlaceId;
        if (!planPlaceId) {
          return null;
        }
        try {
          const dto = await fetchPlaceReview(accessToken!, travelId!, planPlaceId);
          return mapDtoToPlaceReview(dto, place);
        } catch {
          return null;
        }
      }),
    );
    const authorReviews = results.filter((r): r is PlaceReview => r != null);
    if (authorReviews.length > 0) {
      return authorReviews;
    }
    // 작성자가 아니거나 404면 공개 집계로 fallback
  }

  const providerIds = [
    ...new Set(places.map(p => p.providerPlaceId).filter(Boolean)),
  ];
  if (providerIds.length === 0) {
    return travelRecord.placeReviews ?? [];
  }

  const summaries = await Promise.all(
    providerIds.map(async placeId => {
      try {
        return await fetchPlaceReviewSummary(placeId);
      } catch {
        return null;
      }
    }),
  );

  const matched: PlaceReview[] = [];
  summaries.forEach(summary => {
    summary?.reviews?.forEach(item => {
      if (item.travelRecordId === travelRecord.travelRecordId) {
        matched.push(mapSummaryItemToPlaceReview(item));
      }
    });
  });

  if (matched.length > 0) {
    return matched;
  }

  return travelRecord.placeReviews ?? [];
}

function mergeLocalFallback(
  remote: TravelRecord,
  local: TravelRecord | undefined,
): TravelRecord {
  if (!local) {
    return remote;
  }
  return {
    ...remote,
    authorNickname: remote.authorNickname || local.authorNickname,
    placeReviews:
      remote.placeReviews.length > 0 ? remote.placeReviews : local.placeReviews,
    days: remote.days.length > 0 ? remote.days : local.days,
  };
}

export type LoadTravelRecordDetailInput = {
  travelRecordId: string;
  accessToken?: string | null;
  /** 이미 스토어/피드에 있는 요약 (닉네임 등) */
  seed?: TravelRecord | null;
};

/**
 * 공개/내 여행기 상세 + 장소 후기 조회 → 스토어에 upsert.
 */
export async function loadTravelRecordDetail(
  input: LoadTravelRecordDetailInput,
): Promise<TravelRecord> {
  const { travelRecordId, accessToken, seed } = input;
  const store = useTravelRecordStore.getState();
  const local =
    seed ??
    store.publishedTravelRecords.find(r => r.travelRecordId === travelRecordId);

  let dto: TravelRecordResponse | null = null;

  if (accessToken?.trim()) {
    try {
      dto = await fetchMyTravelRecord(accessToken, travelRecordId);
    } catch {
      // 작성자가 아니면 공개 상세로
    }
  }

  if (!dto) {
    dto = await fetchPublicTravelRecord(travelRecordId);
  }

  let record = mapTravelRecordResponse(dto, {
    authorNickname: local?.authorNickname ?? '',
    likedByMe: local?.likedByMe,
    placeReviews: local?.placeReviews ?? [],
  });

  const placeReviews = await fetchPlaceReviewsForRecord({
    travelRecord: record,
    accessToken,
  });

  record = mergeLocalFallback(
    { ...record, placeReviews },
    local ?? undefined,
  );

  store.upsertTravelRecords([record]);
  return record;
}
