import { create } from 'zustand';

import {
  bookmarkTravelRecord,
  fetchMyTravelRecordBookmarks,
  removeTravelRecordBookmark,
} from '../services/travel/travelRecordService';
import { mapTravelRecordBookmarkItem } from '../types/travelRecordApi';
import type { TravelRecord } from '../types/travelReview';

type TravelRecordBookmarkState = {
  bookmarkedIds: string[];
  bookmarkedRecords: TravelRecord[];
  loading: boolean;
  hydratedForToken: string | null;
  hydrate: (accessToken: string | null | undefined) => Promise<void>;
  isBookmarked: (travelRecordId: string) => boolean;
  toggleBookmark: (
    accessToken: string,
    travelRecordId: string,
  ) => Promise<boolean>;
  reset: () => void;
};

export const useTravelRecordBookmarkStore = create<TravelRecordBookmarkState>(
  (set, get) => ({
    bookmarkedIds: [],
    bookmarkedRecords: [],
    loading: false,
    hydratedForToken: null,

    hydrate: async accessToken => {
      if (!accessToken?.trim()) {
        set({
          bookmarkedIds: [],
          bookmarkedRecords: [],
          loading: false,
          hydratedForToken: null,
        });
        return;
      }

      if (get().loading && get().hydratedForToken === accessToken) {
        return;
      }

      set({ loading: true });
      try {
        const list = await fetchMyTravelRecordBookmarks(accessToken);
        const records = list.map(mapTravelRecordBookmarkItem);
        set({
          bookmarkedIds: records.map(record => record.travelRecordId),
          bookmarkedRecords: records,
          hydratedForToken: accessToken,
        });
      } catch {
        set({
          bookmarkedIds: [],
          bookmarkedRecords: [],
          hydratedForToken: accessToken,
        });
      } finally {
        set({ loading: false });
      }
    },

    isBookmarked: travelRecordId => get().bookmarkedIds.includes(travelRecordId),

    toggleBookmark: async (accessToken, travelRecordId) => {
      const wasBookmarked = get().bookmarkedIds.includes(travelRecordId);
      const nextBookmarked = !wasBookmarked;

      set(state => ({
        bookmarkedIds: nextBookmarked
          ? [...state.bookmarkedIds, travelRecordId]
          : state.bookmarkedIds.filter(id => id !== travelRecordId),
        bookmarkedRecords: nextBookmarked
          ? state.bookmarkedRecords
          : state.bookmarkedRecords.filter(
              record => record.travelRecordId !== travelRecordId,
            ),
      }));

      try {
        if (wasBookmarked) {
          await removeTravelRecordBookmark(accessToken, travelRecordId);
        } else {
          const created = await bookmarkTravelRecord(accessToken, travelRecordId);
          const record = mapTravelRecordBookmarkItem(created);
          set(state => ({
            bookmarkedRecords: state.bookmarkedRecords.some(
              item => item.travelRecordId === travelRecordId,
            )
              ? state.bookmarkedRecords
              : [...state.bookmarkedRecords, record],
          }));
        }
        return nextBookmarked;
      } catch (error) {
        set(state => ({
          bookmarkedIds: wasBookmarked
            ? [...state.bookmarkedIds, travelRecordId]
            : state.bookmarkedIds.filter(id => id !== travelRecordId),
        }));
        throw error;
      }
    },

    reset: () => {
      set({
        bookmarkedIds: [],
        bookmarkedRecords: [],
        loading: false,
        hydratedForToken: null,
      });
    },
  }),
);
