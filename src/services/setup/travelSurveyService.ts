import { API_BASE_URL, TRAVEL_SURVEY_ENDPOINTS } from '../../constants/api/apiConfig';
import type { ApiEnvelope, ApiErrorResponse } from '../../types/auth';
import type {
  TravelSurveyProfileRequest,
  TravelSurveyProfileResponse,
} from '../../types/travelSurvey';
import type { OnboardingProfile } from '../../types/user';
import {
  logTravelSurvey,
  logTravelSurveyError,
  logTravelSurveyRequest,
  logTravelSurveyResponse,
} from '../../utils/setup/travelSurveyLogger';
import {
  fromTravelSurveyResponse,
  shouldSyncTravelSurvey,
  toTravelSurveyRequest,
} from './travelSurveyMapper';

export class TravelSurveyServiceError extends Error {
  status?: number;
  notFound?: boolean;

  constructor(message: string, status?: number, notFound = false) {
    super(message);
    this.name = 'TravelSurveyServiceError';
    this.status = status;
    this.notFound = notFound;
  }
}

const SURVEY_URL = `${API_BASE_URL}${TRAVEL_SURVEY_ENDPOINTS.profile}`;

function authHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseError(res: Response, body: unknown): Promise<TravelSurveyServiceError> {
  const message =
    (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
      ? body.message
      : null) || `Travel survey request failed (${res.status})`;
  return new TravelSurveyServiceError(message, res.status, res.status === 400);
}

export async function fetchTravelSurvey(
  accessToken: string,
  options?: { userId?: string },
): Promise<TravelSurveyProfileResponse | null> {
  logTravelSurveyRequest('GET', SURVEY_URL, {
    userId: options?.userId,
    accessToken,
  });

  let res: Response;
  let body: ApiEnvelope<TravelSurveyProfileResponse> | ApiErrorResponse | TravelSurveyProfileResponse | null;

  try {
    res = await fetch(SURVEY_URL, {
      method: 'GET',
      headers: authHeaders(accessToken),
    });
    body = (await res.json().catch(() => null)) as typeof body;
  } catch (error) {
    logTravelSurveyError('GET', SURVEY_URL, error, { userId: options?.userId });
    throw error;
  }

  logTravelSurveyResponse('GET', SURVEY_URL, res.status, body, {
    userId: options?.userId,
    notFound: res.status === 400,
  });

  if (res.status === 400) {
    return null;
  }

  if (!res.ok) {
    const parsed = await parseError(res, body);
    logTravelSurveyError('GET', SURVEY_URL, parsed, { userId: options?.userId });
    throw parsed;
  }

  if (body && 'data' in body && body.data) {
    return body.data;
  }

  if (body && 'preferredLanguage' in body) {
    return body as TravelSurveyProfileResponse;
  }

  logTravelSurvey('parse', 'GET response had no survey payload', {
    level: 'warn',
    detail: { userId: options?.userId },
  });
  return null;
}

export async function putTravelSurvey(
  accessToken: string,
  profile: OnboardingProfile,
  options?: { userId?: string },
): Promise<TravelSurveyProfileResponse> {
  if (!shouldSyncTravelSurvey(profile)) {
    logTravelSurvey('skip', 'PUT skipped — skippedAll is true', {
      detail: { userId: options?.userId ?? profile.ownerUserId },
    });
    throw new TravelSurveyServiceError('Skipped onboarding is not synced to server.');
  }

  const request: TravelSurveyProfileRequest = toTravelSurveyRequest(profile);
  logTravelSurveyRequest('PUT', SURVEY_URL, {
    userId: options?.userId ?? profile.ownerUserId ?? undefined,
    accessToken,
    requestBody: request,
  });

  let res: Response;
  let body: ApiEnvelope<TravelSurveyProfileResponse> | ApiErrorResponse | TravelSurveyProfileResponse | null;

  try {
    res = await fetch(SURVEY_URL, {
      method: 'PUT',
      headers: authHeaders(accessToken),
      body: JSON.stringify(request),
    });
    body = (await res.json().catch(() => null)) as typeof body;
  } catch (error) {
    logTravelSurveyError('PUT', SURVEY_URL, error, {
      userId: options?.userId ?? profile.ownerUserId ?? undefined,
    });
    throw error;
  }

  logTravelSurveyResponse('PUT', SURVEY_URL, res.status, body, {
    userId: options?.userId ?? profile.ownerUserId ?? undefined,
  });

  if (!res.ok) {
    const parsed = await parseError(res, body);
    logTravelSurveyError('PUT', SURVEY_URL, parsed, {
      userId: options?.userId ?? profile.ownerUserId ?? undefined,
    });
    throw parsed;
  }

  if (body && 'data' in body && body.data) {
    return body.data;
  }

  if (body && 'preferredLanguage' in body) {
    return body as TravelSurveyProfileResponse;
  }

  const invalid = new TravelSurveyServiceError('Invalid travel survey response.');
  logTravelSurveyError('PUT', SURVEY_URL, invalid, {
    userId: options?.userId ?? profile.ownerUserId ?? undefined,
  });
  throw invalid;
}

export async function putTravelSurveyProfile(
  accessToken: string,
  profile: OnboardingProfile,
  ownerUserId: string,
  fallbackLanguage: OnboardingProfile['language'],
): Promise<OnboardingProfile> {
  const response = await putTravelSurvey(accessToken, profile, { userId: ownerUserId });
  return fromTravelSurveyResponse(response, fallbackLanguage, ownerUserId);
}

export async function fetchTravelSurveyProfile(
  accessToken: string,
  ownerUserId: string,
  fallbackLanguage: OnboardingProfile['language'],
): Promise<OnboardingProfile | null> {
  const response = await fetchTravelSurvey(accessToken, { userId: ownerUserId });
  if (!response) {
    return null;
  }
  return fromTravelSurveyResponse(response, fallbackLanguage, ownerUserId);
}
