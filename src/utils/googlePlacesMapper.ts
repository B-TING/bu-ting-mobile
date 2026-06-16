import type { PlaceInfo } from '../types/travelPlan';
import type {
  GoogleLatLng,
  GoogleLocalizedText,
  GoogleOpeningHours,
  GooglePlaceDetailsResponse,
  GooglePlacePhotoRaw,
  GooglePlaceReviewRaw,
  PlaceDetailVO,
  PlaceGeoPoint,
  PlaceKind,
  PlaceListItemVO,
  PlaceOpeningHoursVO,
  PlacePhotoVO,
  PlaceReviewVO,
} from '../types/googlePlaces';
import { PLACE_KIND_TO_ROUTE_TYPE } from '../types/googlePlaces';

function localizedText(value?: GoogleLocalizedText): string | undefined {
  return value?.text?.trim() || undefined;
}

export function toGeoPoint(location?: GoogleLatLng): PlaceGeoPoint | null {
  if (location == null) {
    return null;
  }
  return { lat: location.latitude, lng: location.longitude };
}

export function inferPlaceKind(types: string[], primaryType?: string): PlaceKind {
  const set = new Set([primaryType, ...types].filter(Boolean) as string[]);

  if (set.has('lodging') || set.has('hotel') || set.has('guest_house')) {
    return 'accommodation';
  }
  if (set.has('market') || set.has('shopping_mall')) {
    return 'market';
  }
  if (
    set.has('restaurant') ||
    set.has('cafe') ||
    set.has('bar') ||
    set.has('meal_takeaway') ||
    set.has('meal_delivery')
  ) {
    return 'restaurant';
  }
  if (
    set.has('tourist_attraction') ||
    set.has('museum') ||
    set.has('park') ||
    set.has('amusement_park') ||
    set.has('point_of_interest')
  ) {
    return 'attraction';
  }
  return 'other';
}

function mapOpeningHours(hours?: GoogleOpeningHours): PlaceOpeningHoursVO | undefined {
  if (!hours?.weekdayDescriptions?.length && hours?.openNow == null) {
    return undefined;
  }
  return {
    openNow: hours.openNow,
    weekdayDescriptions: hours.weekdayDescriptions ?? [],
    nextCloseTime: hours.nextCloseTime,
  };
}

export function mapGooglePlaceReview(review: GooglePlaceReviewRaw): PlaceReviewVO {
  return {
    reviewId: review.name,
    authorName: review.authorAttribution.displayName,
    authorPhotoUrl: review.authorAttribution.photoUri,
    authorUri: review.authorAttribution.uri,
    rating: review.rating,
    text: review.text?.text ?? review.originalText?.text ?? '',
    languageCode: review.text?.languageCode ?? review.originalText?.languageCode,
    relativePublishTimeDescription: review.relativePublishTimeDescription,
    publishTime: review.publishTime,
  };
}

function mapGooglePlacePhoto(photo: GooglePlacePhotoRaw): PlacePhotoVO {
  return {
    photoResourceName: photo.name,
    widthPx: photo.widthPx,
    heightPx: photo.heightPx,
    googleMapsUri: photo.googleMapsUri,
    authorName: photo.authorAttributions?.[0]?.displayName,
  };
}

function parsePriceLevel(raw?: string): number | undefined {
  if (!raw) {
    return undefined;
  }
  const match = raw.match(/PRICE_LEVEL_(FREE|INEXPENSIVE|MODERATE|EXPENSIVE|VERY_EXPENSIVE)/);
  if (!match) {
    return undefined;
  }
  const map: Record<string, number> = {
    FREE: 0,
    INEXPENSIVE: 1,
    MODERATE: 2,
    EXPENSIVE: 3,
    VERY_EXPENSIVE: 4,
  };
  return map[match[1]];
}

/**
 * Google Places API (New) Place Details JSON → 앱 PlaceDetailVO
 */
export function mapGooglePlaceDetailsResponse(
  response: GooglePlaceDetailsResponse,
  options?: { internalPlaceId?: string },
): PlaceDetailVO | null {
  const location = toGeoPoint(response.location);
  if (!location) {
    return null;
  }

  const googleTypes = response.types ?? [];
  const primaryType = response.primaryType;
  const kind = inferPlaceKind(googleTypes, primaryType);
  const openingHours = mapOpeningHours(
    response.currentOpeningHours ?? response.regularOpeningHours,
  );

  return {
    googlePlaceId: response.id,
    internalPlaceId: options?.internalPlaceId,
    name: localizedText(response.displayName) ?? response.id,
    displayNameLanguageCode: response.displayName?.languageCode,
    kind,
    googleTypes,
    primaryType,
    primaryTypeLabel: localizedText(response.primaryTypeDisplayName),
    googleMapsTypeLabel: localizedText(response.googleMapsTypeLabel),
    formattedAddress: response.formattedAddress ?? '',
    shortFormattedAddress: response.shortFormattedAddress,
    location,
    viewport: response.viewport
      ? {
          low: {
            lat: response.viewport.low.latitude,
            lng: response.viewport.low.longitude,
          },
          high: {
            lat: response.viewport.high.latitude,
            lng: response.viewport.high.longitude,
          },
        }
      : undefined,
    rating: response.rating,
    userRatingCount: response.userRatingCount,
    phones: {
      national: response.nationalPhoneNumber,
      international: response.internationalPhoneNumber,
    },
    websiteUri: response.websiteUri,
    googleMapsUri: response.googleMapsUri ?? response.googleMapsLinks?.placeUri,
    googleMapsLinks: response.googleMapsLinks,
    openingHours,
    editorialSummary: localizedText(response.editorialSummary),
    reviews: (response.reviews ?? []).map(mapGooglePlaceReview),
    photos: (response.photos ?? []).map(mapGooglePlacePhoto),
    amenities: {
      delivery: response.delivery,
      dineIn: response.dineIn,
      takeout: response.takeout,
      reservable: response.reservable,
      restroom: response.restroom,
      paymentOptions: response.paymentOptions,
      parkingOptions: response.parkingOptions,
      accessibilityOptions: response.accessibilityOptions,
    },
    plusCode: response.plusCode?.globalCode,
    timeZoneId: response.timeZone?.id,
    businessStatus: response.businessStatus,
    priceLevel: parsePriceLevel(response.priceLevel),
    postalCode: response.postalAddress?.postalCode,
    administrativeArea: response.postalAddress?.administrativeArea,
    locality: response.postalAddress?.locality,
  };
}

/** PlaceDetailVO → 목록·지도 핀 요약 */
export function toPlaceListItem(detail: PlaceDetailVO): PlaceListItemVO {
  return {
    googlePlaceId: detail.googlePlaceId,
    internalPlaceId: detail.internalPlaceId,
    name: detail.name,
    kind: detail.kind,
    primaryType: detail.primaryType,
    primaryTypeLabel: detail.primaryTypeLabel,
    formattedAddress: detail.formattedAddress,
    location: detail.location,
    rating: detail.rating,
    userRatingCount: detail.userRatingCount,
    openNow: detail.openingHours?.openNow,
    thumbnailPhotoResourceName: detail.photos[0]?.photoResourceName,
    googleMapsUri: detail.googleMapsUri,
  };
}

/** PlaceDetailVO → 일정 RouteItem.placeInfo 호환 */
export function toPlaceInfo(detail: PlaceDetailVO, language: 'ko' | 'en' | 'ja' | 'zh' = 'ko'): PlaceInfo {
  const hours =
    detail.openingHours?.weekdayDescriptions.join(' · ') ||
    (language === 'ko' ? '—' : '—');

  const category =
    detail.primaryTypeLabel ??
    detail.googleMapsTypeLabel ??
    (language === 'ko' ? '장소' : 'Place');

  const description =
    detail.editorialSummary ??
    (language === 'ko'
      ? `${detail.name} — Google Places에서 제공하는 장소 정보입니다.`
      : `${detail.name} — place info from Google Places.`);

  const dwellMinutes =
    detail.kind === 'accommodation'
      ? 0
      : detail.kind === 'restaurant' || detail.kind === 'market'
        ? 75
        : 60;

  return {
    description,
    hours,
    category,
    address: detail.formattedAddress,
    rating: detail.rating,
    reviewCount: detail.userRatingCount,
    dwellMinutes,
  };
}

export function toRouteItemType(kind: PlaceKind) {
  return PLACE_KIND_TO_ROUTE_TYPE[kind];
}

/** 기존 숙소 목업 GooglePlaceReview → PlaceReviewVO */
export function normalizeLegacyReview(review: PlaceReviewVO & {
  time?: number;
  relativeTimeDescription?: string;
}): PlaceReviewVO {
  return {
    ...review,
    relativePublishTimeDescription:
      review.relativePublishTimeDescription ?? review.relativeTimeDescription,
    publishTime:
      review.publishTime ??
      (review.time != null ? new Date(review.time * 1000).toISOString() : undefined),
  };
}

/** PlaceDetailVO → 숙소 상세 (internalPlaceId 필수) */
export function toAccommodationPlaceDetail(
  detail: PlaceDetailVO,
  internalPlaceId: string,
): PlaceDetailVO & { internalPlaceId: string; kind: 'accommodation' } {
  return {
    ...detail,
    internalPlaceId,
    kind: 'accommodation',
  };
}

/** 영업 시간 한 줄 요약 (UI용) */
export function formatOpeningHoursSummary(hours?: PlaceOpeningHoursVO): string | undefined {
  if (!hours?.weekdayDescriptions.length) {
    return undefined;
  }
  if (hours.weekdayDescriptions.length === 1) {
    return hours.weekdayDescriptions[0];
  }
  const first = hours.weekdayDescriptions[0];
  const allSame = hours.weekdayDescriptions.every(line => line === first);
  return allSame ? first : hours.weekdayDescriptions.join('\n');
}
