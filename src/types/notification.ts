/** 백엔드 NotificationType enum 과 동일 */
export const NOTIFICATION_TYPES = [
  'ROUND_OPEN',
  'ROUND_PREVIEW',
  'LIKE_DEADLINE',
  'SETTLEMENT',
  'TITLE_PROGRESS',
  'OPERATOR',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type DevicePlatform = 'ANDROID' | 'IOS';

export type DeviceTokenRequest = {
  fcmToken: string;
  platform: DevicePlatform;
};

export type NotificationSettingsMap = Record<NotificationType, boolean>;

export type NotificationSettingsResponse = {
  settings: Partial<Record<string, boolean>> | Record<string, boolean>;
};

export function emptyNotificationSettings(
  defaultEnabled = true,
): NotificationSettingsMap {
  return {
    ROUND_OPEN: defaultEnabled,
    ROUND_PREVIEW: defaultEnabled,
    LIKE_DEADLINE: defaultEnabled,
    SETTLEMENT: defaultEnabled,
    TITLE_PROGRESS: defaultEnabled,
    OPERATOR: defaultEnabled,
  };
}

export function normalizeNotificationSettings(
  raw: Partial<Record<string, boolean>> | null | undefined,
): NotificationSettingsMap {
  const base = emptyNotificationSettings(true);
  if (!raw) {
    return base;
  }
  for (const type of NOTIFICATION_TYPES) {
    if (typeof raw[type] === 'boolean') {
      base[type] = raw[type]!;
    }
  }
  return base;
}
