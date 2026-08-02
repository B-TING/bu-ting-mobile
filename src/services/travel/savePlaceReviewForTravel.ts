import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import type { PlaceReviewResponse } from '../../types/travelRecordApi';
import type { PlaceReview, ReviewMedia } from '../../types/travelReview';
import { extractFileKeyFromUri } from '../../utils/media/fileKey';
import { ApiClientError } from '../api/apiClient';
import { uploadFile } from '../files/fileUploadService';
import {
  createPlaceReview,
  deletePlaceReview,
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

function isRemoteUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function fileKeyFromMedia(media: ReviewMedia): string | null {
  if (media.fileKey?.trim()) {
    return media.fileKey.trim();
  }
  if (isRemoteUri(media.uri)) {
    return extractFileKeyFromUri(media.uri);
  }
  return null;
}

function toMediaFileKeyList(media: ReviewMedia[] | undefined): string[] {
  return (media ?? [])
    .map(fileKeyFromMedia)
    .filter((key): key is string => Boolean(key && key.length > 0));
}

function mediaSignature(keys: string[]): string {
  return [...keys].sort().join('\n');
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiClientError && error.status === 404) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /not found/i.test(message);
}

function isConflictError(error: unknown): boolean {
  if (error instanceof ApiClientError && (error.status === 400 || error.status === 409)) {
    return /이미|duplicate|already|exist/i.test(error.message);
  }
  const message = error instanceof Error ? error.message : String(error);
  return /이미|duplicate|already|exist/i.test(message);
}

function isServerError(error: unknown): boolean {
  return error instanceof ApiClientError && typeof error.status === 'number' && error.status >= 500;
}

/** 로컬 파일만 S3 업로드 후 원격 URL 로 교체 */
async function uploadLocalMedia(
  accessToken: string,
  media: ReviewMedia[] | undefined,
): Promise<ReviewMedia[]> {
  if (!media?.length) {
    return [];
  }
  const resolved: ReviewMedia[] = [];
  for (const item of media) {
    if (isRemoteUri(item.uri)) {
      resolved.push({
        ...item,
        fileKey: item.fileKey ?? extractFileKeyFromUri(item.uri) ?? undefined,
      });
      continue;
    }
    const mimeType =
      item.mimeType ?? (item.type === 'video' ? 'video/mp4' : 'image/jpeg');
    const uploadMime =
      item.type === 'video'
        ? mimeType === 'video/quicktime'
          ? 'video/quicktime'
          : 'video/mp4'
        : mimeType === 'image/png'
          ? 'image/png'
          : mimeType === 'image/webp'
            ? 'image/webp'
            : 'image/jpeg';
    const fileName =
      item.fileName ??
      (item.type === 'video'
        ? `review-${Date.now()}.${uploadMime === 'video/quicktime' ? 'mov' : 'mp4'}`
        : `review-${Date.now()}.jpg`);
    const uploaded = await uploadFile(accessToken, {
      uri: item.uri,
      type: uploadMime,
      name: fileName,
    });
    // 표시용으로는 Presigned URL 유지 (서명 제거 시 Image 403)
    resolved.push({
      ...item,
      uri: uploaded.url,
      fileKey: uploaded.fileKey,
      mimeType: uploaded.contentType || uploadMime,
      fileName: uploaded.originalFileName || fileName,
    });
  }
  return resolved;
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
      fileKey: extractFileKeyFromUri(uri) ?? undefined,
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
 * 미디어 교체가 포함된 수정은 서버 PATCH 500 이슈를 피하기 위해 삭제 후 재생성한다.
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

  try {
    let uploadedMedia: ReviewMedia[];
    try {
      uploadedMedia = await uploadLocalMedia(accessToken, payload.media);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : '미디어 업로드에 실패했습니다.';
      throw new PlaceReviewSyncError(message, { cause: uploadError });
    }

    const updating = isServerReviewId(payload.placeReviewId);
    const nextMediaFileKeys = toMediaFileKeyList(uploadedMedia);

    const existing = store.getReviewsForTravel(travelId).find(
      r =>
        r.placeReviewId === payload.placeReviewId ||
        r.planPlaceId === planPlaceId,
    );
    const prevMediaFileKeys = toMediaFileKeyList(existing?.media);
    const mediaChanged =
      mediaSignature(prevMediaFileKeys) !== mediaSignature(nextMediaFileKeys);

    const baseFields = {
      rating: payload.rating,
      content: payload.content,
      tags: payload.tags,
      stayMinutes: payload.stayMinutes ?? undefined,
    };

    const mediaFileKeysPayload =
      nextMediaFileKeys.length > 0 ? nextMediaFileKeys : undefined;

    if (__DEV__) {
      console.log('[savePlaceReviewForTravel]', {
        mode: updating ? 'update' : 'create',
        travelId,
        planPlaceId,
        mediaChanged,
        mediaCount: uploadedMedia.length,
        nextMediaFileKeys,
      });
    }

    let dto: PlaceReviewResponse;

    if (updating && mediaChanged) {
      // 백엔드 PlaceReview PATCH + 미디어 교체가 500을 내는 경우가 있어
      // 미디어가 바뀐 수정은 삭제 후 재생성으로 처리한다.
      try {
        await deletePlaceReview(accessToken, travelId, planPlaceId);
      } catch (deleteError) {
        if (!isNotFoundError(deleteError)) {
          throw deleteError;
        }
      }
      try {
        dto = await createPlaceReview(accessToken, travelId, planPlaceId, {
          ...baseFields,
          mediaFileKeys: mediaFileKeysPayload,
        });
      } catch (createError) {
        if (isConflictError(createError)) {
          // 삭제가 반영되기 전 레이스 → PATCH (미디어 없이 본문만) 후 한 번 더 삭제/생성
          await updatePlaceReview(accessToken, travelId, planPlaceId, baseFields);
          await deletePlaceReview(accessToken, travelId, planPlaceId);
          dto = await createPlaceReview(accessToken, travelId, planPlaceId, {
            ...baseFields,
            mediaFileKeys: mediaFileKeysPayload,
          });
        } else {
          throw createError;
        }
      }
    } else if (updating) {
      try {
        // 미디어 미변경: mediaFileKeys 생략 → 서버가 기존 미디어 유지
        dto = await updatePlaceReview(accessToken, travelId, planPlaceId, baseFields);
      } catch (updateError) {
        if (!isNotFoundError(updateError)) {
          throw updateError;
        }
        dto = await createPlaceReview(accessToken, travelId, planPlaceId, {
          ...baseFields,
          mediaFileKeys: mediaFileKeysPayload,
        });
      }
    } else {
      try {
        dto = await createPlaceReview(accessToken, travelId, planPlaceId, {
          ...baseFields,
          mediaFileKeys: mediaFileKeysPayload,
        });
      } catch (createError) {
        if (!isConflictError(createError)) {
          throw createError;
        }
        if (mediaChanged || nextMediaFileKeys.length > 0) {
          // 이미 후기가 있는데 미디어까지 넣으려다 충돌 → 삭제 후 생성
          try {
            await deletePlaceReview(accessToken, travelId, planPlaceId);
          } catch (deleteError) {
            if (!isNotFoundError(deleteError)) {
              throw deleteError;
            }
          }
          dto = await createPlaceReview(accessToken, travelId, planPlaceId, {
            ...baseFields,
            mediaFileKeys: mediaFileKeysPayload,
          });
        } else {
          dto = await updatePlaceReview(accessToken, travelId, planPlaceId, baseFields);
        }
      }
    }

    const mapped = mapApiReviewToPlaceReview(
      dto,
      route.placeName,
      planPlaceId,
      uploadedMedia,
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
    if (__DEV__ && isServerError(error)) {
      console.warn('[savePlaceReviewForTravel] server error', error);
    }
    throw new PlaceReviewSyncError(message, { cause: error });
  }
}
