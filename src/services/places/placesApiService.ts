import { API_BASE_URL, PLACES_ENDPOINTS } from '../../constants/api/apiConfig';
import type { ApiEnvelope, ApiErrorResponse } from '../../types/auth';
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

export class PlacesApiServiceError extends Error {
  status?: number;
  url?: string;
  responseBody?: unknown;

  constructor(message: string, options?: { status?: number; url?: string; responseBody?: unknown }) {
    super(message);
    this.name = 'PlacesApiServiceError';
    this.status = options?.status;
    this.url = options?.url;
    this.responseBody = options?.responseBody;
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

function unwrapData<T>(body: ApiEnvelope<T> | T | null): T | null {
  if (body && typeof body === 'object' && 'data' in body && body.data != null) {
    return body.data;
  }
  return body as T | null;
}

function parseErrorMessage(res: Response, body: unknown): string {
  if (body && typeof body === 'object') {
    if ('message' in body && typeof body.message === 'string') {
      return body.message;
    }
    if ('error' in body && typeof body.error === 'string') {
      return body.error;
    }
  }
  return `Places request failed (${res.status})`;
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
  logPlacesApiRequest('GET', url, logContext);

  let res: Response;
  let body: ApiEnvelope<PlaceSearchResponseDto> | PlaceSearchResponseDto | ApiErrorResponse | null;

  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    body = (await res.json().catch(parseError => {
      logPlacesApiError('GET', url, parseError, { step: 'json-parse' });
      return null;
    })) as ApiEnvelope<PlaceSearchResponseDto> | PlaceSearchResponseDto | ApiErrorResponse | null;
  } catch (networkError) {
    logPlacesApiError('GET', url, networkError, logContext);
    throw networkError;
  }

  logPlacesApiResponse('GET', url, res.status, body, logContext);

  if (!res.ok) {
    const message = parseErrorMessage(res, body);
    const error = new PlacesApiServiceError(message, {
      status: res.status,
      url,
      responseBody: body,
    });
    logPlacesApiError('GET', url, error, logContext);
    throw error;
  }

  const payload = unwrapData<PlaceSearchResponseDto>(
    body as ApiEnvelope<PlaceSearchResponseDto> | PlaceSearchResponseDto | null,
  );
  if (!payload) {
    logPlacesApiError('GET', url, new Error('Empty places search response body'), {
      ...logContext,
      status: res.status,
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

  logPlacesApiRequest('GET', url, {
    contentId: params.contentId,
    contentTypeId: params.contentTypeId,
    googleSearchText: params.googleSearchText,
  });

  let res: Response;
  let body: ApiEnvelope<PlaceDetailResponseDto> | PlaceDetailResponseDto | ApiErrorResponse | null;

  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    body = (await res.json().catch(parseError => {
      logPlacesApiError('GET', url, parseError, { step: 'json-parse' });
      return null;
    })) as ApiEnvelope<PlaceDetailResponseDto> | PlaceDetailResponseDto | ApiErrorResponse | null;
  } catch (networkError) {
    logPlacesApiError('GET', url, networkError, {
      contentId: params.contentId,
      contentTypeId: params.contentTypeId,
    });
    throw networkError;
  }

  logPlacesApiResponse('GET', url, res.status, body, {
    contentId: params.contentId,
    contentTypeId: params.contentTypeId,
  });

  if (!res.ok) {
    const message = parseErrorMessage(res, body);
    const error = new PlacesApiServiceError(message, {
      status: res.status,
      url,
      responseBody: body,
    });
    logPlacesApiError('GET', url, error, {
      contentId: params.contentId,
      contentTypeId: params.contentTypeId,
    });
    throw error;
  }

  const payload = unwrapData<PlaceDetailResponseDto>(
    body as ApiEnvelope<PlaceDetailResponseDto> | PlaceDetailResponseDto | null,
  );
  if (!payload?.contentId) {
    logPlacesApiError('GET', url, new Error('Place detail response missing contentId'), {
      contentId: params.contentId,
      contentTypeId: params.contentTypeId,
      status: res.status,
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
