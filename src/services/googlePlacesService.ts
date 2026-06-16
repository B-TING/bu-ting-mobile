import {
  ACCOMMODATION_MOCK_DETAILS,
  buildBusanAccommodationListings,
  getAccommodationMockDetail,
  localizedAccommodationName,
  resolveAccommodationPlaceId,
} from '../constants/accommodation';
import type { BusanAccommodation } from '../types/accommodation';
import type { AccommodationPlaceDetail, GooglePlaceDetailsResponse, PlaceDetailVO } from '../types/googlePlaces';
import type { AppLanguage } from '../types/user';
import { mapGooglePlaceDetailsResponse } from '../utils/googlePlacesMapper';

export { mapGooglePlaceDetailsResponse, toPlaceInfo, toPlaceListItem } from '../utils/googlePlacesMapper';

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * 부산 숙소 목록 — Google Places Text Search / Nearby Search 연동 예정.
 * 현재는 ACCOMMODATION_SEARCH + 목업 평점 데이터를 반환합니다.
 */
export async function fetchBusanAccommodations(
  language: AppLanguage = 'ko',
): Promise<BusanAccommodation[]> {
  await delay(200);
  return buildBusanAccommodationListings().map(stay => ({
    ...stay,
    name: localizedAccommodationName(stay, language),
  }));
}

/**
 * Google Places Place Details API 연동 예정.
 * 현재는 ACCOMMODATION_MOCK_DETAILS 목업을 반환합니다.
 *
 * 연동 시: fields=place_id,name,rating,user_ratings_total,reviews,formatted_address,
 * opening_hours,international_phone_number,website,photos,price_level,types
 */
export async function fetchAccommodationDetail(
  placeId: string,
): Promise<AccommodationPlaceDetail | null> {
  await delay(250);
  return getAccommodationMockDetail(placeId);
}

/**
 * Google Places Place Details API 연동 시 사용.
 * 백엔드가 Google 응답 JSON을 그대로 내려주거나, 앱이 Places API를 직접 호출할 때 map 후 반환.
 */
export async function fetchPlaceDetailFromGoogleResponse(
  response: GooglePlaceDetailsResponse,
  options?: { internalPlaceId?: string },
): Promise<PlaceDetailVO | null> {
  await delay(100);
  return mapGooglePlaceDetailsResponse(response, options);
}

export function buildGoogleMapsUrl(detail: AccommodationPlaceDetail): string {
  const { googlePlaceId, name, location } = detail;
  const query = encodeURIComponent(name);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${googlePlaceId}&center=${location.lat},${location.lng}`;
}

export function listKnownAccommodationPlaceIds(): string[] {
  return Object.keys(ACCOMMODATION_MOCK_DETAILS);
}

export { resolveAccommodationPlaceId };
