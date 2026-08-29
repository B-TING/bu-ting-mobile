import { selectAuthUser, useAuthStore } from '../../stores/useAuthStore';
import { usePlanStore } from '../../stores/usePlanStore';
import type { InviteVerificationResponse } from '../../types/travelApi';
import { syncMyActiveTravelsFromApi } from './syncMyActiveTravelsFromApi';
import {
  acceptTravelInvite,
  verifyTravelInvite,
} from './travelTeamService';

export async function previewTravelInvite(
  token: string,
): Promise<InviteVerificationResponse> {
  const preview = await verifyTravelInvite(token);
  if (!preview.valid) {
    throw new Error('Invite token is not valid');
  }
  return preview;
}

/**
 * accept 후 내 여행 목록을 동기화하고 active plan을 맞춥니다.
 * @returns 로컬에서 열 PlanDetail용 planId
 */
export async function acceptAndSyncTravelInvite(
  accessToken: string,
  token: string,
): Promise<{ travelId: string; travelName: string; planId: string }> {
  const accepted = await acceptTravelInvite(accessToken, token);
  const user = selectAuthUser(useAuthStore.getState());
  if (user) {
    const synced = await syncMyActiveTravelsFromApi(accessToken, {
      userId: user.userId,
      nickname: user.nickname,
      role: 'MEMBER',
    });
    const planId =
      synced?.planId ??
      usePlanStore.getState().plans.find(
        p => p.apiTravelId === accepted.travelId || p.planId === accepted.travelId,
      )?.planId ??
      accepted.travelId;
    usePlanStore.getState().setActivePlan(planId);
    return {
      travelId: accepted.travelId,
      travelName: accepted.travelName,
      planId,
    };
  }

  usePlanStore.getState().setActivePlan(accepted.travelId);
  return {
    travelId: accepted.travelId,
    travelName: accepted.travelName,
    planId: accepted.travelId,
  };
}
