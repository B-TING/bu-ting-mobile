import { create } from 'zustand';

import type {
  EventParticipationRecord,
  EventParticipationStatus,
} from '../types/eventParticipation';
import type { EventZoneId, ZoneEvent } from '../types/eventZone';

type EventParticipationState = {
  records: EventParticipationRecord[];
  upsertRecord: (record: EventParticipationRecord) => void;
  updateStatus: (
    id: string,
    status: EventParticipationStatus,
    patch?: Partial<Pick<EventParticipationRecord, 'localImageUri' | 'submittedAt'>>,
  ) => void;
  beginParticipation: (event: ZoneEvent) => 'ok' | 'blocked';
  submitForReview: (event: ZoneEvent, localImageUri: string) => void;
  getByEventId: (eventId: string) => EventParticipationRecord | undefined;
  listAll: () => EventParticipationRecord[];
  listByZone: (zoneId: EventZoneId) => EventParticipationRecord[];
  clearAll: () => void;
};

function createParticipationId(): string {
  return `ep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPhase1AuthEvent(
  event: ZoneEvent,
): event is ZoneEvent & { type: 'place_auth' | 'object_sight' } {
  return event.type === 'place_auth' || event.type === 'object_sight';
}

function sortRecordsNewestFirst(
  records: EventParticipationRecord[],
): EventParticipationRecord[] {
  return [...records].sort((a, b) => {
    const aTime = Date.parse(a.submittedAt ?? a.createdAt);
    const bTime = Date.parse(b.submittedAt ?? b.createdAt);
    return bTime - aTime;
  });
}

export const useEventParticipationStore = create<EventParticipationState>()(
  (set, get) => ({
    records: [],
    upsertRecord: record =>
      set(state => {
        const index = state.records.findIndex(
          item => item.id === record.id || item.eventId === record.eventId,
        );
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
    beginParticipation: event => {
      if (!isPhase1AuthEvent(event)) {
        return 'blocked';
      }

      const existing = get().getByEventId(event.id);
      if (
        existing &&
        existing.status !== 'in_progress'
      ) {
        return 'blocked';
      }

      const now = new Date().toISOString();
      get().upsertRecord({
        id: existing?.id ?? createParticipationId(),
        eventId: event.id,
        zoneId: event.zoneId,
        eventType: event.type,
        eventTitleKo: event.titleKo,
        status: 'in_progress',
        localImageUri: existing?.localImageUri,
        createdAt: existing?.createdAt ?? now,
        submittedAt: existing?.submittedAt,
      });
      return 'ok';
    },
    submitForReview: (event, localImageUri) => {
      if (!isPhase1AuthEvent(event)) {
        return;
      }

      const existing = get().getByEventId(event.id);
      const now = new Date().toISOString();
      get().upsertRecord({
        id: existing?.id ?? createParticipationId(),
        eventId: event.id,
        zoneId: event.zoneId,
        eventType: event.type,
        eventTitleKo: event.titleKo,
        status: 'pending_review',
        localImageUri,
        createdAt: existing?.createdAt ?? now,
        submittedAt: now,
      });
    },
    getByEventId: eventId =>
      get().records.find(item => item.eventId === eventId),
    listAll: () => sortRecordsNewestFirst(get().records),
    listByZone: zoneId =>
      sortRecordsNewestFirst(
        get().records.filter(item => item.zoneId === zoneId),
      ),
    clearAll: () => set({ records: [] }),
  }),
);
