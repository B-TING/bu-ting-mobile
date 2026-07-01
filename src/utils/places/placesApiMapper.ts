import type { PlaceDetailVO, PlaceKind } from '../../types/googlePlaces';
import type { BusanPlace } from '../../types/placeSearch';
import type {
  PlaceContentTypeId,
  PlaceDetailResponseDto,
  PlaceDetailReviewDto,
  PlaceSearchItemDto,
  PlaceSearchResponseDto,
} from '../../types/placesApi';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import { parsePriceLevel } from './googlePlacesMapper';
import { formatTourismInfoRows } from './tourismDetailFormatter';

function resolvePriceLevel(value?: string | number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return parsePriceLevel(value);
  }
  return undefined;
}

function resolveOpeningHours(
  detail: PlaceDetailResponseDto,
): PlaceDetailVO['openingHours'] {
  const googleHours = detail.googlePlace?.openingHours;
  if (googleHours?.length) {
    return { weekdayDescriptions: googleHours };
  }

  if (Array.isArray(detail.openingHours) && detail.openingHours.length > 0) {
    return { weekdayDescriptions: detail.openingHours };
  }

  if (
    detail.openingHours &&
    typeof detail.openingHours === 'object' &&
    !Array.isArray(detail.openingHours) &&
    detail.openingHours.weekdayDescriptions?.length
  ) {
    return {
      openNow: detail.openingHours.openNow,
      weekdayDescriptions: detail.openingHours.weekdayDescriptions,
    };
  }

  return undefined;
}

function resolveReviews(
  detail: PlaceDetailResponseDto,
): PlaceDetailReviewDto[] {
  if (detail.googlePlace?.reviews?.length) {
    return detail.googlePlace.reviews;
  }
  return detail.reviews ?? [];
}

function resolvePhone(detail: PlaceDetailResponseDto): string | undefined {
  if (detail.phone) {
    return detail.phone;
  }
  if (detail.phones?.length) {
    return detail.phones[0];
  }
  const lodgingInfo = detail.details?.infocenterlodging?.trim();
  if (lodgingInfo && lodgingInfo !== '0') {
    return lodgingInfo;
  }
  const infoCenter = detail.details?.infocenter?.trim();
  if (infoCenter && infoCenter !== '0') {
    return infoCenter;
  }
  return undefined;
}

function parseCoord(value: number | string | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (Math.abs(parsed) > 180) {
    return parsed / 10_000_000;
  }
  return parsed;
}

function resolveLatLng(item: {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  mapx?: number | string;
  mapy?: number | string;
}): { lat: number; lng: number } | null {
  const lat = parseCoord(item.lat ?? item.latitude ?? item.mapy);
  const lng = parseCoord(item.lng ?? item.longitude ?? item.mapx);
  if (lat == null || lng == null) {
    return null;
  }
  return { lat, lng };
}

function contentTypeToKind(contentTypeId: string): PlaceKind {
  switch (contentTypeId) {
    case PLACE_CONTENT_TYPE.accommodation:
      return 'accommodation';
    case PLACE_CONTENT_TYPE.restaurant:
      return 'restaurant';
    case PLACE_CONTENT_TYPE.attraction:
      return 'attraction';
    case PLACE_CONTENT_TYPE.festival:
      return 'other';
    default:
      return 'other';
  }
}

function asContentTypeId(value: string): PlaceContentTypeId {
  if (
    value === PLACE_CONTENT_TYPE.attraction ||
    value === PLACE_CONTENT_TYPE.accommodation ||
    value === PLACE_CONTENT_TYPE.restaurant ||
    value === PLACE_CONTENT_TYPE.festival
  ) {
    return value;
  }
  return PLACE_CONTENT_TYPE.attraction;
}

export function mapPlaceSearchItemToBusanPlace(item: PlaceSearchItemDto): BusanPlace | null {
  const location = resolveLatLng(item);
  if (!location) {
    return null;
  }

  const contentId = item.contentId;
  const reviewCount = item.reviewCount ?? item.userRatingCount ?? 0;

  return {
    id: contentId,
    contentId,
    contentTypeId: asContentTypeId(item.contentTypeId),
    name: item.title,
    address: item.address ?? '',
    location,
    rating: item.rating ?? 0,
    userRatingsTotal: reviewCount,
    districtName: item.districtName,
    imageUrl: item.imageUrl ?? item.thumbnailUrl ?? item.firstImage,
  };
}

export function extractPlaceSearchItems(
  response: PlaceSearchResponseDto | PlaceSearchItemDto[],
): PlaceSearchItemDto[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response.places ?? response.items ?? response.content ?? [];
}

export function enrichBusanPlaceFromDetail(
  place: BusanPlace,
  detail: PlaceDetailVO | null | undefined,
): BusanPlace {
  if (!detail) {
    return place;
  }
  return {
    ...place,
    rating: detail.rating ?? place.rating,
    userRatingsTotal: detail.userRatingCount ?? place.userRatingsTotal,
    address: detail.formattedAddress || place.address,
  };
}

export function mapPlaceDetailToPlaceDetailVO(
  detail: PlaceDetailResponseDto,
  fallback?: { name?: string; address?: string },
): PlaceDetailVO {
  const location = resolveLatLng(detail) ?? { lat: 35.1796, lng: 129.0756 };
  const google = detail.googlePlace;
  const phone = resolvePhone(detail);
  const openingHours = resolveOpeningHours(detail);
  const reviews = resolveReviews(detail);
  const tourismInfoRows = formatTourismInfoRows(detail.details, detail.contentTypeId);

  return {
    googlePlaceId: google?.placeId ?? detail.googlePlaceId ?? detail.contentId,
    internalPlaceId: detail.contentId,
    name: detail.title ?? fallback?.name ?? '',
    kind: contentTypeToKind(detail.contentTypeId),
    googleTypes: [],
    formattedAddress: detail.address ?? fallback?.address ?? '',
    location,
    rating: google?.rating ?? detail.rating,
    userRatingCount: google?.reviewCount ?? detail.reviewCount ?? detail.userRatingCount,
    phones: phone
      ? {
          national: phone,
          international: phone,
        }
      : undefined,
    openingHours,
    tourismInfoRows: tourismInfoRows.length > 0 ? tourismInfoRows : undefined,
    reviews: reviews.map((review, index) => ({
      reviewId: `${detail.contentId}-${index}`,
      authorName: review.authorName ?? 'Guest',
      rating: review.rating ?? 0,
      text: review.text ?? '',
      relativePublishTimeDescription: review.relativePublishTimeDescription,
      publishTime: review.publishTime,
    })),
    photos: [],
    priceLevel: resolvePriceLevel(google?.priceLevel ?? detail.priceLevel),
  };
}
