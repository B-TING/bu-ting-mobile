import type { PlaceProviderDto } from './travelApi';
import type { RouteItemType } from './travelPlan';

export type TravelRecordStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

export type TransportType = 'CAR' | 'PUBLIC_TRANSPORT' | 'WALK';

/**
 * Mock-only media attachments.
 * OpenAPI PlaceReview / TravelRecord schemas do not include media yet.
 */
export type ReviewMediaType = 'image' | 'video';

export type ReviewMedia = {
  mediaId: string;
  type: ReviewMediaType;
  uri: string;
  thumbnailUri?: string;
};

/** OpenAPI `PlaceReviewResponse` (+ client display/mock fields) */
export type PlaceReview = {
  placeReviewId: string;
  travelRecordPlaceId: string;
  rating: number;
  content: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Client-only: place label for local draft UI before place payload is joined */
  placeName: string;
  /** Mock attachments — not in OpenAPI yet */
  media: ReviewMedia[];
};

/** OpenAPI `TravelRecordRouteResponse` */
export type TravelRecordRoute = {
  transportType: TransportType;
  durationMinutes: number | null;
  distanceMeters: number | null;
  provider: PlaceProviderDto;
};

/** OpenAPI `TravelRecordPlaceResponse` (+ client route type for plan import) */
export type TravelRecordPlace = {
  travelRecordPlaceId: string;
  originalPlanPlaceId: string | null;
  sequence: number | null;
  placeName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  provider: PlaceProviderDto;
  providerPlaceId: string;
  durationMinutes: number | null;
  memo: string | null;
  scheduledTime: string | null;
  visited: boolean | null;
  routeToNext: TravelRecordRoute | null;
  /** Client-only: maps back to local RouteItem.type when importing a plan */
  routeItemType?: RouteItemType;
};

/** OpenAPI `TravelRecordDayResponse` */
export type TravelRecordDay = {
  travelRecordDayId: string;
  originalPlanId: string | null;
  dayNumber: number;
  visitDate: string;
  places: TravelRecordPlace[];
};

/** OpenAPI `TravelRecordCommentResponse` */
export type TravelRecordComment = {
  commentId: string;
  travelRecordId: string;
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Local social state backing likes/comments until API is wired.
 * UI should prefer `likeCount` / `likedByMe` helpers.
 */
export type TravelRecordSocial = {
  likedUserIds: string[];
  comments: TravelRecordComment[];
};

/**
 * OpenAPI `TravelRecordResponse` / feed fields used by the app.
 * `placeReviews` is a client aggregation for local detail UI.
 */
export type TravelRecord = {
  travelRecordId: string;
  originalTravelId: string | null;
  authorId: string;
  authorNickname: string;
  title: string | null;
  content: string | null;
  coverImageUrl: string | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  status: TravelRecordStatus;
  publishedAt: string | null;
  likeCount: number;
  viewCount: number;
  likedByMe?: boolean;
  days: TravelRecordDay[];
  placeReviews: PlaceReview[];
};
