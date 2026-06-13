/** Google Places API (Place Details) 연동용 타입 — 필드명은 API 응답과 맞춤 */

export type GooglePlaceReview = {
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  /** Unix timestamp (seconds) */
  time: number;
};

export type GoogleOpeningHours = {
  openNow?: boolean;
  weekdayDescriptions: string[];
};

export type AccommodationPlaceDetail = {
  /** 앱 내부 placeId (예: stay_paradise) */
  internalPlaceId: string;
  /** Google Places place_id — API 호출 시 사용 */
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  rating: number;
  userRatingsTotal: number;
  openingHours?: GoogleOpeningHours;
  website?: string;
  internationalPhoneNumber?: string;
  /** photo_reference 목록 — API 연동 시 Photo API로 URL 생성 */
  photoReferences?: string[];
  reviews: GooglePlaceReview[];
  priceLevel?: 1 | 2 | 3 | 4;
  types: string[];
  editorialSummary?: string;
};
