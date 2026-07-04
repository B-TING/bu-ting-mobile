import { API_BASE_URL, TRAVEL_SURVEY_ENDPOINTS } from '../../constants/api/apiConfig';
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
import { ApiClientError, apiGet, apiPut } from '../api/apiClient';
import {
  fromTravelSurveyResponse,
  shouldSyncTravelSurvey,
  toTravelSurveyRequest,
} from './travelSurveyMapper';

export class TravelSurveyServiceError extends ApiClientError {
  notFound?: boolean;

  constructor(message: string, status?: number, notFound = false) {
    super(message, { status });
    this.name = 'TravelSurveyServiceError';
    this.notFound = notFound;
  }
}

const SURVEY_URL = `${API_BASE_URL}${TRAVEL_SURVEY_ENDPOINTS.profile}`;

function mapTravelSurveyError(error: ApiClientError): TravelSurveyServiceError {
  return new TravelSurveyServiceError(error.message, error.status, error.status === 400);
}

function isTravelSurveyPayload(
  value: TravelSurveyProfileResponse | undefined,
): value is TravelSurveyProfileResponse {
  return Boolean(value && 'preferredLanguage' in value);
}

export async function fetchTravelSurvey(
  accessToken: string,
  options?: { userId?: string },
): Promise<TravelSurveyProfileResponse | null> {
  const userId = options?.userId;

  const data = await apiGet<TravelSurveyProfileResponse>(SURVEY_URL, {
    accessToken,
    emptyOnStatus: [400],
    errorMessagePrefix: 'Travel survey request failed',
    mapError: mapTravelSurveyError,
    onRequest: () => {
      logTravelSurveyRequest('GET', SURVEY_URL, { userId, accessToken });
    },
    onResponse: ({ status, body }) => {
      logTravelSurveyResponse('GET', SURVEY_URL, status, body, {
        userId,
        notFound: status === 400,
      });
    },
    onError: error => {
      logTravelSurveyError('GET', SURVEY_URL, error, { userId });
    },
  });

  if (!isTravelSurveyPayload(data)) {
    logTravelSurvey('parse', 'GET response had no survey payload', {
      level: 'warn',
      detail: { userId },
    });
    return null;
  }

  return data;
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
  const userId = options?.userId ?? profile.ownerUserId ?? undefined;

  try {
    const data = await apiPut<TravelSurveyProfileResponse>(SURVEY_URL, {
      accessToken,
      body: request,
      errorMessagePrefix: 'Travel survey request failed',
      mapError: mapTravelSurveyError,
      onRequest: () => {
        logTravelSurveyRequest('PUT', SURVEY_URL, { userId, accessToken, requestBody: request });
      },
      onResponse: ({ status, body }) => {
        logTravelSurveyResponse('PUT', SURVEY_URL, status, body, { userId });
      },
      onError: error => {
        logTravelSurveyError('PUT', SURVEY_URL, error, { userId });
      },
    });

    if (!isTravelSurveyPayload(data)) {
      const invalid = new TravelSurveyServiceError('Invalid travel survey response.');
      logTravelSurveyError('PUT', SURVEY_URL, invalid, { userId });
      throw invalid;
    }

    return data;
  } catch (error) {
    if (error instanceof TravelSurveyServiceError) {
      throw error;
    }
    if (error instanceof ApiClientError) {
      const mapped = mapTravelSurveyError(error);
      logTravelSurveyError('PUT', SURVEY_URL, mapped, { userId });
      throw mapped;
    }
    logTravelSurveyError('PUT', SURVEY_URL, error, { userId });
    throw error;
  }
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
