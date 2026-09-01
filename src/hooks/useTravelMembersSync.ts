import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { syncTravelMembersToPlan } from '../services/travel/syncTravelMembersToPlan';

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
  const syncMembers = useCallback(async () => {
    if (!enabled || !accessToken || !travelId || !planId) {
      return;
    }
    await syncTravelMembersToPlan(accessToken, travelId, planId);
  }, [accessToken, enabled, planId, travelId]);

  useFocusEffect(
    useCallback(() => {
      void syncMembers();
    }, [syncMembers]),
  );

  return { syncMembers };
}
