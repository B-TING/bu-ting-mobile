import {
  ACCOMMODATION_MOCK_DETAILS,
  buildBusanAccommodationListings,
  getAccommodationMockDetail,
  localizedAccommodationName,
  resolveAccommodationPlaceId,
} from '../../constants/accommodation';
import {
  buildBusanAttractionListings,
  localizedAttractionName,
} from '../../constants/attractions';
import {
  ATTRACTION_MOCK_DETAILS,
  getAttractionMockDetail,
  resolveAttractionPlaceId,
} from '../../constants/attractionPlaces';
import type { BusanAccommodation } from '../../types/accommodation';
import type { BusanAttraction } from '../../types/attraction';
import type {
  AccommodationPlaceDetail,
  AttractionPlaceDetail,
  GooglePlaceDetailsResponse,
  PlaceDetailVO,
} from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import type { RouteItemType } from '../../types/travelPlan';
import { mapGooglePlaceDetailsResponse } from '../../utils/googlePlacesMapper';

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

/** 지도 화면용 부산 숙소 목록 — Google Places 연동 예정 */
export async function fetchBusanAccommodations(
  language: AppLanguage = 'ko',
): Promise<BusanAccommodation[]> {
  await delay(200);
  return buildBusanAccommodationListings().map(stay => ({
    ...stay,
    name: localizedAccommodationName(stay, language),
  }));
}

/** 지도 화면용 부산 관광지 목록 — Google Places 연동 예정 */
export async function fetchBusanAttractions(
  language: AppLanguage = 'ko',
): Promise<BusanAttraction[]> {
  await delay(200);
  return buildBusanAttractionListings().map(attraction => ({
    ...attraction,
    name: localizedAttractionName(attraction, language),
  }));
}

/** 숙소 상세 (지도 마커 탭 시) — Google Places Place Details 연동 예정 */
export async function fetchAccommodationDetail(
  placeId: string,
): Promise<AccommodationPlaceDetail | null> {
  await delay(250);
  return getAccommodationMockDetail(placeId);
}

/** 관광지 상세 (지도 마커 탭 시) — Google Places Place Details 연동 예정 */
export async function fetchAttractionDetail(
  placeId: string,
): Promise<AttractionPlaceDetail | null> {
  await delay(250);
  return getAttractionMockDetail(placeId);
}

export function shouldFetchGooglePlaceDetail(type: RouteItemType): boolean {
  return type === 'ATTRACTION' || type === 'RESTAURANT';
}

/** 일정 경로 장소 상세 (RouteMapView + PlaceDetailModal) */
export async function fetchRoutePlaceDetail(
  placeId: string,
  type: RouteItemType,
): Promise<PlaceDetailVO | null> {
  if (!shouldFetchGooglePlaceDetail(type)) {
    return null;
  }
  return fetchAttractionDetail(placeId);
}

export async function fetchPlaceDetailFromGoogleResponse(
  response: GooglePlaceDetailsResponse,
  options?: { internalPlaceId?: string },
): Promise<PlaceDetailVO | null> {
  await delay(100);
  return mapGooglePlaceDetailsResponse(response, options);
}

export function buildGoogleMapsUrl(
  detail: Pick<PlaceDetailVO, 'googlePlaceId' | 'name' | 'location'>,
): string {
  const { googlePlaceId, name, location } = detail;
  const query = encodeURIComponent(name);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${googlePlaceId}&center=${location.lat},${location.lng}`;
}

export function listKnownAccommodationPlaceIds(): string[] {
  return Object.keys(ACCOMMODATION_MOCK_DETAILS);
}

export function listKnownAttractionPlaceIds(): string[] {
  return Object.keys(ATTRACTION_MOCK_DETAILS);
}

export { resolveAccommodationPlaceId, resolveAttractionPlaceId };
