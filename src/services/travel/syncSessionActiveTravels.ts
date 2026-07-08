import { useAppStore } from '../../stores/useAppStore';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import { logTravelPlanApi } from '../../utils/travel/travelPlanApiLogger';
import { syncMyActiveTravelsFromApi } from './syncMyActiveTravelsFromApi';

/** 로그인 세션이 있으면 참여 중 여행(PLANNED·IN_PROGRESS)을 서버와 동기화합니다. */
export async function syncSessionActiveTravels(): Promise<void> {
  const accessToken = selectReusableAccessToken(useAuthStore.getState());
  const user = useAuthStore.getState().user;
  const displayName =
    useAppStore.getState().auth.displayName ?? user?.nickname ?? 'Traveler';

  if (!accessToken || !user?.userId) {
    logTravelPlanApi('my-travels.skip', 'my-travels 동기화 건너뜀 (세션 없음)', {
      level: 'warn',
      detail: { hasAccessToken: Boolean(accessToken), hasUser: Boolean(user?.userId) },
    });
    return;
  }

  logTravelPlanApi('my-travels.sync.start', '참여 중 여행 동기화 시작', {
    detail: { userId: user.userId },
  });

  try {
    const active = await syncMyActiveTravelsFromApi(accessToken, {
      userId: user.userId,
      nickname: displayName,
      role: 'OWNER',
    });
    logTravelPlanApi('my-travels.sync.done', '참여 중 여행 동기화 완료', {
      detail: { activePlanId: active?.planId, activeTitle: active?.title },
    });
  } catch (error) {
    logTravelPlanApi('my-travels.sync.error', '참여 중 여행 동기화 실패', {
      level: 'error',
      detail: error,
    });
  }
}
