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
  /** true면 피드에 공개, false면 본인만 조회 */
  isPublic: boolean;
  publishedAt: string;
};
