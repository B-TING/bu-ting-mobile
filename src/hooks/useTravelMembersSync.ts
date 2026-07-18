import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { fetchTravelMembers } from '../services/travel/travelTeamService';
import { travelMembersToPlanMembers } from '../services/travel/travelMapper';
import { isPlanForCurrentApiServer } from '../utils/api/apiServerOrigin';
import { logTravelPlanApi } from '../utils/travel/travelPlanApiLogger';
import { usePlanStore } from '../stores/usePlanStore';

type UseTravelMembersSyncOptions = {
  planId: string;
  travelId: string | null | undefined;
  accessToken: string | null;
  enabled: boolean;
};

/** API 연동 여행 — 화면 포커스 시 서버 멤버 목록으로 갱신 */
export function useTravelMembersSync({
  planId,
  travelId,
  accessToken,
  enabled,
}: UseTravelMembersSyncOptions) {
  const upsertPlan = usePlanStore(s => s.upsertPlan);

  const syncMembers = useCallback(async () => {
    if (!enabled || !accessToken || !travelId || !planId) {
      return;
    }

    try {
      const members = await fetchTravelMembers(accessToken, travelId);
      const plan = usePlanStore.getState().plans.find(p => p.planId === planId);
      if (!plan || !isPlanForCurrentApiServer(plan)) {
        return;
      }

      upsertPlan({
        ...plan,
        members: travelMembersToPlanMembers(members),
      });
    } catch (error) {
      logTravelPlanApi('members.sync.error', '여행 멤버 동기화 실패', {
        level: 'warn',
        detail: error,
      });
    }
  }, [accessToken, enabled, planId, travelId, upsertPlan]);

  useFocusEffect(
    useCallback(() => {
      void syncMembers();
    }, [syncMembers]),
  );

  return { syncMembers };
}
