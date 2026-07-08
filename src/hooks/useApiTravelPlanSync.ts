import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { syncTravelPlanFromApi } from '../services/travel/syncTravelPlanFromApi';
import type { TravelPlan } from '../types/travelPlan';
import { usePlanStore } from '../stores/usePlanStore';

type UseApiTravelPlanSyncOptions = {
  planId: string;
  enabled: boolean;
  accessToken: string | null;
};

/** API 연동 플랜 — 화면 포커스 시 서버 일정으로 로컬 캐시를 갱신 */
export function useApiTravelPlanSync({
  planId,
  enabled,
  accessToken,
}: UseApiTravelPlanSyncOptions) {
  const upsertPlan = usePlanStore(s => s.upsertPlan);
  const syncingRef = useRef(false);

  const syncFromServer = useCallback(async (): Promise<TravelPlan | null> => {
    if (!enabled || !accessToken || !planId) {
      return usePlanStore.getState().plans.find(p => p.planId === planId) ?? null;
    }

    const localPlan = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!localPlan || localPlan.source !== 'api') {
      return localPlan ?? null;
    }

    syncingRef.current = true;
    try {
      const synced = await syncTravelPlanFromApi(accessToken, localPlan);
      upsertPlan(synced);
      return synced;
    } finally {
      syncingRef.current = false;
    }
  }, [enabled, accessToken, planId, upsertPlan]);

  useFocusEffect(
    useCallback(() => {
      void syncFromServer();
    }, [syncFromServer]),
  );

  return { syncFromServer };
}
