import type { ApiEnvelope, ApiErrorResponse } from '../../types/auth';

export class ApiClientError extends Error {
  status?: number;
  url?: string;
  responseBody?: unknown;
  cause?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      url?: string;
      responseBody?: unknown;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options?.status;
    this.url = options?.url;
    this.responseBody = options?.responseBody;
    this.cause = options?.cause;
  }
}

export type ApiRequestLogContext = {
  url: string;
  method: string;
};

export type ApiRequestOptions = {
  method?: string;
  accessToken?: string | null;
  headers?: Record<string, string>;
  body?: unknown;
  /** `{ data: T }` 래퍼 제거 (기본 true) */
  unwrap?: boolean;
  /** 204·빈 JSON이면 undefined (기본 true) */
  allowEmptyBody?: boolean;
  /** 이 HTTP 상태는 throw 없이 undefined 반환 (예: 설문 400 = 미설정) */
  emptyOnStatus?: number[];
  errorMessagePrefix?: string;
  mapError?: (error: ApiClientError) => Error;
  onRequest?: (context: ApiRequestLogContext) => void;
  onResponse?: (context: ApiRequestLogContext & { status: number; body: unknown }) => void;
  onError?: (error: ApiClientError) => void;
};

export function bearerAuthHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export function parseApiErrorMessage(
  res: Response,
  body: unknown,
  fallbackPrefix = 'Request failed',
): string {
  if (body && typeof body === 'object') {
    if ('message' in body && typeof body.message === 'string') {
      return body.message;
    }
    if ('error' in body && typeof body.error === 'string') {
      return body.error;
    }
  }
  return `${fallbackPrefix} (${res.status})`;
}

export function unwrapApiData<T>(body: ApiEnvelope<T> | ApiErrorResponse | T | null): T | null {
  if (body && typeof body === 'object' && 'data' in body && (body as ApiEnvelope<T>).data != null) {
    return (body as ApiEnvelope<T>).data;
  }
  return (body as T | null) ?? null;
}

function throwMappedError(error: ApiClientError, mapError?: (error: ApiClientError) => Error): never {
  if (mapError) {
    throw mapError(error);
  }
  throw error;
}

function notifyError(
  error: ApiClientError,
  onError?: (error: ApiClientError) => void,
  mapError?: (error: ApiClientError) => Error,
): never {
  onError?.(error);
  throwMappedError(error, mapError);
}

/**
 * 백엔드 REST 공통 fetch 래퍼.
 * - 네트워크 오류 catch
 * - HTTP 오류 → ApiClientError (또는 mapError)
 * - ApiEnvelope unwrap
 */
export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T | undefined> {
  const {
    method = 'GET',
    accessToken,
    headers: extraHeaders = {},
    body,
    unwrap = true,
    allowEmptyBody = true,
    emptyOnStatus = [],
    errorMessagePrefix = 'Request failed',
    mapError,
    onRequest,
    onResponse,
    onError,
  } = options;

  const headers: Record<string, string> = { ...extraHeaders };
  if (body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  onRequest?.({ url, method });

  let res: Response;
  let parsedBody: unknown = null;

  try {
    res = await fetch(url, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (res.status !== 204) {
      parsedBody = await res.json().catch(() => null);
    }
  } catch (cause) {
    const error = new ApiClientError(`${errorMessagePrefix}: network error`, {
      url,
      cause,
    });
    return notifyError(error, onError, mapError);
  }

  onResponse?.({ url, method, status: res.status, body: parsedBody });

  if (emptyOnStatus.includes(res.status)) {
    return undefined;
  }

  if (!res.ok) {
    const error = new ApiClientError(parseApiErrorMessage(res, parsedBody, errorMessagePrefix), {
      status: res.status,
      url,
      responseBody: parsedBody,
    });
    return notifyError(error, onError, mapError);
  }

  if (res.status === 204 || parsedBody == null) {
    return allowEmptyBody ? undefined : (undefined as T | undefined);
  }

  if (!unwrap) {
    return parsedBody as T;
  }

  return unwrapApiData<T>(parsedBody as ApiEnvelope<T> | T) ?? undefined;
}

export function apiGet<T>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}) {
  return apiRequest<T>(url, { ...options, method: 'GET' });
}

export function apiPost<T>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}) {
  return apiRequest<T>(url, { ...options, method: 'POST' });
}

export function apiPut<T>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}) {
  return apiRequest<T>(url, { ...options, method: 'PUT' });
}

export function apiPatch<T>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}) {
  return apiRequest<T>(url, { ...options, method: 'PATCH' });
}

export function apiDelete(url: string, options: Omit<ApiRequestOptions, 'method'> = {}) {
  return apiRequest<void>(url, { ...options, method: 'DELETE' });
}
