import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import { mapTravelRecordResponse } from '../../types/travelRecordApi';
import type { TravelRecord, TravelRecordStatus } from '../../types/travelReview';
import {
  hideMyTravelRecord,
  republishMyTravelRecord,
  updateMyTravelRecord,
} from './travelRecordService';
import { PublishTravelRecordError } from './publishTravelRecordForTravel';

export type UpdateTravelRecordInput = {
  accessToken: string;
  travelRecordId: string;
  travelId: string;
  authorNickname: string;
  title: string;
  content: string;
  /** 저장 후 원하는 공개 상태 */
  status: Extract<TravelRecordStatus, 'PUBLISHED' | 'HIDDEN'>;
  /** 현재 서버 상태 */
  currentStatus: TravelRecordStatus;
  coverImageUrl?: string | null;
};

/**
 * 이미 게시/숨김된 내 여행기 수정 + 공개/비공개 전환.
 * 결과는 반환만 하며 여행기 스토어에 저장하지 않음.
 */
export async function updateTravelRecordForTravel(
  input: UpdateTravelRecordInput,
): Promise<TravelRecord> {
  const {
    accessToken,
    travelRecordId,
    travelId,
    authorNickname,
    title,
    content,
    status,
    currentStatus,
    coverImageUrl,
  } = input;

  if (!accessToken?.trim()) {
    throw new PublishTravelRecordError('로그인이 필요합니다.');
  }

  try {
    let dto = await updateMyTravelRecord(accessToken, travelRecordId, {
      title,
      content: content || null,
      coverImageUrl: coverImageUrl ?? null,
    });

    if (status === 'HIDDEN' && currentStatus === 'PUBLISHED') {
      dto = await hideMyTravelRecord(accessToken, travelRecordId);
    } else if (status === 'PUBLISHED' && currentStatus === 'HIDDEN') {
      dto = await republishMyTravelRecord(accessToken, travelRecordId);
    }

    return mapTravelRecordResponse(dto, {
      authorNickname,
      placeReviews: useTravelRecordStore.getState().getReviewsForTravel(travelId),
    });
  } catch (error) {
    if (error instanceof PublishTravelRecordError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : '여행기 수정에 실패했습니다.';
    throw new PublishTravelRecordError(message, { cause: error });
  }
}
