import type { AppLanguage } from './user';

/** 부산 관광지 목록(지도·리스트)용 */
export type BusanAttraction = {
  id: string;
  internalPlaceId: string;
  googlePlaceId: string;
  name: string;
  categoryLabel: Record<AppLanguage, string>;
  location: { lat: number; lng: number };
  rating: number;
  userRatingsTotal: number;
  formattedAddress: string;
};
