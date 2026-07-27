import type { PlaceContentTypeId } from './placesApi';

/** 지도·리스트 공통 장소 모델 */
export type BusanPlace = {
  id: string;
  contentId: string;
  contentTypeId: PlaceContentTypeId;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  userRatingsTotal: number;
  districtName?: string;
  imageUrl?: string;
};
