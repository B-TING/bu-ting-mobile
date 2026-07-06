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
  PlaceDetailVO,
} from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import type { RouteItemType } from '../../types/travelPlan';
import { fetchRoutePlaceDetail as fetchRoutePlaceDetailFromApi } from '../../utils/places/routePlaceDetail';

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

/** ?????????????????? ?? ????????GET /api/accommodations (???????Google Places ?????) */
export async function fetchBusanAccommodations(
  language: AppLanguage = 'ko',
): Promise<BusanAccommodation[]> {
  await delay(200);
  return buildBusanAccommodationListings().map(stay => ({
    ...stay,
    name: localizedAccommodationName(stay, language),
  }));
}

/** ??????????????????? ?? ????????GET /api/places/recommendations (???????Google Places ?????) */
export async function fetchBusanAttractions(
  language: AppLanguage = 'ko',
): Promise<BusanAttraction[]> {
  await delay(200);
  return buildBusanAttractionListings().map(attraction => ({
    ...attraction,
    name: localizedAttractionName(attraction, language),
  }));
}

/** ????? ????? (??????? ???? ????????GET /api/accommodations/{id} */
export async function fetchAccommodationDetail(
  placeId: string,
): Promise<AccommodationPlaceDetail | null> {
  await delay(250);
  return getAccommodationMockDetail(placeId);
}

/** ?????? ????? (??????? ???? ????????GET /api/places/{placeId} (????? recommendations ?????) */
export async function fetchAttractionDetail(
  placeId: string,
): Promise<AttractionPlaceDetail | null> {
  await delay(250);
  return getAttractionMockDetail(placeId);
}

export function shouldFetchGooglePlaceDetail(type: RouteItemType): boolean {
  return type === 'ATTRACTION' || type === 'RESTAURANT';
}

/** 일정 장소 상세 (RouteMapView + PlaceDetailModal) */
export async function fetchRoutePlaceDetail(
  placeId: string,
  type: RouteItemType,
  options?: { placeName?: string; address?: string },
) {
  if (!shouldFetchGooglePlaceDetail(type)) {
    return null;
  }
  return fetchRoutePlaceDetailFromApi(placeId, type, options);
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
