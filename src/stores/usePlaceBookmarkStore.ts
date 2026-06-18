import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PlaceBookmarkState = {
  bookmarkedAccommodationIds: string[];
  bookmarkedAttractionIds: string[];
  toggleAccommodationBookmark: (id: string) => void;
  toggleAttractionBookmark: (id: string) => void;
  isAccommodationBookmarked: (id: string) => boolean;
  isAttractionBookmarked: (id: string) => boolean;
};

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
}

export const usePlaceBookmarkStore = create<PlaceBookmarkState>()(
  persist(
    (set, get) => ({
      bookmarkedAccommodationIds: [],
      bookmarkedAttractionIds: [],
      toggleAccommodationBookmark: id =>
        set(state => ({
          bookmarkedAccommodationIds: toggleId(state.bookmarkedAccommodationIds, id),
        })),
      toggleAttractionBookmark: id =>
        set(state => ({
          bookmarkedAttractionIds: toggleId(state.bookmarkedAttractionIds, id),
        })),
      isAccommodationBookmarked: id => get().bookmarkedAccommodationIds.includes(id),
      isAttractionBookmarked: id => get().bookmarkedAttractionIds.includes(id),
    }),
    {
      name: '@buting/place-bookmarks',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        bookmarkedAccommodationIds: state.bookmarkedAccommodationIds,
        bookmarkedAttractionIds: state.bookmarkedAttractionIds,
      }),
    },
  ),
);
