/**
 * 한국관광공사(TourAPI) contentTypeId
 * 12 관광지 · 14 문화시설 · 15 축제·공연·행사 · 25 여행코스
 * 28 레포츠 · 32 숙박 · 38 쇼핑 · 39 음식점
 */
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
  (typeof PLACE_CONTENT_TYPE)[keyof typeof PLACE_CONTENT_TYPE];

/** 지도·픽 모달 검색 칩 — TourAPI 정의 순서 */
export const PLACE_MAP_SEARCH_TYPES: PlaceContentTypeId[] = [
  PLACE_CONTENT_TYPE.attraction,
  PLACE_CONTENT_TYPE.culture,
  PLACE_CONTENT_TYPE.festival,
  PLACE_CONTENT_TYPE.course,
  PLACE_CONTENT_TYPE.leisure,
  PLACE_CONTENT_TYPE.accommodation,
  PLACE_CONTENT_TYPE.shopping,
  PLACE_CONTENT_TYPE.restaurant,
];

export const ALL_PLACE_CONTENT_TYPE_IDS: ReadonlySet<string> = new Set(
  PLACE_MAP_SEARCH_TYPES,
);

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
  contentId: string | number;
  contentTypeId: string | number;
  title: string;
  address?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  mapx?: number | string;
  mapy?: number | string;
  imageUrl?: string;
  thumbnailUrl?: string;
  firstImage?: string;
  districtName?: string;
  districtCode?: string;
  regionCode?: string;
  rating?: number;
  reviewCount?: number;
  userRatingCount?: number;
};

export type PlaceSearchResponseDto = {
  items?: PlaceSearchItemDto[];
  content?: PlaceSearchItemDto[];
  places?: PlaceSearchItemDto[];
  page?: number;
  size?: number;
  totalCount?: number;
  total?: number;
};

/** GET /api/v1/places/search arrange (searchKeyword2) */
export type PlaceKeywordArrange = 'A' | 'C' | 'D' | 'O' | 'Q' | 'R';

/** GET /api/v1/places/festivals 목록 항목 */
export type FestivalSearchItemDto = {
  contentId: string;
  contentTypeId: string;
  title: string;
  address?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  districtCode?: string;
  eventStartDate: string;
  eventEndDate?: string;
};

export type FestivalSearchResponseDto = {
  eventStartDate: string;
  eventEndDate?: string;
  page: number;
  size: number;
  totalCount: number;
  festivals: FestivalSearchItemDto[];
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

export type PlaceGooglePlaceDto = {
  placeId?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: string | number;
  openingHours?: string[];
  reviews?: PlaceDetailReviewDto[];
};

/** GET /api/v1/places/{contentId}/detail */
export type PlaceDetailResponseDto = {
  contentId: string;
  contentTypeId: string;
  title?: string;
  address?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  firstImage?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  mapx?: number | string;
  mapy?: number | string;
  details?: Record<string, string>;
  googlePlace?: PlaceGooglePlaceDto | null;
  rating?: number;
  reviewCount?: number;
  userRatingCount?: number;
  priceLevel?: number | string;
  googlePlaceId?: string;
  phone?: string;
  phones?: string[];
  openingHours?: PlaceDetailOpeningHoursDto | string[];
  reviews?: PlaceDetailReviewDto[];
};
