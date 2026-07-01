type PlacesApiLogLevel = 'info' | 'warn' | 'error';

function sanitizeDetail(detail: unknown): string | undefined {
  if (detail == null) {
    return undefined;
  }
  if (detail instanceof Error) {
    return detail.message;
  }
  if (typeof detail !== 'object') {
    return String(detail);
  }

  try {
    const text = JSON.stringify(detail);
    return text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
  } catch {
    return String(detail);
  }
}

function summarizeResponseBody(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') {
    return body == null ? undefined : { raw: body };
  }

  const record = body as Record<string, unknown>;
  const data =
    'data' in record && record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;

  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.content)
      ? data.content
      : null;

  if (items) {
    return {
      itemCount: items.length,
      page: data.page,
      size: data.size,
      totalCount: data.totalCount ?? data.total,
      sampleContentId:
        items[0] && typeof items[0] === 'object' && 'contentId' in (items[0] as object)
          ? (items[0] as { contentId?: string }).contentId
          : undefined,
    };
  }

  if ('contentId' in data) {
    return {
      contentId: data.contentId,
      contentTypeId: data.contentTypeId,
      title: data.title,
      hasDetails: Boolean(data.details),
      reviewCount: data.reviewCount ?? data.userRatingCount,
    };
  }

  if ('message' in data || 'error' in data || 'status' in data) {
    return {
      message: data.message,
      error: data.error,
      status: data.status,
      code: data.code,
    };
  }

  return { keys: Object.keys(data) };
}

/** Metro 터미널(`npm start`)에 `[Bu-Ting Places]` 로그를 출력합니다. */
export function logPlacesApi(
  step: string,
  message: string,
  options?: {
    level?: PlacesApiLogLevel;
    detail?: unknown;
  },
): void {
  const level = options?.level ?? 'info';
  const prefix = `[Bu-Ting Places] ${step}`;
  const detail = sanitizeDetail(options?.detail);
  const payload = detail ? `${message} | ${detail}` : message;

  if (level === 'error') {
    console.error(prefix, payload);
  } else if (level === 'warn') {
    console.warn(prefix, payload);
  } else {
    console.log(prefix, payload);
  }
}

export function logPlacesApiRequest(
  method: 'GET',
  url: string,
  options?: Record<string, unknown>,
): void {
  logPlacesApi('request', `${method} ${url}`, { detail: options });
}

export function logPlacesApiResponse(
  method: 'GET',
  url: string,
  status: number,
  body: unknown,
  options?: Record<string, unknown>,
): void {
  const level = status >= 400 ? 'error' : 'info';
  logPlacesApi('response', `${method} ${url} → ${status}`, {
    level,
    detail: {
      ...options,
      body: summarizeResponseBody(body),
    },
  });
}

export function logPlacesApiError(
  method: 'GET',
  url: string,
  error: unknown,
  options?: Record<string, unknown>,
): void {
  const detail: Record<string, unknown> = { ...options };

  if (error instanceof Error) {
    detail.message = error.message;
    if ('status' in error && typeof error.status === 'number') {
      detail.status = error.status;
    }
    if ('responseBody' in error) {
      detail.responseBody = error.responseBody;
    }
    if ('url' in error) {
      detail.url = error.url;
    }
  } else {
    detail.error = error;
  }

  logPlacesApi('error', `${method} ${url} failed`, {
    level: 'error',
    detail,
  });
}
