import type { TravelRecordCloneToTravelRequest } from '../../types/travelRecordApi';
import type { PlanMember, TravelPlan } from '../../types/travelPlan';
import { travelPlansResponseToPlan } from './travelMapper';
import { cloneTravelRecordToTravel } from './travelRecordService';

export class CloneTravelFromRecordError extends Error {
  cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'CloneTravelFromRecordError';
    this.cause = options?.cause;
  }
}

export type CloneTravelFromRecordInput = {
  accessToken: string;
  travelRecordId: string;
  members: PlanMember[];
  request: TravelRecordCloneToTravelRequest;
};

/**
 * 여행기 스냅샷을 서버에서 새 Travel(PLANNED)로 복제한 뒤 `TravelPlan`으로 반환.
 * 로컬 폴백 없음 — API 실패 시 예외.
 */
export async function cloneTravelFromRecord(
  input: CloneTravelFromRecordInput,
): Promise<TravelPlan> {
  const { accessToken, travelRecordId, members, request } = input;

  if (!accessToken?.trim()) {
    throw new CloneTravelFromRecordError('로그인이 필요합니다.');
  }
  if (!request.startDate?.trim()) {
    throw new CloneTravelFromRecordError('출발일을 선택해 주세요.');
  }

  try {
    const plans = await cloneTravelRecordToTravel(accessToken, travelRecordId, request);
    const sortedDays = [...(plans.days ?? [])].sort((a, b) => a.dayNumber - b.dayNumber);
    const startDate = sortedDays[0]?.visitDate ?? request.startDate;
    const endDate = sortedDays[sortedDays.length - 1]?.visitDate ?? startDate;

    return travelPlansResponseToPlan(plans, members, {}, startDate, endDate);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '여행 계획 가져오기에 실패했습니다.';
    throw new CloneTravelFromRecordError(message, { cause: error });
  }
}
