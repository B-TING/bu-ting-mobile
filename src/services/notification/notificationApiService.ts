import { API_BASE_URL, USER_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  DeviceTokenRequest,
  NotificationSettingsMap,
  NotificationSettingsResponse,
  NotificationType,
} from '../../types/notification';
import { normalizeNotificationSettings } from '../../types/notification';
import { ApiClientError, apiDelete, apiGet, apiPatch, apiPut } from '../api/apiClient';

export class NotificationApiError extends ApiClientError {
  constructor(message: string, status?: number) {
    super(message, { status });
    this.name = 'NotificationApiError';
  }
}

function mapError(error: ApiClientError): NotificationApiError {
  return new NotificationApiError(error.message, error.status);
}

export async function registerDeviceToken(
  accessToken: string,
  request: DeviceTokenRequest,
): Promise<void> {
  const url = `${API_BASE_URL}${USER_ENDPOINTS.deviceTokens}`;
  await apiPut(url, {
    accessToken,
    body: request,
    errorMessagePrefix: 'Device token register failed',
    mapError,
  });
}

export async function deleteDeviceToken(
  accessToken: string,
  fcmToken: string,
): Promise<void> {
  const url = `${API_BASE_URL}${USER_ENDPOINTS.deviceTokenByValue(fcmToken)}`;
  await apiDelete(url, {
    accessToken,
    errorMessagePrefix: 'Device token delete failed',
    mapError,
  });
}

export async function fetchNotificationSettings(
  accessToken: string,
): Promise<NotificationSettingsMap> {
  const url = `${API_BASE_URL}${USER_ENDPOINTS.notificationSettings}`;
  const data = await apiGet<NotificationSettingsResponse>(url, {
    accessToken,
    errorMessagePrefix: 'Notification settings fetch failed',
    mapError,
  });
  return normalizeNotificationSettings(data?.settings);
}

/** PATCH body is flat `{ ROUND_OPEN: true }` (not nested under settings). */
export async function patchNotificationSettings(
  accessToken: string,
  patch: Partial<Record<NotificationType, boolean>>,
): Promise<NotificationSettingsMap> {
  const url = `${API_BASE_URL}${USER_ENDPOINTS.notificationSettings}`;
  const data = await apiPatch<NotificationSettingsResponse>(url, {
    accessToken,
    body: patch,
    errorMessagePrefix: 'Notification settings update failed',
    mapError,
  });
  return normalizeNotificationSettings(data?.settings);
}
