import { API_BASE_URL, PLACES_ENDPOINTS } from '../../constants/api/apiConfig';
import type { ApiEnvelope, ApiErrorResponse } from '../../types/auth';
import type { BusanPlace } from '../../types/placeSearch';
import type {
  PlaceContentTypeId,
  PlaceDetailResponseDto,
  PlaceSearchResponseDto,
  TourApiDistrictCode,
} from '../../types/placesApi';
import {
  extractPlaceSearchItems,
  mapPlaceDetailToPlaceDetailVO,
  mapPlaceSearchItemToBusanPlace,
} from '../../utils/places/placesApiMapper';
import {
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

type SearchPlacesParams = {
  contentTypeId: PlaceContentTypeId;
  districtCode: TourApiDistrictCode;
  page?: number;
  size?: number;
};

type FetchPlaceDetailParams = {
  contentId: string;
  contentTypeId: PlaceContentTypeId;
  googleSearchText?: string;
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

function buildSearchUrl(params: SearchPlacesParams): string {
  const query = new URLSearchParams({
    contentTypeId: params.contentTypeId,
    districtCode: params.districtCode,
    page: String(params.page ?? 1),
    size: String(params.size ?? 20),
  });
  return `${API_BASE_URL}${PLACES_ENDPOINTS.search}?${query.toString()}`;
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

export async function searchPlaces(params: SearchPlacesParams): Promise<BusanPlace[]> {
  const url = buildSearchUrl(params);
  logPlacesApiRequest('GET', url, {
    contentTypeId: params.contentTypeId,
    districtCode: params.districtCode,
    page: params.page ?? 1,
    size: params.size ?? 20,
  });

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
    logPlacesApiError('GET', url, networkError, {
      contentTypeId: params.contentTypeId,
      districtCode: params.districtCode,
    });
    throw networkError;
  }

  logPlacesApiResponse('GET', url, res.status, body, {
    contentTypeId: params.contentTypeId,
    districtCode: params.districtCode,
  });

  if (!res.ok) {
    const message = parseErrorMessage(res, body);
    const error = new PlacesApiServiceError(message, {
      status: res.status,
      url,
      responseBody: body,
    });
    logPlacesApiError('GET', url, error, {
      contentTypeId: params.contentTypeId,
      districtCode: params.districtCode,
    });
    throw error;
  }

  const payload = unwrapData(body);
  if (!payload) {
    logPlacesApiError('GET', url, new Error('Empty places search response body'), {
      contentTypeId: params.contentTypeId,
      districtCode: params.districtCode,
      status: res.status,
    });
    return [];
  }

  const mapped = extractPlaceSearchItems(payload)
    .map(mapPlaceSearchItemToBusanPlace)
    .filter((place): place is BusanPlace => place != null);

  if (mapped.length === 0 && extractPlaceSearchItems(payload).length > 0) {
    logPlacesApiError('GET', url, new Error('All place items failed coordinate mapping'), {
      contentTypeId: params.contentTypeId,
      districtCode: params.districtCode,
      rawItemCount: extractPlaceSearchItems(payload).length,
    });
  }

  return mapped;
}

export async function fetchPlaceDetail(params: FetchPlaceDetailParams): Promise<PlaceDetailVO | null> {
  const url = buildDetailUrl(params.contentId, params);
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

  const payload = unwrapData(body);
  if (!payload?.contentId) {
    logPlacesApiError('GET', url, new Error('Place detail response missing contentId'), {
      contentId: params.contentId,
      contentTypeId: params.contentTypeId,
      status: res.status,
    });
    return null;
  }

  return mapPlaceDetailToPlaceDetailVO(payload);
}
