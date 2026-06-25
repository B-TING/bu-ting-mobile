import type { TravelSurveyProfileRequest } from '../../types/travelSurvey';

type TravelSurveyLogLevel = 'info' | 'warn' | 'error';

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
    return JSON.stringify(safe);
  } catch {
    return String(detail);
  }
}

function summarizeRequest(body: TravelSurveyProfileRequest): Record<string, unknown> {
  return {
    preferredLanguage: body.preferredLanguage,
    skippedAll: body.skippedAll,
    skippedSteps: body.skippedSteps,
    purposes: body.purposes,
    isPlanned: body.isPlanned,
    isRelaxed: body.isRelaxed,
    isSolo: body.isSolo,
    isLight: body.isLight,
    isFamiliar: body.isFamiliar,
  };
}

function summarizeResponse(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  const data =
    'data' in record && record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;

  if (!('preferredLanguage' in data)) {
    return { raw: body };
  }

  return {
    preferredLanguage: data.preferredLanguage,
    skippedAll: data.skippedAll,
    skippedSteps: data.skippedSteps,
    purposes: data.purposes,
    isPlanned: data.isPlanned,
    isRelaxed: data.isRelaxed,
    isSolo: data.isSolo,
    isLight: data.isLight,
    isFamiliar: data.isFamiliar,
    completedAt: data.completedAt,
    hasAiPromptContext: Boolean(data.aiPromptContext),
  };
}

/** Metro 터미널(`npm start`)에 `[Bu-Ting TravelSurvey]` 로그를 출력합니다. */
export function logTravelSurvey(
  step: string,
  message: string,
  options?: {
    level?: TravelSurveyLogLevel;
    detail?: unknown;
  },
): void {
  const level = options?.level ?? 'info';
  const prefix = `[Bu-Ting TravelSurvey] ${step}`;
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

export function logTravelSurveyRequest(
  method: 'GET' | 'PUT',
  url: string,
  options?: {
    userId?: string;
    accessToken?: string;
    requestBody?: TravelSurveyProfileRequest;
  },
): void {
  logTravelSurvey('request', `${method} ${url}`, {
    detail: {
      userId: options?.userId,
      accessToken: options?.accessToken,
      body: options?.requestBody ? summarizeRequest(options.requestBody) : undefined,
    },
  });
}

export function logTravelSurveyResponse(
  method: 'GET' | 'PUT',
  url: string,
  status: number,
  body: unknown,
  options?: { userId?: string; notFound?: boolean },
): void {
  const level = status >= 400 ? 'warn' : 'info';
  logTravelSurvey(
    'response',
    `${method} ${url} → ${status}${options?.notFound ? ' (not found)' : ''}`,
    {
      level,
      detail: {
        userId: options?.userId,
        body: summarizeResponse(body),
      },
    },
  );
}

export function logTravelSurveyError(
  method: 'GET' | 'PUT',
  url: string,
  error: unknown,
  options?: { userId?: string },
): void {
  const detail: Record<string, unknown> = { userId: options?.userId };
  if (error instanceof Error) {
    detail.message = error.message;
    if ('status' in error && typeof error.status === 'number') {
      detail.status = error.status;
    }
    if ('notFound' in error && typeof error.notFound === 'boolean') {
      detail.notFound = error.notFound;
    }
  } else {
    detail.error = error;
  }

  logTravelSurvey('error', `${method} ${url} failed`, {
    level: 'error',
    detail,
  });
}
