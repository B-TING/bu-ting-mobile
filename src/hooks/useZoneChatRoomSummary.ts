import { useEffect, useId } from 'react';

import { isZoneChatWebSocketEnabled } from '../constants/chat/zoneChatConfig';
import { EVENT_ZONES } from '../constants/eventZone/eventZone';
import { selectReusableAccessToken, useAuthStore } from '../stores/useAuthStore';
import {
  selectAllZoneChatMemberCounts,
  selectZoneChatMemberCount,
  selectZoneChatRoomId,
  useZoneChatMemberStore,
} from '../stores/useZoneChatMemberStore';
import type { EventZoneId } from '../types/eventZone';

function useZoneChatStatusSubscription(roomIds: string[]): void {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const realtimeEnabled = isZoneChatWebSocketEnabled();
  const consumerId = useId();
  const setStatusConsumer = useZoneChatMemberStore(state => state.setStatusConsumer);
  const clearStatusConsumer = useZoneChatMemberStore(state => state.clearStatusConsumer);
  const roomIdsKey = roomIds.filter(Boolean).sort().join('|');

  useEffect(() => {
    if (!realtimeEnabled || !accessToken || !roomIdsKey) {
      clearStatusConsumer(consumerId);
      return undefined;
    }

    setStatusConsumer(consumerId, roomIdsKey.split('|'), accessToken);
    return () => {
      clearStatusConsumer(consumerId);
    };
  }, [
    accessToken,
    clearStatusConsumer,
    consumerId,
    realtimeEnabled,
    roomIdsKey,
    setStatusConsumer,
  ]);
}

/** 홈 위젯 등 — 권역 1개 인원 수 (REST 초기값 + 목록용 status 허브) */
export function useZoneChatRoomSummary(zoneId?: EventZoneId) {
  const memberCount = useZoneChatMemberStore(
    zoneId ? selectZoneChatMemberCount(zoneId) : () => null,
  );
  const roomId = useZoneChatMemberStore(zoneId ? selectZoneChatRoomId(zoneId) : () => null);
  const refreshZone = useZoneChatMemberStore(state => state.refreshZone);

  useEffect(() => {
    if (!zoneId) {
      return;
    }
    const { roomIdByZone } = useZoneChatMemberStore.getState();
    if (!roomIdByZone[zoneId]) {
      refreshZone(zoneId).catch(() => undefined);
    }
  }, [refreshZone, zoneId]);

  useZoneChatStatusSubscription(roomId ? [roomId] : []);

  return { memberCount };
}

/** 이벤트 존 목록 — 권역별 currentMembers 전역 상태 */
export function useAllZoneChatMemberCounts() {
  const memberCounts = useZoneChatMemberStore(selectAllZoneChatMemberCounts);
  const roomIdByZone = useZoneChatMemberStore(state => state.roomIdByZone);
  const hydrateAll = useZoneChatMemberStore(state => state.hydrateAll);

  useEffect(() => {
    const { roomIdByZone: cached } = useZoneChatMemberStore.getState();
    if (Object.keys(cached).length < EVENT_ZONES.length) {
      hydrateAll().catch(() => undefined);
    }
  }, [hydrateAll]);

  const activeRoomIds = Object.values(roomIdByZone).filter((id): id is string => Boolean(id));
  useZoneChatStatusSubscription(activeRoomIds);

  return { memberCounts };
}
