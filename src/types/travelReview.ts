import type { RouteItemType } from './travelPlan';

export type ReviewMediaType = 'image' | 'video';

export type ReviewMedia = {
  mediaId: string;
  type: ReviewMediaType;
  uri: string;
  thumbnailUri?: string;
};

/** 여행지별 후기 */
export type PlaceReview = {
  reviewId: string;
  planId: string;
  routeItemId: string;
  placeId: string;
  placeName: string;
  rating: number;
  tags: string[];
  comment: string;
  media: ReviewMedia[];
  createdAt: string;
  updatedAt: string;
};

/** 여행기에 저장되는 일정 스냅샷 */
export type TravelogueRouteSnapshot = {
  itemId: string;
  sequence: number;
  placeId: string;
  placeName: string;
  type: RouteItemType;
  location: { lat: number; lng: number };
  isVisited: boolean;
};

export type TravelogueDaySnapshot = {
  dayNumber: number;
  date: string;
  routes: TravelogueRouteSnapshot[];
};

/** 게시된 종합 여행기 */
export type Travelogue = {
  travelogueId: string;
  planId: string;
  title: string;
  authorName: string;
  authorId: string;
  overallRating: number;
  overallReview: string;
  placeReviews: PlaceReview[];
  destinationLabel: string;
  startDate?: string;
  endDate?: string;
  itinerary?: TravelogueDaySnapshot[];
  /** true면 피드에 공개, false면 본인만 조회 */
  isPublic: boolean;
  publishedAt: string;
};
