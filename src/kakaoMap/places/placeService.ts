import {
  ACCOMMODATION_MOCK_DETAILS,
  buildBusanAccommodationListings,
  getAccommodationMockDetail,
  localizedAccommodationName,
  resolveAccommodationPlaceId,
} from '../../constants/places/accommodation';
import {
  buildBusanAttractionListings,
  localizedAttractionName,
} from '../../constants/places/attractions';
import {
  ATTRACTION_MOCK_DETAILS,
  getAttractionMockDetail,
  resolveAttractionPlaceId,
} from '../../constants/places/attractionPlaces';
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
import { mapGooglePlaceDetailsResponse } from '../../utils/places/googlePlacesMapper';

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

/** 지???�면??부???�소 목록 ??백엔??GET /api/accommodations (공공?�이??Google Places 병합) */
export async function fetchBusanAccommodations(
  language: AppLanguage = 'ko',
): Promise<BusanAccommodation[]> {
  await delay(200);
  return buildBusanAccommodationListings().map(stay => ({
    ...stay,
    name: localizedAccommodationName(stay, language),
  }));
}

/** 지???�면??부??관광�? 목록 ??백엔??GET /api/places/recommendations (공공?�이??Google Places 병합) */
export async function fetchBusanAttractions(
  language: AppLanguage = 'ko',
): Promise<BusanAttraction[]> {
  await delay(200);
  return buildBusanAttractionListings().map(attraction => ({
    ...attraction,
    name: localizedAttractionName(attraction, language),
  }));
}

/** ?�소 ?�세 (지??마커 ???? ??백엔??GET /api/accommodations/{id} */
export async function fetchAccommodationDetail(
  placeId: string,
): Promise<AccommodationPlaceDetail | null> {
  await delay(250);
  return getAccommodationMockDetail(placeId);
}

/** 관광�? ?�세 (지??마커 ???? ??백엔??GET /api/places/{placeId} (?�는 recommendations ?�세) */
export async function fetchAttractionDetail(
  placeId: string,
): Promise<AttractionPlaceDetail | null> {
  await delay(250);
  return getAttractionMockDetail(placeId);
}

export function shouldFetchGooglePlaceDetail(type: RouteItemType): boolean {
  return type === 'ATTRACTION' || type === 'RESTAURANT';
}

/** ?�정 경로 ?�소 ?�세 (RouteMapView + PlaceDetailModal) */
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
