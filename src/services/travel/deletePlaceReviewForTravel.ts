import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import { deletePlaceReview } from './travelRecordService';
import { PlaceReviewSyncError } from './savePlaceReviewForTravel';

export type DeletePlaceReviewInput = {
  accessToken: string | null | undefined;
  plan: TravelPlan;
  route: RouteItem;
  placeReviewId?: string;
};

function travelIdOf(plan: TravelPlan): string {
  return plan.apiTravelId ?? plan.planId;
}

/**
 * 일정 장소(PlanPlace) 후기만 삭제한다.
 * PlanPlace / 일정 경로는 삭제하지 않는다.
 */
export async function deletePlaceReviewForTravel(
  input: DeletePlaceReviewInput,
): Promise<void> {
  const { accessToken, plan, route, placeReviewId } = input;
  const travelId = travelIdOf(plan);
  const planPlaceId = route.apiPlanPlaceId;
  const store = useTravelRecordStore.getState();

  if (!accessToken?.trim()) {
    throw new PlaceReviewSyncError('로그인이 필요합니다.');
  }
  if (plan.source !== 'api') {
    throw new PlaceReviewSyncError('서버 일정에서만 후기를 삭제할 수 있어요.');
  }
  if (!planPlaceId) {
    throw new PlaceReviewSyncError(
      '장소 서버 ID가 없어 후기를 삭제할 수 없어요. 일정을 새로고침한 뒤 다시 시도해 주세요.',
    );
  }

  try {
    await deletePlaceReview(accessToken, travelId, planPlaceId);

    if (placeReviewId) {
      store.removePlaceReview(travelId, placeReviewId);
      return;
    }

    const existing = store
      .getReviewsForTravel(travelId)
      .find(
        r =>
          r.planPlaceId === planPlaceId ||
          r.travelRecordPlaceId === route.itemId,
      );
    if (existing) {
      store.removePlaceReview(travelId, existing.placeReviewId);
    }
  } catch (error) {
    if (error instanceof PlaceReviewSyncError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : '후기 삭제에 실패했습니다.';
    throw new PlaceReviewSyncError(message, { cause: error });
  }
}
