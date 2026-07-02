import { useCallback, useEffect, useState } from 'react';

import { EVENT_ZONES } from '../constants/eventZone/eventZone';
import {
  fetchChatRoomByZone,
  readChatRoomMemberCount,
} from '../services/chat/chatApiService';
import type { EventZoneId } from '../types/eventZone';

export function useZoneChatRoomSummary(zoneId?: EventZoneId) {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!zoneId) {
      setMemberCount(null);
      setRoomId(null);
      return;
    }

    setIsLoading(true);
    try {
      const room = await fetchChatRoomByZone(zoneId);
      setRoomId(room?.roomId ?? null);
      setMemberCount(room ? readChatRoomMemberCount(room) : null);
    } catch {
      setMemberCount(null);
      setRoomId(null);
    } finally {
      setIsLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { memberCount, roomId, isLoading, refresh };
}

/** 이벤트 존 목록·홈 위젯용 — 권역별 currentMembers 일괄 조회 */
export function useAllZoneChatMemberCounts() {
  const [memberCounts, setMemberCounts] = useState<Partial<Record<EventZoneId, number>>>({});

  const refresh = useCallback(async () => {
    const results = await Promise.all(
      EVENT_ZONES.map(async zone => {
        try {
          const room = await fetchChatRoomByZone(zone.id);
          const count = room ? readChatRoomMemberCount(room) : null;
          return [zone.id, count] as const;
        } catch {
          return [zone.id, null] as const;
        }
      }),
    );

    const next: Partial<Record<EventZoneId, number>> = {};
    for (const [zoneId, count] of results) {
      if (count != null) {
        next[zoneId] = count;
      }
    }
    setMemberCounts(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { memberCounts, refresh };
}
