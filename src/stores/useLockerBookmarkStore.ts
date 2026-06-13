import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LockerBookmarkState = {
  bookmarkedStationIds: string[];
  toggleBookmark: (stationId: string) => void;
  isBookmarked: (stationId: string) => boolean;
};

export const useLockerBookmarkStore = create<LockerBookmarkState>()(
  persist(
    (set, get) => ({
      bookmarkedStationIds: [],
      toggleBookmark: stationId =>
        set(state => {
          const exists = state.bookmarkedStationIds.includes(stationId);
          return {
            bookmarkedStationIds: exists
              ? state.bookmarkedStationIds.filter(id => id !== stationId)
              : [...state.bookmarkedStationIds, stationId],
          };
        }),
      isBookmarked: stationId => get().bookmarkedStationIds.includes(stationId),
    }),
    {
      name: '@buting/locker-bookmarks',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ bookmarkedStationIds: state.bookmarkedStationIds }),
    },
  ),
);
