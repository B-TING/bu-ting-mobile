import { ApiClientError } from '../../services/api/apiClient';
import { usePlanStore } from '../../stores/usePlanStore';

/** 일정 API 오류 시 편집 잠금이 필요한 HTTP 상태 */
export function shouldLockScheduleOnTravelApiError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    const status = error.status;
    if (status == null) {
      return true;
    }
    if (status === 404) {
      return true;
    }
    if (status >= 500) {
      return true;
    }
    return false;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network')) {
      return true;
    }
    if (error.message.includes('동기화되지 않았습니다')) {
      return true;
    }
    if (error.message.includes('서버에서 장소를 찾을 수 없습니다')) {
      return true;
    }
  }

  return false;
}

export function lockPlanScheduleIfApiError(planId: string, error: unknown): boolean {
  if (!planId || !shouldLockScheduleOnTravelApiError(error)) {
    return false;
  }

  usePlanStore.getState().setPlanOfflineSync?.(planId, true);
  return true;
}

export function unlockPlanSchedule(planId: string): void {
  if (!planId) {
    return;
  }
  usePlanStore.getState().setPlanOfflineSync?.(planId, false);
}
