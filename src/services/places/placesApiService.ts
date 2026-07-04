import { API_BASE_URL, PLACES_ENDPOINTS } from '../../constants/api/apiConfig';
import type { BusanPlace } from '../../types/placeSearch';
import type {
  PlaceContentTypeId,
  PlaceDetailResponseDto,
  PlaceSearchResponseDto,
} from '../../types/placesApi';
import {
  extractPlaceSearchItems,
  mapPlaceDetailToPlaceDetailVO,
  mapPlaceSearchItemToBusanPlace,
} from '../../utils/places/placesApiMapper';
import {
  logPlacesApi,
  logPlacesApiError,
  logPlacesApiRequest,
  logPlacesApiResponse,
} from '../../utils/places/placesApiLogger';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import { ApiClientError, apiGet } from '../api/apiClient';

export class PlacesApiServiceError extends ApiClientError {
  constructor(message: string, options?: { status?: number; url?: string; responseBody?: unknown }) {
    super(message, {
      status: options?.status,
      url: options?.url,
      responseBody: options?.responseBody,
    });
    this.name = 'PlacesApiServiceError';
  }
}

type SearchPlacesByLocationParams = {
  mapX: number;
  mapY: number;
  radius: number;
  contentTypeId: PlaceContentTypeId;
  page?: number;
  size?: number;
  arrange?: 'A' | 'C' | 'D' | 'E' | 'O' | 'Q' | 'R' | 'S';
};

type FetchPlaceDetailParams = {
  contentId: string;
  contentTypeId: PlaceContentTypeId;
  googleSearchText?: string;
  fallbackName?: string;
  fallbackAddress?: string;
};

function mapPlacesError(error: ApiClientError): PlacesApiServiceError {
  return new PlacesApiServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
  });
}

function buildLocationSearchUrl(params: SearchPlacesByLocationParams): string {
  const query = new URLSearchParams({
    mapX: String(params.mapX),
    mapY: String(params.mapY),
    radius: String(params.radius),
    contentTypeId: params.contentTypeId,
    page: String(params.page ?? 1),
    size: String(params.size ?? 20),
    arrange: params.arrange ?? 'E',
  });
  return `${API_BASE_URL}${PLACES_ENDPOINTS.location}?${query.toString()}`;
}

function buildDetailUrl(contentId: string, params: Omit<FetchPlaceDetailParams, 'contentId'>): string {
  const query = new URLSearchParams({
    contentTypeId: params.contentTypeId,
  });
  if (params.googleSearchText?.trim()) {
    query.set('googleSearchText', params.googleSearchText.trim());
  }
  return `${API_BASE_URL}${PLACES_ENDPOINTS.detail(contentId)}?${query.toString()}`;
}

async function fetchPlaceList(
  url: string,
  logContext: Record<string, unknown>,
): Promise<BusanPlace[]> {
  const payload = await apiGet<PlaceSearchResponseDto>(url, {
    headers: { Accept: 'application/json' },
    errorMessagePrefix: 'Places request failed',
    mapError: mapPlacesError,
    onRequest: () => {
      logPlacesApiRequest('GET', url, logContext);
    },
    onResponse: ({ status, body }) => {
      logPlacesApiResponse('GET', url, status, body, logContext);
    },
    onError: error => {
      logPlacesApiError('GET', url, error, logContext);
    },
  });

  if (!payload) {
    logPlacesApiError('GET', url, new Error('Empty places search response body'), {
      ...logContext,
    });
    return [];
  }

  const mapped = extractPlaceSearchItems(payload)
    .map(mapPlaceSearchItemToBusanPlace)
    .filter((place): place is BusanPlace => place != null);

  if (mapped.length === 0 && extractPlaceSearchItems(payload).length > 0) {
    logPlacesApiError('GET', url, new Error('All place items failed coordinate mapping'), {
      ...logContext,
      rawItemCount: extractPlaceSearchItems(payload).length,
    });
  }

  return mapped;
}

export async function searchPlacesByLocation(
  params: SearchPlacesByLocationParams,
): Promise<BusanPlace[]> {
  logPlacesApi('search.start', 'location search', {
    detail: {
      contentTypeId: params.contentTypeId,
      mapX: params.mapX,
      mapY: params.mapY,
      radius: params.radius,
      page: params.page ?? 1,
      size: params.size ?? 20,
    },
  });

  let url: string;
  try {
    url = buildLocationSearchUrl(params);
  } catch (error) {
    logPlacesApiError('GET', '(location-url-build)', error, {
      contentTypeId: params.contentTypeId,
      mapX: params.mapX,
      mapY: params.mapY,
    });
    throw error;
  }

  return fetchPlaceList(url, {
    contentTypeId: params.contentTypeId,
    mapX: params.mapX,
    mapY: params.mapY,
    radius: params.radius,
    page: params.page ?? 1,
    size: params.size ?? 20,
  });
}

export async function fetchPlaceDetail(params: FetchPlaceDetailParams): Promise<PlaceDetailVO | null> {
  logPlacesApi('detail.start', 'place detail requested', {
    detail: {
      contentId: params.contentId,
      contentTypeId: params.contentTypeId,
      googleSearchText: params.googleSearchText,
    },
  });

  let url: string;
  try {
    url = buildDetailUrl(params.contentId, params);
  } catch (error) {
    logPlacesApiError('GET', '(detail-url-build)', error, {
      contentId: params.contentId,
      contentTypeId: params.contentTypeId,
    });
    throw error;
  }

  const logContext = {
    contentId: params.contentId,
    contentTypeId: params.contentTypeId,
    googleSearchText: params.googleSearchText,
  };

  const payload = await apiGet<PlaceDetailResponseDto>(url, {
    headers: { Accept: 'application/json' },
    errorMessagePrefix: 'Places request failed',
    mapError: mapPlacesError,
    onRequest: () => {
      logPlacesApiRequest('GET', url, logContext);
    },
    onResponse: ({ status, body }) => {
      logPlacesApiResponse('GET', url, status, body, logContext);
    },
    onError: error => {
      logPlacesApiError('GET', url, error, logContext);
    },
  });

  if (!payload?.contentId) {
    logPlacesApiError('GET', url, new Error('Place detail response missing contentId'), {
      ...logContext,
    });
    return null;
  }

  return mapPlaceDetailToPlaceDetailVO(payload, {
    name: params.fallbackName,
    address: params.fallbackAddress,
  });
}

export async function fetchPlaceDetailsForList(
  places: BusanPlace[],
): Promise<Record<string, PlaceDetailVO | null>> {
  if (places.length === 0) {
    return {};
  }

  logPlacesApi('details.batch.start', 'prefetch place details', {
    detail: { count: places.length },
  });

  const entries = await Promise.all(
    places.map(async place => {
      const googleSearchText = [place.name, place.address].filter(Boolean).join(' ');
      try {
        const detail = await fetchPlaceDetail({
          contentId: place.contentId,
          contentTypeId: place.contentTypeId,
          googleSearchText,
          fallbackName: place.name,
          fallbackAddress: place.address,
        });
        return [place.contentId, detail] as const;
      } catch {
        return [place.contentId, null] as const;
      }
    }),
  );

  const detailsById = Object.fromEntries(entries) as Record<string, PlaceDetailVO | null>;
  const loadedCount = entries.filter(([, detail]) => detail != null).length;

  logPlacesApi('details.batch.done', 'prefetch place details complete', {
    detail: { requested: places.length, loaded: loadedCount },
  });

  return detailsById;
}
