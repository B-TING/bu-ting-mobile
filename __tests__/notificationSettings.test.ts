import {
  emptyNotificationSettings,
  normalizeNotificationSettings,
} from '../src/types/notification';

describe('normalizeNotificationSettings', () => {
  it('defaults all types to true when raw is empty', () => {
    expect(normalizeNotificationSettings(undefined)).toEqual(
      emptyNotificationSettings(true),
    );
  });

  it('merges known keys and ignores unknown', () => {
    expect(
      normalizeNotificationSettings({
        ROUND_OPEN: false,
        UNKNOWN: true,
        OPERATOR: false,
      } as Record<string, boolean>),
    ).toEqual({
      ...emptyNotificationSettings(true),
      ROUND_OPEN: false,
      OPERATOR: false,
    });
  });
});
