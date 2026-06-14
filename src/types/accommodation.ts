import type { AppLanguage } from './user';

/** 부산 숙소 목록(지도·리스트)용 — 평점·리뷰 수는 Google Places API에서 채움 */
export type BusanAccommodation = {
  id: string;
  internalPlaceId: string;
  googlePlaceId: string;
  name: string;
  areaId: string;
  areaLabel: Record<AppLanguage, string>;
  location: { lat: number; lng: number };
  rating: number;
  userRatingsTotal: number;
  formattedAddress: string;
  priceLevel?: 1 | 2 | 3 | 4;
  stayType: string;
};
