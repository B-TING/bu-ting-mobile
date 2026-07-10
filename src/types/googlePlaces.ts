import type { RouteItemType } from './travelPlan';

export type GooglePaymentOptions = {
  acceptsCreditCards?: boolean;
  acceptsDebitCards?: boolean;
  acceptsCashOnly?: boolean;
  acceptsNfc?: boolean;
};

export type GoogleParkingOptions = {
  freeParkingLot?: boolean;
  paidParkingLot?: boolean;
  freeStreetParking?: boolean;
  paidStreetParking?: boolean;
  valetParking?: boolean;
  freeGarageParking?: boolean;
  paidGarageParking?: boolean;
};

export type GoogleAccessibilityOptions = {
  wheelchairAccessibleParking?: boolean;
  wheelchairAccessibleEntrance?: boolean;
  wheelchairAccessibleRestroom?: boolean;
  wheelchairAccessibleSeating?: boolean;
};

export type GoogleMapsLinks = {
  directionsUri?: string;
  placeUri?: string;
  writeAReviewUri?: string;
  reviewsUri?: string;
  photosUri?: string;
};

/** 앱에서 구분하는 장소 유형 */
export type PlaceKind =
  | 'attraction'
  | 'accommodation'
  | 'restaurant'
  | 'market'
  | 'locker'
  | 'other';

export type PlaceGeoPoint = {
  lat: number;
  lng: number;
};

export type PlaceOpeningHoursVO = {
  openNow?: boolean;
  weekdayDescriptions: string[];
  nextCloseTime?: string;
};

export type PlaceReviewVO = {
  /** Google review resource name */
  reviewId?: string;
  authorName: string;
  authorPhotoUrl?: string;
  authorUri?: string;
  rating: number;
  text: string;
  languageCode?: string;
  relativePublishTimeDescription?: string;
  /** ISO 8601 */
  publishTime?: string;
};

export type PlacePhotoVO = {
  /** Google photo resource name — Photo API 호출 키 */
  photoResourceName: string;
  widthPx?: number;
  heightPx?: number;
  googleMapsUri?: string;
  authorName?: string;
};

export type PlaceAmenitiesVO = {
  delivery?: boolean;
  dineIn?: boolean;
  takeout?: boolean;
  reservable?: boolean;
  restroom?: boolean;
  paymentOptions?: GooglePaymentOptions;
  parkingOptions?: GoogleParkingOptions;
  accessibilityOptions?: GoogleAccessibilityOptions;
};

/** 목록·지도 핀용 요약 VO */
export type PlaceListItemVO = {
  googlePlaceId: string;
  /** 앱 카탈로그 ID (tour_jagalchi, stay_paradise 등) */
  internalPlaceId?: string;
  name: string;
  kind: PlaceKind;
  primaryType?: string;
  primaryTypeLabel?: string;
  formattedAddress: string;
  location: PlaceGeoPoint;
  rating?: number;
  userRatingCount?: number;
  openNow?: boolean;
  thumbnailPhotoResourceName?: string;
  googleMapsUri?: string;
};

/** 상세 시트·장소 상세 화면용 VO (관광지·숙소·식당 공통) */
export type PlaceDetailVO = {
  googlePlaceId: string;
  internalPlaceId?: string;
  name: string;
  displayNameLanguageCode?: string;
  kind: PlaceKind;
  googleTypes: string[];
  primaryType?: string;
  primaryTypeLabel?: string;
  googleMapsTypeLabel?: string;
  formattedAddress: string;
  shortFormattedAddress?: string;
  location: PlaceGeoPoint;
  viewport?: {
    low: PlaceGeoPoint;
    high: PlaceGeoPoint;
  };
  rating?: number;
  userRatingCount?: number;
  phones?: {
    national?: string;
    international?: string;
  };
  websiteUri?: string;
  googleMapsUri?: string;
  googleMapsLinks?: GoogleMapsLinks;
  openingHours?: PlaceOpeningHoursVO;
  editorialSummary?: string;
  /** 한국관광공사 detailIntro 필드 (체크인, 주차 등) */
  tourismInfoRows?: { key: string; label: string; value: string }[];
  /** 상세 시트에서 언어별 라벨 재생성용 */
  tourismRawDetails?: Record<string, string>;
  reviews: PlaceReviewVO[];
  photos: PlacePhotoVO[];
  amenities?: PlaceAmenitiesVO;
  plusCode?: string;
  timeZoneId?: string;
  businessStatus?: string;
  priceLevel?: number;
  postalCode?: string;
  administrativeArea?: string;
  locality?: string;
  /** 관광공사·목록 API 대표 이미지 */
  imageUrl?: string;
};

/** 숙소 상세 — internalPlaceId 필수 */
export type AccommodationPlaceDetail = PlaceDetailVO & {
  internalPlaceId: string;
  kind: 'accommodation';
};

/** 관광지·명소 상세 */
export type AttractionPlaceDetail = PlaceDetailVO & {
  kind: 'attraction' | 'market' | 'restaurant';
};

/**
 * @deprecated PlaceReviewVO 사용. 기존 숙소 목업·UI 호환용 alias.
 */
export type GooglePlaceReview = PlaceReviewVO & {
  /** @deprecated publishTime(ISO) 사용 */
  time?: number;
  relativeTimeDescription?: string;
};

/** RouteItem.type 매핑 헬퍼용 */
export const PLACE_KIND_TO_ROUTE_TYPE: Record<PlaceKind, RouteItemType> = {
  attraction: 'ATTRACTION',
  market: 'RESTAURANT',
  restaurant: 'RESTAURANT',
  accommodation: 'ACCOMMODATION',
  locker: 'LOCKER',
  other: 'ATTRACTION',
};
