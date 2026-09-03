import { create } from 'zustand';

import type {
  EventParticipationRecord,
  EventParticipationStatus,
} from '../types/eventParticipation';
import type { EventZoneId } from '../types/eventZone';

type EventParticipationState = {
  records: EventParticipationRecord[];
  upsertRecord: (record: EventParticipationRecord) => void;
  updateStatus: (
    id: string,
    status: EventParticipationStatus,
    patch?: Partial<Pick<EventParticipationRecord, 'localImageUri' | 'submittedAt'>>,
  ) => void;
  getByEventId: (eventId: string) => EventParticipationRecord | undefined;
  listByZone: (zoneId: EventZoneId) => EventParticipationRecord[];
  clearAll: () => void;
};

export const useEventParticipationStore = create<EventParticipationState>()(
  (set, get) => ({
    records: [],
    upsertRecord: record =>
      set(state => {
        const index = state.records.findIndex(item => item.id === record.id);
        if (index < 0) {
          return { records: [record, ...state.records] };
        }
        const next = [...state.records];
        next[index] = record;
        return { records: next };
      }),
    updateStatus: (id, status, patch) =>
      set(state => ({
        records: state.records.map(item =>
          item.id === id ? { ...item, ...patch, status } : item,
        ),
      })),
    getByEventId: eventId =>
      get().records.find(item => item.eventId === eventId),
    listByZone: zoneId => get().records.filter(item => item.zoneId === zoneId),
    clearAll: () => set({ records: [] }),
  }),
);
