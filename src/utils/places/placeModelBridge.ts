import type { BusanPlace } from '../../types/placeSearch';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { RouteItem } from '../../types/travelPlan';
import { haversineKm } from '../geo/geo';
import type { RebootPlaceCandidate } from './rebootPlaces';
import { isTourApiContentId, routeTypeToContentTypeId } from './routePlaceDetail';

export function routeItemToBusanPlace(route: RouteItem): BusanPlace | null {
  if (!isTourApiContentId(route.placeId)) {
    return null;
  }

  return {
    id: route.placeId,
    contentId: route.placeId,
    contentTypeId: routeTypeToContentTypeId(route.type),
    name: route.placeName,
    address: route.placeInfo?.address ?? '',
    location: route.location,
    rating: route.placeInfo?.rating ?? 0,
    userRatingsTotal: route.placeInfo?.reviewCount ?? 0,
    imageUrl: route.placeInfo?.imageUrl,
  };
}

export function routeItemToBusanPlaceFallback(route: RouteItem): BusanPlace {
  return (
    routeItemToBusanPlace(route) ?? {
      id: route.placeId,
      contentId: route.placeId,
      contentTypeId: routeTypeToContentTypeId(route.type),
      name: route.placeName,
      address: route.placeInfo?.address ?? '',
      location: route.location,
      rating: route.placeInfo?.rating ?? 0,
      userRatingsTotal: route.placeInfo?.reviewCount ?? 0,
      imageUrl: route.placeInfo?.imageUrl,
    }
  );
}

export function busanPlaceToRebootCandidate(
  place: BusanPlace,
  anchor?: { lat: number; lng: number },
): RebootPlaceCandidate {
  const distanceKm = anchor
    ? haversineKm(anchor.lat, anchor.lng, place.location.lat, place.location.lng)
    : 0;

  return {
    attractionId: place.contentId,
    placeId: place.contentId,
    placeName: place.name,
    address: place.address,
    imageUrl: place.imageUrl,
    location: place.location,
    distanceKm,
  };
}

export function rebootCandidateFromRoute(route: RouteItem): RebootPlaceCandidate {
  const busan = routeItemToBusanPlace(route);
  if (busan) {
    return busanPlaceToRebootCandidate(busan);
  }

  return {
    attractionId: route.placeId,
    placeId: route.placeId,
    placeName: route.placeName,
    location: route.location,
    distanceKm: 0,
    imageUrl: route.placeInfo?.imageUrl,
    address: route.placeInfo?.address,
  };
}

/** 목록·상세 공통 contentType (관광지 픽 모달) */
export const PLAN_PICK_CONTENT_TYPE = PLACE_CONTENT_TYPE.attraction;
