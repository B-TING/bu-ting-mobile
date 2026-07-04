import { create } from 'zustand';

import { isZoneChatWebSocketEnabled, ZONE_CHAT_WS_CONFIG } from '../constants/chat/zoneChatConfig';
import { EVENT_ZONES } from '../constants/eventZone/eventZone';
import { fetchChatRoomByZone, readChatRoomMemberCount } from '../services/chat/chatApiService';
import { zoneChatRoomStatusHub } from '../services/chat/zoneChatRoomStatusHub';
import { isSameChatRoomId, type ParsedChatRoomStatusPayload } from '../types/chatApi';
import type { EventZoneId } from '../types/eventZone';
import { logZoneChat } from '../utils/chat/zoneChatLogger';

type ZoneChatMemberState = {
  memberCountsByZone: Partial<Record<EventZoneId, number>>;
  roomIdByZone: Partial<Record<EventZoneId, string>>;
  /** 화면별 status 구독 요청 (consumerId → roomId[]) */
  _statusConsumers: Record<string, string[]>;
  /** 채팅방 WS가 status 를 직접 구독 중인 roomId (허브 이중 구독 방지) */
  _chatActiveRoomId: string | null;
  _chatActiveZoneId: EventZoneId | null;
  _hubRelease: (() => void) | null;
  _accessToken: string | null;

  hydrateAll: () => Promise<void>;
  refreshZone: (zoneId: EventZoneId) => Promise<void>;
  refreshZoneDelayed: (zoneId: EventZoneId, delayMs?: number) => void;
  adjustMemberCount: (zoneId: EventZoneId, delta: number) => void;
  reconcileMemberCountDelayed: (
    zoneId: EventZoneId,
    options?: { floor?: number; ceiling?: number; delayMs?: number },
  ) => void;
  resolveRoomId: (zoneId: EventZoneId, fallbackRoomId: string) => Promise<string>;
  applyRoomStatus: (roomId: string, currentMembers: number) => void;
  setMemberCount: (zoneId: EventZoneId, currentMembers: number, roomId?: string) => void;
  setChatActiveRoom: (zoneId: EventZoneId | null, roomId: string | null) => void;
  setStatusConsumer: (
    consumerId: string,
    roomIds: string[],
    accessToken: string | null,
  ) => void;
  clearStatusConsumer: (consumerId: string) => void;
};

function zoneIdForRoomId(
  roomId: string,
  state: Pick<ZoneChatMemberState, 'roomIdByZone' | '_chatActiveRoomId' | '_chatActiveZoneId'>,
): EventZoneId | null {
  for (const [zoneId, mappedRoomId] of Object.entries(state.roomIdByZone)) {
    if (isSameChatRoomId(mappedRoomId, roomId)) {
      return zoneId as EventZoneId;
    }
  }
  if (isSameChatRoomId(state._chatActiveRoomId, roomId) && state._chatActiveZoneId) {
    return state._chatActiveZoneId;
  }
  return null;
}

function syncStatusSubscriptions(
  get: () => ZoneChatMemberState,
  set: (partial: Partial<ZoneChatMemberState>) => void,
): void {
  get()._hubRelease?.();

  if (!isZoneChatWebSocketEnabled()) {
    set({ _hubRelease: null });
    return;
  }

  if (get()._chatActiveRoomId) {
    set({ _hubRelease: null });
    return;
  }

  const { _statusConsumers, _accessToken } = get();
  const roomIds = [...new Set(Object.values(_statusConsumers).flat().filter(Boolean))];

  if (!_accessToken || roomIds.length === 0) {
    set({ _hubRelease: null });
    return;
  }

  const release = zoneChatRoomStatusHub.retainRooms(roomIds, _accessToken);
  set({ _hubRelease: release });
}

let hubListenerAttached = false;

function ensureHubListener(get: () => ZoneChatMemberState): void {
  if (hubListenerAttached) {
    return;
  }
  hubListenerAttached = true;

  zoneChatRoomStatusHub.addListener((status: ParsedChatRoomStatusPayload) => {
    get().applyRoomStatus(status.roomId, status.currentMembers);
  });

  logZoneChat('member-store.hub', 'Status hub listener attached');
}

export const useZoneChatMemberStore = create<ZoneChatMemberState>()((set, get) => {
  ensureHubListener(get);

  return {
    memberCountsByZone: {},
    roomIdByZone: {},
    _statusConsumers: {},
    _chatActiveRoomId: null,
    _chatActiveZoneId: null,
    _hubRelease: null,
    _accessToken: null,

    hydrateAll: async () => {
      const results = await Promise.all(
        EVENT_ZONES.map(async zone => {
          try {
            const room = await fetchChatRoomByZone(zone.id);
            if (!room?.roomId) {
              return null;
            }
            return {
              zoneId: zone.id,
              roomId: room.roomId,
              memberCount: readChatRoomMemberCount(room),
            };
          } catch {
            return null;
          }
        }),
      );

      const memberCountsByZone: Partial<Record<EventZoneId, number>> = {};
      const roomIdByZone: Partial<Record<EventZoneId, string>> = {};
      for (const result of results) {
        if (!result) {
          continue;
        }
        memberCountsByZone[result.zoneId] = result.memberCount;
        roomIdByZone[result.zoneId] = result.roomId;
      }

      set({ memberCountsByZone, roomIdByZone });
    },

    refreshZone: async zoneId => {
      try {
        const room = await fetchChatRoomByZone(zoneId);
        if (!room?.roomId) {
          set(state => {
            const memberCountsByZone = { ...state.memberCountsByZone };
            const roomIdByZone = { ...state.roomIdByZone };
            delete memberCountsByZone[zoneId];
            delete roomIdByZone[zoneId];
            return { memberCountsByZone, roomIdByZone };
          });
          return;
        }

        get().setMemberCount(zoneId, readChatRoomMemberCount(room), room.roomId);
      } catch (error) {
        logZoneChat('member-store.refresh.fail', 'Failed to refresh zone member count', {
          level: 'warn',
          detail: { zoneId, error },
        });
      }
    },

    refreshZoneDelayed: (zoneId, delayMs = ZONE_CHAT_WS_CONFIG.memberCountSyncDelayMs) => {
      get().reconcileMemberCountDelayed(zoneId, { delayMs });
    },

    adjustMemberCount: (zoneId, delta) => {
      if (delta === 0) {
        return;
      }
      set(state => {
        const current = state.memberCountsByZone[zoneId] ?? 0;
        const next = Math.max(0, current + delta);
        if (next === current) {
          return state;
        }
        logZoneChat('member-store.adjust', 'Optimistic member count adjusted', {
          detail: { zoneId, delta, from: current, to: next },
        });
        return {
          memberCountsByZone: {
            ...state.memberCountsByZone,
            [zoneId]: next,
          },
        };
      });
    },

    reconcileMemberCountDelayed: (zoneId, options = {}) => {
      const delayMs = options.delayMs ?? ZONE_CHAT_WS_CONFIG.memberCountSyncDelayMs;
      const floor = options.floor;
      const ceiling = options.ceiling;

      setTimeout(() => {
        const beforeRefresh = get().memberCountsByZone[zoneId] ?? 0;
        get()
          .refreshZone(zoneId)
          .then(() => {
            const afterRefresh = get().memberCountsByZone[zoneId] ?? 0;
            const minBound = floor ?? beforeRefresh;
            const maxBound = ceiling ?? beforeRefresh;
            let next = afterRefresh;
            if (next < minBound) {
              next = minBound;
            }
            if (next > maxBound) {
              next = maxBound;
            }
            if (next !== afterRefresh) {
              get().setMemberCount(zoneId, next, get().roomIdByZone[zoneId]);
            }
          })
          .catch(() => undefined);
      }, delayMs);
    },

    resolveRoomId: async (zoneId, fallbackRoomId) => {
      await get().refreshZone(zoneId);
      return get().roomIdByZone[zoneId] ?? fallbackRoomId;
    },

    setMemberCount: (zoneId, currentMembers, roomId) => {
      set(state => ({
        memberCountsByZone: {
          ...state.memberCountsByZone,
          [zoneId]: currentMembers,
        },
        ...(roomId
          ? {
              roomIdByZone: {
                ...state.roomIdByZone,
                [zoneId]: roomId,
              },
            }
          : {}),
      }));
    },

    applyRoomStatus: (roomId, currentMembers) => {
      const state = get();
      const zoneId = zoneIdForRoomId(roomId, state);
      if (!zoneId) {
        logZoneChat('member-store.status.skip', 'Unknown roomId for status update', {
          level: 'warn',
          detail: { roomId, currentMembers },
        });
        return;
      }

      get().setMemberCount(zoneId, currentMembers, roomId);
    },

    setChatActiveRoom: (zoneId, roomId) => {
      set({
        _chatActiveZoneId: zoneId,
        _chatActiveRoomId: roomId,
      });
      syncStatusSubscriptions(get, set);
    },

    setStatusConsumer: (consumerId, roomIds, accessToken) => {
      set(state => ({
        _statusConsumers: {
          ...state._statusConsumers,
          [consumerId]: [...new Set(roomIds.filter(Boolean))],
        },
        _accessToken: accessToken ?? state._accessToken,
      }));
      syncStatusSubscriptions(get, set);
    },

    clearStatusConsumer: consumerId => {
      set(state => {
        const nextConsumers = { ...state._statusConsumers };
        delete nextConsumers[consumerId];
        return { _statusConsumers: nextConsumers };
      });
      syncStatusSubscriptions(get, set);
    },
  };
});

export function selectZoneChatMemberCount(zoneId: EventZoneId) {
  return (state: ZoneChatMemberState) => state.memberCountsByZone[zoneId] ?? null;
}

export function selectZoneChatRoomId(zoneId: EventZoneId) {
  return (state: ZoneChatMemberState) => state.roomIdByZone[zoneId] ?? null;
}

export function selectAllZoneChatMemberCounts(state: ZoneChatMemberState) {
  return state.memberCountsByZone;
}
