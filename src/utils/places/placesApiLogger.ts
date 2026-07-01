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

function pickPlaceList(data: Record<string, unknown>): unknown[] | null {
  if (Array.isArray(data.places)) {
    return data.places;
  }
  if (Array.isArray(data.items)) {
    return data.items;
  }
  if (Array.isArray(data.content)) {
    return data.content;
  }
  return null;
}

function summarizePlaceItem(item: unknown): Record<string, unknown> | undefined {
  if (!item || typeof item !== 'object') {
    return undefined;
  }
  const record = item as Record<string, unknown>;
  return {
    contentId: record.contentId,
    contentTypeId: record.contentTypeId,
    title: record.title,
    latitude: record.latitude ?? record.lat ?? record.mapy,
    longitude: record.longitude ?? record.lng ?? record.mapx,
  };
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

  const items = pickPlaceList(data);

  if (items) {
    return {
      itemCount: items.length,
      page: data.page,
      size: data.size,
      totalCount: data.totalCount ?? data.total,
      sample: summarizePlaceItem(items[0]),
    };
  }

  if ('contentId' in data) {
    const googlePlace =
      data.googlePlace && typeof data.googlePlace === 'object'
        ? (data.googlePlace as Record<string, unknown>)
        : null;
    return {
      contentId: data.contentId,
      contentTypeId: data.contentTypeId,
      title: data.title,
      hasDetails: Boolean(data.details),
      hasGooglePlace: Boolean(googlePlace),
      googleRating: googlePlace?.rating,
      googleReviewCount: googlePlace?.reviewCount,
      googlePriceLevel: googlePlace?.priceLevel,
      googleReviewSampleCount: Array.isArray(googlePlace?.reviews)
        ? googlePlace.reviews.length
        : undefined,
      googleHoursCount: Array.isArray(googlePlace?.openingHours)
        ? googlePlace.openingHours.length
        : undefined,
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

function emitPlacesApiLog(level: PlacesApiLogLevel, line: string): void {
  // Android logcat는 console.log(info)를 잘 안 보여줄 수 있어 warn/error 위주로 출력합니다.
  // Metro(`npm start`)·`npx react-native log-android`·Flipper 모두에서 `[Bu-Ting Places]`로 검색하세요.
  if (level === 'error') {
    console.error(line);
    return;
  }
  console.warn(line);
}

/** `[Bu-Ting Places]` — Metro 터미널 또는 `npx react-native log-android`에서 확인 */
export function logPlacesApi(
  step: string,
  message: string,
  options?: {
    level?: PlacesApiLogLevel;
    detail?: unknown;
  },
): void {
  const level = options?.level ?? 'info';
  const detail = sanitizeDetail(options?.detail);
  const line = detail
    ? `[Bu-Ting Places] ${step} ${message} | ${detail}`
    : `[Bu-Ting Places] ${step} ${message}`;
  emitPlacesApiLog(level, line);
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
