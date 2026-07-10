import type {
  PlanCreateRequest,
  PlanPlaceCreateRequest,
  PlanPlaceResponse,
  PlanPlaceSequenceUpdateRequest,
  PlanPlaceUpdatePlaceRequest,
  PlanPlaceUpdateRequest,
  TravelCreateRequest,
  TravelPlansResponse,
  TravelResponse,
  TravelStatusUpdateRequest,
} from '../../types/travelApi';

type TravelPlanApiLogLevel = 'info' | 'warn' | 'error';
type TravelPlanHttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

function maskToken(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.length <= 12) {
    return '***';
  }
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`;
}

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

  const record = detail as Record<string, unknown>;
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key === 'accessToken' || key === 'authorization') {
      safe[key] = maskToken(typeof value === 'string' ? value : undefined);
      continue;
    }
    safe[key] = value;
  }

  try {
    const text = JSON.stringify(safe);
    return text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
  } catch {
    return String(detail);
  }
}

function summarizeTravelCreateRequest(body: TravelCreateRequest): Record<string, unknown> {
  return {
    title: body.title,
    startDate: body.startDate,
    endDate: body.endDate,
    hasHeavyBaggage: body.hasHeavyBaggage,
    hasPets: body.hasPets,
    travelStyle: body.travelStyle,
    preferFlatTerrain: body.preferFlatTerrain,
    pace: body.pace,
    companionCount: body.companionCount,
    companionTypes: body.companionTypes,
    preferredFoods: body.preferredFoods,
    accommodationArea: body.accommodationArea,
  };
}

function summarizeTravelStatusUpdateRequest(
  body: TravelStatusUpdateRequest,
): Record<string, unknown> {
  return { status: body.status };
}

function summarizePlanCreateRequest(body: PlanCreateRequest): Record<string, unknown> {
  return {
    dayNumber: body.dayNumber,
    visitDate: body.visitDate,
  };
}

function summarizePlanPlaceCreateRequest(body: PlanPlaceCreateRequest): Record<string, unknown> {
  return {
    sequence: body.sequence,
    placeName: body.placeName,
    address: body.address,
    latitude: body.latitude,
    longitude: body.longitude,
    provider: body.provider,
    providerPlaceId: body.providerPlaceId,
    durationMinutes: body.durationMinutes,
    visited: body.visited,
  };
}

function summarizePlanPlaceSequenceRequest(
  body: PlanPlaceSequenceUpdateRequest,
): Record<string, unknown> {
  return {
    planPlaceCount: body.planPlaceIds.length,
    planPlaceIds: body.planPlaceIds.slice(0, 5),
  };
}

function summarizePlanPlaceUpdateRequest(body: PlanPlaceUpdateRequest): Record<string, unknown> {
  return {
    memo: body.memo,
    durationMinutes: body.durationMinutes,
    scheduledTime: body.scheduledTime,
    visited: body.visited,
  };
}

function summarizePlanPlaceUpdatePlaceRequest(
  body: PlanPlaceUpdatePlaceRequest,
): Record<string, unknown> {
  return {
    placeName: body.placeName,
    address: body.address,
    latitude: body.latitude,
    longitude: body.longitude,
    provider: body.provider,
    providerPlaceId: body.providerPlaceId,
  };
}

function summarizePlanPlaceItem(item: PlanPlaceResponse): Record<string, unknown> {
  return {
    planPlaceId: item.planPlaceId,
    planId: item.planId,
    sequence: item.sequence,
    placeName: item.placeName,
    provider: item.provider,
    providerPlaceId: item.providerPlaceId,
    visited: item.visited,
    memo: item.memo,
  };
}

function isMyTravelArray(items: unknown[]): boolean {
  const first = items[0];
  return (
    !!first &&
    typeof first === 'object' &&
    'travelId' in first &&
    'status' in first &&
    'role' in first
  );
}

function summarizeMyTravelArray(items: unknown[]): Record<string, unknown> {
  return {
    itemCount: items.length,
    travels: items.slice(0, 10).map(item => {
      const t = item as Record<string, unknown>;
      return {
        travelId: t.travelId,
        title: t.title,
        status: t.status,
        role: t.role,
        startDate: t.startDate,
        endDate: t.endDate,
      };
    }),
  };
}

function summarizeArrayBody(items: unknown[]): Record<string, unknown> {
  if (isMyTravelArray(items)) {
    return summarizeMyTravelArray(items);
  }
  const places = items as PlanPlaceResponse[];
  return {
    itemCount: places.length,
    sample: places[0] ? summarizePlanPlaceItem(places[0]) : undefined,
  };
}

function summarizeResponseBody(body: unknown): Record<string, unknown> | undefined {
  if (body == null) {
    return undefined;
  }

  if (Array.isArray(body)) {
    return summarizeArrayBody(body);
  }

  if (typeof body !== 'object') {
    return { raw: body };
  }

  const record = body as Record<string, unknown>;
  if ('data' in record && Array.isArray(record.data)) {
    return summarizeArrayBody(record.data);
  }
  const data =
    'data' in record && record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;

  if ('id' in data && 'status' in data) {
    const travel = data as TravelResponse;
    return {
      id: travel.id,
      status: travel.status,
      title: travel.title,
      startDate: travel.startDate,
      endDate: travel.endDate,
    };
  }

  if ('planId' in data && 'travelId' in data) {
    return {
      planId: data.planId,
      travelId: data.travelId,
      dayNumber: data.dayNumber,
      visitDate: data.visitDate,
    };
  }

  if ('travelId' in data && Array.isArray(data.days)) {
    const plans = data as TravelPlansResponse;
    return {
      travelId: plans.travelId,
      title: plans.title,
      dayCount: plans.days.length,
      placesPerDay: plans.days.map(day => ({
        dayNumber: day.dayNumber,
        planId: day.planId,
        placeCount: day.places.length,
      })),
    };
  }

  if ('planPlaceId' in data) {
    return summarizePlanPlaceItem(data as PlanPlaceResponse);
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

function summarizeRequestBody(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  if ('status' in body && !('startDate' in body)) {
    return summarizeTravelStatusUpdateRequest(body as TravelStatusUpdateRequest);
  }
  if ('startDate' in body && 'endDate' in body && !('dayNumber' in body)) {
    return summarizeTravelCreateRequest(body as TravelCreateRequest);
  }
  if ('dayNumber' in body && 'visitDate' in body) {
    return summarizePlanCreateRequest(body as PlanCreateRequest);
  }
  if ('providerPlaceId' in body && 'placeName' in body) {
    if (
      'visited' in body ||
      'memo' in body ||
      'durationMinutes' in body ||
      'scheduledTime' in body ||
      'sequence' in body
    ) {
      return summarizePlanPlaceCreateRequest(body as PlanPlaceCreateRequest);
    }
    return summarizePlanPlaceUpdatePlaceRequest(body as PlanPlaceUpdatePlaceRequest);
  }
  if ('planPlaceIds' in body) {
    return summarizePlanPlaceSequenceRequest(body as PlanPlaceSequenceUpdateRequest);
  }
  if ('memo' in body || 'durationMinutes' in body || 'scheduledTime' in body || 'visited' in body) {
    return summarizePlanPlaceUpdateRequest(body as PlanPlaceUpdateRequest);
  }

  return { keys: Object.keys(body as Record<string, unknown>) };
}

/** Metro 터미널(`npm start`) 또는 `npx react-native log-android`에서 `[Bu-Ting TravelPlan]`로 검색 */
export function logTravelPlanApi(
  step: string,
  message: string,
  options?: {
    level?: TravelPlanApiLogLevel;
    detail?: unknown;
  },
): void {
  const level = options?.level ?? 'info';
  const prefix = `[Bu-Ting TravelPlan] ${step}`;
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

export function logTravelPlanApiRequest(
  method: TravelPlanHttpMethod,
  url: string,
  options?: {
    accessToken?: string;
    travelId?: string;
    planId?: string;
    requestBody?: unknown;
  },
): void {
  logTravelPlanApi('request', `${method} ${url}`, {
    detail: {
      travelId: options?.travelId,
      planId: options?.planId,
      accessToken: options?.accessToken,
      body: options?.requestBody ? summarizeRequestBody(options.requestBody) : undefined,
    },
  });
}

export function logTravelPlanApiResponse(
  method: TravelPlanHttpMethod,
  url: string,
  status: number,
  body: unknown,
  options?: {
    travelId?: string;
    planId?: string;
  },
): void {
  const level = status >= 400 ? 'warn' : 'info';
  logTravelPlanApi('response', `${method} ${url} → ${status}`, {
    level,
    detail: {
      travelId: options?.travelId,
      planId: options?.planId,
      body: summarizeResponseBody(body),
    },
  });
}

export function logTravelPlanApiError(
  method: TravelPlanHttpMethod,
  url: string,
  error: unknown,
  options?: {
    travelId?: string;
    planId?: string;
  },
): void {
  const detail: Record<string, unknown> = {
    travelId: options?.travelId,
    planId: options?.planId,
  };

  if (error instanceof Error) {
    detail.message = error.message;
    if ('status' in error && typeof error.status === 'number') {
      detail.status = error.status;
    }
    if ('responseBody' in error) {
      detail.responseBody = summarizeResponseBody(error.responseBody);
    }
    if ('url' in error) {
      detail.url = error.url;
    }
  } else {
    detail.error = error;
  }

  logTravelPlanApi('error', `${method} ${url} failed`, {
    level: 'error',
    detail,
  });
}
