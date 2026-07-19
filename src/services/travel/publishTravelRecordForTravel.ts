import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type { TravelPlan } from '../../types/travelPlan';
import { mapTravelRecordResponse } from '../../types/travelRecordApi';
import type { TravelRecord, TravelRecordStatus } from '../../types/travelReview';
import {
  createTravelRecordDraft,
  fetchMyTravelRecord,
  fetchMyTravelRecords,
  fetchTravelRecordDraft,
  hideMyTravelRecord,
  publishTravelRecord,
  updateTravelRecordDraft,
} from './travelRecordService';

export class PublishTravelRecordError extends Error {
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'PublishTravelRecordError';
    this.cause = options?.cause;
  }
}

export type PublishTravelRecordInput = {
  accessToken: string;
  plan: TravelPlan;
  authorNickname: string;
  title: string;
  content: string;
  status: Extract<TravelRecordStatus, 'PUBLISHED' | 'HIDDEN'>;
  coverImageUrl?: string | null;
};

function travelIdOf(plan: TravelPlan): string {
  return plan.apiTravelId ?? plan.planId;
}

async function resolveOrCreateDraft(
  accessToken: string,
  plan: TravelPlan,
  authorNickname: string,
  title: string,
): Promise<TravelRecord> {
  const travelId = travelIdOf(plan);
  const store = useTravelRecordStore.getState();
  const cached = store.getTravelRecordForTravel(travelId);

  const loadDetail = async (travelRecordId: string): Promise<TravelRecord | null> => {
    try {
      const detail = await fetchTravelRecordDraft(accessToken, travelId, travelRecordId);
      return mapTravelRecordResponse(detail, {
        authorNickname,
        placeReviews: store.getReviewsForTravel(travelId),
      });
    } catch {
      try {
        const detail = await fetchMyTravelRecord(accessToken, travelRecordId);
        return mapTravelRecordResponse(detail, {
          authorNickname,
          placeReviews: store.getReviewsForTravel(travelId),
        });
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

  const mine = await fetchMyTravelRecords(accessToken);
  const match = mine.find(item => item.travelId === travelId);
  if (match) {
    const fromList = await loadDetail(match.travelRecordId);
    if (fromList) {
      return fromList;
    }
  }

  const created = await createTravelRecordDraft(accessToken, travelId, { title });
  return mapTravelRecordResponse(created, {
    authorNickname,
    placeReviews: store.getReviewsForTravel(travelId),
  });
}

/**
 * 여행기 제목/본문 저장 후 게시(또는 비공개). 로컬 전용 저장 없음.
 */
export async function publishTravelRecordForTravel(
  input: PublishTravelRecordInput,
): Promise<TravelRecord> {
  const { accessToken, plan, authorNickname, title, content, status, coverImageUrl } =
    input;

  if (!accessToken?.trim()) {
    throw new PublishTravelRecordError('로그인이 필요합니다.');
  }
  if (plan.source !== 'api' || !plan.apiTravelId) {
    throw new PublishTravelRecordError('서버 일정에서만 여행기를 게시할 수 있어요.');
  }

  const travelId = travelIdOf(plan);
  const store = useTravelRecordStore.getState();

  try {
    const draft = await resolveOrCreateDraft(
      accessToken,
      plan,
      authorNickname,
      title,
    );

    await updateTravelRecordDraft(accessToken, travelId, draft.travelRecordId, {
      title,
      content: content || null,
      coverImageUrl: coverImageUrl ?? draft.coverImageUrl ?? null,
    });

    let dto = await publishTravelRecord(
      accessToken,
      travelId,
      draft.travelRecordId,
    );

    if (status === 'HIDDEN') {
      dto = await hideMyTravelRecord(accessToken, draft.travelRecordId);
    }

    const record = mapTravelRecordResponse(dto, {
      authorNickname,
      placeReviews: store.getReviewsForTravel(travelId),
    });
    store.upsertTravelRecords([record]);
    return record;
  } catch (error) {
    if (error instanceof PublishTravelRecordError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : '여행기 게시에 실패했습니다.';
    throw new PublishTravelRecordError(message, { cause: error });
  }
}
