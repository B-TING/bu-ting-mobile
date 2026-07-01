import type { PlaceDetailVO, PlaceKind } from '../../types/googlePlaces';
import type { BusanPlace } from '../../types/placeSearch';
import type {
  PlaceContentTypeId,
  PlaceDetailResponseDto,
  PlaceSearchItemDto,
  PlaceSearchResponseDto,
} from '../../types/placesApi';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';

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
  mapx?: number | string;
  mapy?: number | string;
}): { lat: number; lng: number } | null {
  const lat = parseCoord(item.lat ?? item.mapy);
  const lng = parseCoord(item.lng ?? item.mapx);
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
    default:
      return 'other';
  }
}

function asContentTypeId(value: string): PlaceContentTypeId {
  if (
    value === PLACE_CONTENT_TYPE.attraction ||
    value === PLACE_CONTENT_TYPE.accommodation ||
    value === PLACE_CONTENT_TYPE.restaurant
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
    imageUrl: item.imageUrl ?? item.firstImage,
  };
}

export function extractPlaceSearchItems(
  response: PlaceSearchResponseDto | PlaceSearchItemDto[],
): PlaceSearchItemDto[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response.items ?? response.content ?? [];
}

export function mapPlaceDetailToPlaceDetailVO(detail: PlaceDetailResponseDto): PlaceDetailVO {
  const location = resolveLatLng(detail) ?? { lat: 35.1796, lng: 129.0756 };
  const phones = detail.phones?.length
    ? detail.phones
    : detail.phone
      ? [detail.phone]
      : [];

  return {
    googlePlaceId: detail.googlePlaceId ?? detail.contentId,
    internalPlaceId: detail.contentId,
    name: detail.title,
    kind: contentTypeToKind(detail.contentTypeId),
    googleTypes: [],
    formattedAddress: detail.address ?? '',
    location,
    rating: detail.rating,
    userRatingCount: detail.reviewCount ?? detail.userRatingCount,
    phones: phones.length
      ? {
          national: phones[0],
          international: phones[0],
        }
      : undefined,
    openingHours: detail.openingHours?.weekdayDescriptions?.length
      ? {
          openNow: detail.openingHours.openNow,
          weekdayDescriptions: detail.openingHours.weekdayDescriptions,
        }
      : undefined,
    editorialSummary: detail.details
      ? Object.entries(detail.details)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : undefined,
    reviews:
      detail.reviews?.map((review, index) => ({
        reviewId: `${detail.contentId}-${index}`,
        authorName: review.authorName ?? 'Guest',
        rating: review.rating ?? 0,
        text: review.text ?? '',
        relativePublishTimeDescription: review.relativePublishTimeDescription,
        publishTime: review.publishTime,
      })) ?? [],
    photos: [],
    priceLevel: detail.priceLevel,
  };
}
