import { getAttractionMockDetail } from '../../constants/places/attractionPlaces';
import { PLACE_SEARCH_COPY } from '../../constants/places/placeSearch';
import { enrichPlaceInfo } from '../../constants/places/placeCatalog';
import { fetchPlaceDetail } from '../../services/places/placesApiService';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { PlaceContentTypeId } from '../../types/placesApi';
import type { PlaceInfo, RouteItem, RouteItemType } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';

export function shouldFetchRoutePlaceDetail(type: RouteItemType): boolean {
  return type === 'ATTRACTION' || type === 'RESTAURANT' || type === 'ACCOMMODATION';
}

export function isTourApiContentId(placeId: string): boolean {
  return /^\d+$/.test(placeId);
}

export function routeTypeToContentTypeId(type: RouteItemType): PlaceContentTypeId {
  switch (type) {
    case 'RESTAURANT':
      return PLACE_CONTENT_TYPE.restaurant;
    case 'ACCOMMODATION':
      return PLACE_CONTENT_TYPE.accommodation;
    case 'ATTRACTION':
    case 'LOCKER':
    default:
      return PLACE_CONTENT_TYPE.attraction;
  }
}

function resolveDetailHours(detail: PlaceDetailVO): string {
  const weekday = detail.openingHours?.weekdayDescriptions?.[0]?.trim();
  if (weekday) {
    return weekday;
  }
  const raw = detail.tourismRawDetails;
  const fromTour =
    raw?.usetime?.trim() ||
    raw?.usetimefestival?.trim() ||
    raw?.opentimefood?.trim() ||
    raw?.usetimeculture?.trim();
  return fromTour && fromTour !== '0' ? fromTour : '—';
}

export function mapPlaceDetailVoToPlaceInfo(
  detail: PlaceDetailVO,
  type: RouteItemType,
  lang: AppLanguage,
  fallback?: Partial<PlaceInfo>,
): PlaceInfo {
  const contentTypeId = routeTypeToContentTypeId(type);
  const categoryLabel = PLACE_SEARCH_COPY[lang].categoryLabels[contentTypeId];

  return {
    description:
      detail.editorialSummary?.trim() ||
      fallback?.description ||
      (lang === 'ko' ? `${detail.name} 상세 정보` : detail.name),
    hours: resolveDetailHours(detail) || fallback?.hours || '—',
    category:
      detail.primaryTypeLabel ??
      detail.googleMapsTypeLabel ??
      fallback?.category ??
      categoryLabel,
    address: detail.formattedAddress || fallback?.address || '',
    rating: detail.rating ?? fallback?.rating,
    reviewCount: detail.userRatingCount ?? fallback?.reviewCount,
    dwellMinutes: fallback?.dwellMinutes,
    imageUrl: detail.imageUrl ?? fallback?.imageUrl,
  };
}

export function mergeRouteWithPlaceDetail(
  route: RouteItem,
  detail: PlaceDetailVO | null,
  lang: AppLanguage,
): RouteItem {
  if (!detail) {
    if (route.placeInfo) {
      return route;
    }
    return {
      ...route,
      placeInfo: enrichPlaceInfo(route.placeId, route.placeName, route.type, lang),
    };
  }

  return {
    ...route,
    placeInfo: mapPlaceDetailVoToPlaceInfo(detail, route.type, lang, route.placeInfo),
  };
}

export async function fetchRoutePlaceDetail(
  placeId: string,
  type: RouteItemType,
  options?: { placeName?: string; address?: string },
): Promise<PlaceDetailVO | null> {
  const mock = getAttractionMockDetail(placeId);
  if (mock) {
    return mock;
  }

  if (!isTourApiContentId(placeId)) {
    return null;
  }

  const googleSearchText = [options?.placeName, options?.address].filter(Boolean).join(' ');

  return fetchPlaceDetail({
    contentId: placeId,
    contentTypeId: routeTypeToContentTypeId(type),
    googleSearchText,
    fallbackName: options?.placeName,
    fallbackAddress: options?.address,
  });
}
