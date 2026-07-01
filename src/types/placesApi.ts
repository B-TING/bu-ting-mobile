/** 한국관광공사 관광타입 ID (부산 areaBasedList2) */
export const PLACE_CONTENT_TYPE = {
  attraction: '12',
  culture: '14',
  festival: '15',
  course: '25',
  leisure: '28',
  accommodation: '32',
  shopping: '38',
  restaurant: '39',
} as const;

export type PlaceContentTypeId =
  | typeof PLACE_CONTENT_TYPE.attraction
  | typeof PLACE_CONTENT_TYPE.accommodation
  | typeof PLACE_CONTENT_TYPE.restaurant;

export const PLACE_MAP_SEARCH_TYPES: PlaceContentTypeId[] = [
  PLACE_CONTENT_TYPE.attraction,
  PLACE_CONTENT_TYPE.accommodation,
  PLACE_CONTENT_TYPE.restaurant,
];

export type TourApiDistrictCode =
  | '110'
  | '140'
  | '170'
  | '200'
  | '230'
  | '260'
  | '290'
  | '320'
  | '350'
  | '380'
  | '410'
  | '440'
  | '470'
  | '500'
  | '530'
  | '710';

/** GET /api/v1/places 목록 항목 (백엔드 표시용 필드) */
export type PlaceSearchItemDto = {
  contentId: string;
  contentTypeId: string;
  title: string;
  address?: string;
  lat?: number;
  lng?: number;
  mapx?: number | string;
  mapy?: number | string;
  imageUrl?: string;
  firstImage?: string;
  districtName?: string;
  rating?: number;
  reviewCount?: number;
  userRatingCount?: number;
};

export type PlaceSearchResponseDto = {
  items?: PlaceSearchItemDto[];
  content?: PlaceSearchItemDto[];
  page?: number;
  size?: number;
  totalCount?: number;
  total?: number;
};

export type PlaceDetailReviewDto = {
  authorName?: string;
  rating?: number;
  text?: string;
  relativePublishTimeDescription?: string;
  publishTime?: string;
};

export type PlaceDetailOpeningHoursDto = {
  openNow?: boolean;
  weekdayDescriptions?: string[];
};

/** GET /api/v1/places/{contentId}/detail */
export type PlaceDetailResponseDto = {
  contentId: string;
  contentTypeId: string;
  title: string;
  address?: string;
  lat?: number;
  lng?: number;
  mapx?: number | string;
  mapy?: number | string;
  details?: Record<string, string>;
  rating?: number;
  reviewCount?: number;
  userRatingCount?: number;
  priceLevel?: number;
  googlePlaceId?: string;
  phone?: string;
  phones?: string[];
  openingHours?: PlaceDetailOpeningHoursDto;
  reviews?: PlaceDetailReviewDto[];
};
