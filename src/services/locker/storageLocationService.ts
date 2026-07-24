import { API_BASE_URL, STORAGE_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  StorageLocationQuery,
  StorageLocationResponse,
} from '../../types/storageApi';
import {
  STORAGE_SEARCH_RADIUS_DEFAULT_M,
  STORAGE_SEARCH_RADIUS_MAX_M,
} from '../../types/storageApi';
import { ApiClientError, apiGet } from '../api/apiClient';

export class StorageApiServiceError extends ApiClientError {
  constructor(message: string, options?: { status?: number; url?: string; responseBody?: unknown }) {
    super(message, {
      status: options?.status,
      url: options?.url,
      responseBody: options?.responseBody,
    });
    this.name = 'StorageApiServiceError';
  }
}

function mapStorageError(error: ApiClientError): StorageApiServiceError {
  return new StorageApiServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
  });
}

function clampRadius(radius: number): number {
  if (!Number.isFinite(radius)) {
    return STORAGE_SEARCH_RADIUS_DEFAULT_M;
  }
  return Math.min(
    STORAGE_SEARCH_RADIUS_MAX_M,
    Math.max(1, Math.round(radius)),
  );
}

function buildStorageLocationsUrl(query: StorageLocationQuery): string {
  const url = new URL(`${API_BASE_URL}${STORAGE_ENDPOINTS.nearby}`);
  url.searchParams.set('longitude', String(query.longitude));
  url.searchParams.set('latitude', String(query.latitude));
  url.searchParams.set('radius', String(clampRadius(query.radius)));
  return url.toString();
}

/** 주변 물품 보관소 조회 (거리순) */
export async function fetchNearbyStorageLocations(
  query: StorageLocationQuery,
): Promise<StorageLocationResponse[]> {
  const url = buildStorageLocationsUrl(query);
  const data = await apiGet<StorageLocationResponse[]>(url, {
    errorMessagePrefix: 'Storage locations request failed',
    mapError: mapStorageError,
  });

  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  // envelope 안쪽 배열 변형 대응
  if (typeof data === 'object' && Array.isArray((data as { content?: unknown }).content)) {
    return (data as { content: StorageLocationResponse[] }).content;
  }
  return [];
}
