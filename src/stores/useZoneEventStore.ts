import { create } from 'zustand';

import type { EventZoneId, ZoneEvent } from '../types/eventZone';
import { isZoneEventActive } from '../constants/eventZone/zoneEvents';

type ZoneEventState = {
  /** 구역별 활성 이벤트 (구역당 1개) */
  activeEventsByZone: Partial<Record<EventZoneId, ZoneEvent>>;
  triggerEvent: (event: ZoneEvent) => void;
  clearEvent: (zoneId: EventZoneId) => void;
  clearAllEvents: () => void;
  getActiveEvent: (zoneId: EventZoneId) => ZoneEvent | undefined;
};

export const useZoneEventStore = create<ZoneEventState>()((set, get) => ({
  activeEventsByZone: {},
  triggerEvent: event =>
    set(state => ({
      activeEventsByZone: {
        ...state.activeEventsByZone,
        [event.zoneId]: event,
      },
    })),
  clearEvent: zoneId =>
    set(state => {
      const next = { ...state.activeEventsByZone };
      delete next[zoneId];
      return { activeEventsByZone: next };
    }),
  clearAllEvents: () => set({ activeEventsByZone: {} }),
  getActiveEvent: zoneId => {
    const event = get().activeEventsByZone[zoneId];
    if (!event) {
      return undefined;
    }
    return isZoneEventActive(event) ? event : undefined;
  },
}));
