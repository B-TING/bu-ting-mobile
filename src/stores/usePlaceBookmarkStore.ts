import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { PLACE_CONTENT_TYPE } from '../types/placesApi';
import type { PlaceContentTypeId } from '../types/placesApi';

type PlaceBookmarkState = {
  bookmarkedAccommodationIds: string[];
  bookmarkedAttractionIds: string[];
  bookmarkedRestaurantIds: string[];
  toggleAccommodationBookmark: (id: string) => void;
  toggleAttractionBookmark: (id: string) => void;
  togglePlaceBookmark: (contentTypeId: PlaceContentTypeId, contentId: string) => void;
  isAccommodationBookmarked: (id: string) => boolean;
  isAttractionBookmarked: (id: string) => boolean;
  isPlaceBookmarked: (contentTypeId: PlaceContentTypeId, contentId: string) => boolean;
  getBookmarkedIdsForType: (contentTypeId: PlaceContentTypeId) => string[];
};

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
}

function bookmarkKeyForType(contentTypeId: PlaceContentTypeId): keyof Pick<
  PlaceBookmarkState,
  'bookmarkedAccommodationIds' | 'bookmarkedAttractionIds' | 'bookmarkedRestaurantIds'
> {
  switch (contentTypeId) {
    case PLACE_CONTENT_TYPE.accommodation:
      return 'bookmarkedAccommodationIds';
    case PLACE_CONTENT_TYPE.restaurant:
      return 'bookmarkedRestaurantIds';
    default:
      return 'bookmarkedAttractionIds';
  }
}

export const usePlaceBookmarkStore = create<PlaceBookmarkState>()(
  persist(
    (set, get) => ({
      bookmarkedAccommodationIds: [],
      bookmarkedAttractionIds: [],
      bookmarkedRestaurantIds: [],
      toggleAccommodationBookmark: id =>
        set(state => ({
          bookmarkedAccommodationIds: toggleId(state.bookmarkedAccommodationIds, id),
        })),
      toggleAttractionBookmark: id =>
        set(state => ({
          bookmarkedAttractionIds: toggleId(state.bookmarkedAttractionIds, id),
        })),
      togglePlaceBookmark: (contentTypeId, contentId) => {
        const key = bookmarkKeyForType(contentTypeId);
        set(state => ({
          [key]: toggleId(state[key], contentId),
        }));
      },
      isAccommodationBookmarked: id => get().bookmarkedAccommodationIds.includes(id),
      isAttractionBookmarked: id => get().bookmarkedAttractionIds.includes(id),
      isPlaceBookmarked: (contentTypeId, contentId) =>
        get()[bookmarkKeyForType(contentTypeId)].includes(contentId),
      getBookmarkedIdsForType: contentTypeId => get()[bookmarkKeyForType(contentTypeId)],
    }),
    {
      name: '@buting/place-bookmarks',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        bookmarkedAccommodationIds: state.bookmarkedAccommodationIds,
        bookmarkedAttractionIds: state.bookmarkedAttractionIds,
        bookmarkedRestaurantIds: state.bookmarkedRestaurantIds,
      }),
    },
  ),
);
