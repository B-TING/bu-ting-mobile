import { getAttractionMockDetail } from '../../constants/places/attractionPlaces';
import { getCopyForLanguage } from '../../i18n';
import { enrichPlaceInfo } from '../../constants/places/placeCatalog';
import { fetchPlaceDetail, searchPlacesByKeyword } from '../../services/places/placesApiService';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import { busanPlaceToPlaceDetailStub } from './placesApiMapper';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { PlaceContentTypeId } from '../../types/placesApi';
import type { PlaceInfo, RouteItem, RouteItemType } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';

export function shouldFetchRoutePlaceDetail(type: RouteItemType): boolean {
  return type === 'ATTRACTION' || type === 'RESTAURANT' || type === 'ACCOMMODATION';
}

/** 일정 카드·프리로드 대상 — imageUrl이 아직 없을 때 */
export function shouldPrefetchRouteDetail(route: RouteItem): boolean {
  if (!shouldFetchRoutePlaceDetail(route.type) && !isTourApiContentId(route.placeId)) {
    return false;
  }
  if (route.placeInfo?.imageUrl?.trim()) {
    return false;
  }
  return true;
}

export function isRouteImageOnlyDetail(detail: PlaceDetailVO): boolean {
  return (
    !detail.editorialSummary?.trim() &&
    detail.reviews.length === 0 &&
    detail.photos.length === 0 &&
    !detail.tourismRawDetails
  );
}

function buildRouteImageStub(
  placeId: string,
  options: { placeName?: string; address?: string; imageUrl?: string },
): PlaceDetailVO | null {
  const imageUrl = options.imageUrl?.trim();
  if (!imageUrl) {
    return null;
  }
  return {
    googlePlaceId: placeId,
    internalPlaceId: placeId,
    name: options.placeName?.trim() || '',
    kind: 'attraction',
    googleTypes: [],
    formattedAddress: options.address?.trim() || '',
    location: { lat: 0, lng: 0 },
    reviews: [],
    photos: [],
    imageUrl,
  };
}

function findKeywordSearchMatch(
  places: Awaited<ReturnType<typeof searchPlacesByKeyword>>['places'],
  placeId: string,
  placeName: string,
) {
  const byId = places.find(place => place.contentId === placeId);
  if (byId) {
    return byId;
  }
  const normalizedName = placeName.trim();
  return places.find(
    place =>
      place.name.trim() === normalizedName ||
      place.name.trim().includes(normalizedName) ||
      normalizedName.includes(place.name.trim()),
  );
}

/** 장소 검색과 동일 — 키워드 검색 목록에서 imageUrl 매핑 (detail API 미사용) */
export async function fetchRoutePlaceImageViaKeywordSearch(
  placeId: string,
  type: RouteItemType,
  options?: { placeName?: string; address?: string; imageUrl?: string },
): Promise<PlaceDetailVO | null> {
  const mock = getAttractionMockDetail(placeId);
  if (mock?.imageUrl?.trim()) {
    return mock;
  }

  if (!isTourApiContentId(placeId)) {
    return null;
  }

  const placeName = options?.placeName?.trim();
  if (!placeName) {
    return buildRouteImageStub(placeId, options ?? {});
  }

  try {
    const result = await searchPlacesByKeyword({
      keyword: placeName,
      contentTypeId: routeTypeToContentTypeId(type),
      page: 1,
      size: 20,
    });

    const match = findKeywordSearchMatch(result.places, placeId, placeName);
    if (match?.imageUrl?.trim()) {
      return busanPlaceToPlaceDetailStub(match);
    }
  } catch {
    // 키워드 검색 실패 시 시드 imageUrl 폴백
  }

  return buildRouteImageStub(placeId, options ?? {});
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
  const categoryLabel = getCopyForLanguage('placeSearch', lang).categoryLabels[contentTypeId];

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

export function resolveRouteImageUrl(
  route: RouteItem,
  cachedDetail?: PlaceDetailVO | null,
): string | undefined {
  return route.placeInfo?.imageUrl ?? cachedDetail?.imageUrl ?? undefined;
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
  options?: { placeName?: string; address?: string; imageUrl?: string },
): Promise<PlaceDetailVO | null> {
  const mock = getAttractionMockDetail(placeId);
  if (mock) {
    return mock;
  }

  if (!isTourApiContentId(placeId)) {
    return null;
  }

  const googleSearchText =
    [options?.placeName, options?.address].filter(Boolean).join(' ').trim() || undefined;

  return fetchPlaceDetail({
    contentId: placeId,
    contentTypeId: routeTypeToContentTypeId(type),
    googleSearchText,
    fallbackName: options?.placeName,
    fallbackAddress: options?.address,
    fallbackImageUrl: options?.imageUrl,
  });
}
