import type { RouteItemType } from './travelPlan';

// ---------------------------------------------------------------------------
// Google Places API (New) — Place Details raw response
// 필드명·중첩 구조는 API JSON과 동일하게 유지 (백엔드 DTO / 캐시 스키마 참고용)
// ---------------------------------------------------------------------------

export type GoogleLocalizedText = {
  text: string;
  languageCode: string;
};

export type GoogleLatLng = {
  latitude: number;
  longitude: number;
};

export type GoogleViewport = {
  low: GoogleLatLng;
  high: GoogleLatLng;
};

export type GoogleAddressComponent = {
  longText: string;
  shortText: string;
  types: string[];
  languageCode: string;
};

export type GooglePlusCode = {
  globalCode: string;
  compoundCode?: string;
};

export type GoogleOpeningHoursPoint = {
  day: number;
  hour: number;
  minute: number;
  date?: { year: number; month: number; day: number };
};

export type GoogleOpeningHoursPeriod = {
  open: GoogleOpeningHoursPoint;
  close?: GoogleOpeningHoursPoint;
};

export type GoogleOpeningHours = {
  openNow?: boolean;
  periods?: GoogleOpeningHoursPeriod[];
  weekdayDescriptions?: string[];
  nextCloseTime?: string;
};

export type GoogleAuthorAttribution = {
  displayName: string;
  uri?: string;
  photoUri?: string;
};

/** Places API (New) reviews[] 항목 */
export type GooglePlaceReviewRaw = {
  name: string;
  relativePublishTimeDescription?: string;
  rating: number;
  text?: GoogleLocalizedText;
  originalText?: GoogleLocalizedText;
  authorAttribution: GoogleAuthorAttribution;
  publishTime?: string;
  flagContentUri?: string;
  googleMapsUri?: string;
};

export type GooglePlacePhotoRaw = {
  name: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: GoogleAuthorAttribution[];
  flagContentUri?: string;
  googleMapsUri?: string;
};

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

export type GooglePostalAddress = {
  regionCode?: string;
  languageCode?: string;
  postalCode?: string;
  administrativeArea?: string;
  locality?: string;
  addressLines?: string[];
};

export type GoogleMapsLinks = {
  directionsUri?: string;
  placeUri?: string;
  writeAReviewUri?: string;
  reviewsUri?: string;
  photosUri?: string;
};

export type GoogleTimeZone = {
  id: string;
};

export type GoogleAddressDescriptorLandmark = {
  name: string;
  placeId: string;
  displayName: GoogleLocalizedText;
  types: string[];
  straightLineDistanceMeters?: number;
};

export type GoogleAddressDescriptorArea = {
  name: string;
  placeId: string;
  displayName: GoogleLocalizedText;
  containment?: string;
};

export type GoogleAddressDescriptor = {
  landmarks?: GoogleAddressDescriptorLandmark[];
  areas?: GoogleAddressDescriptorArea[];
};

/**
 * GET places/{placeId} (FieldMask 전체) 응답 VO.
 * @example 자갈치시장 — placeId `ChIJudkrFArpaDURbbCzajeQs0c`
 */
export type GooglePlaceDetailsResponse = {
  name: string;
  id: string;
  types: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  plusCode?: GooglePlusCode;
  location?: GoogleLatLng;
  viewport?: GoogleViewport;
  rating?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  regularOpeningHours?: GoogleOpeningHours;
  currentOpeningHours?: GoogleOpeningHours;
  utcOffsetMinutes?: number;
  adrFormatAddress?: string;
  businessStatus?: string;
  userRatingCount?: number;
  iconMaskBaseUri?: string;
  iconBackgroundColor?: string;
  displayName?: GoogleLocalizedText;
  primaryType?: string;
  primaryTypeDisplayName?: GoogleLocalizedText;
  googleMapsTypeLabel?: GoogleLocalizedText;
  editorialSummary?: GoogleLocalizedText;
  reviews?: GooglePlaceReviewRaw[];
  photos?: GooglePlacePhotoRaw[];
  priceLevel?: string;
  delivery?: boolean;
  dineIn?: boolean;
  takeout?: boolean;
  reservable?: boolean;
  restroom?: boolean;
  paymentOptions?: GooglePaymentOptions;
  parkingOptions?: GoogleParkingOptions;
  accessibilityOptions?: GoogleAccessibilityOptions;
  pureServiceAreaBusiness?: boolean;
  addressDescriptor?: GoogleAddressDescriptor;
  googleMapsLinks?: GoogleMapsLinks;
  timeZone?: GoogleTimeZone;
  postalAddress?: GooglePostalAddress;
};

// ---------------------------------------------------------------------------
// App domain VOs — UI·일정·백엔드 내부 API 공통 표현
// ---------------------------------------------------------------------------

/** 앱에서 구분하는 장소 유형 (Google types → 앱 도메인) */
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
  tourismInfoRows?: { label: string; value: string }[];
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
