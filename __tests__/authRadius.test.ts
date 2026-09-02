import type { ZoneEvent } from '../src/types/eventZone';
import {
  distanceMetersBetween,
  evaluateAuthRadius,
  isWithinAuthRadius,
} from '../src/utils/eventZone/authRadius';

const baseEvent: ZoneEvent = {
  id: 'evt-1',
  type: 'place_auth',
  zoneId: 'HAEUNDAE_GIJANG',
  titleKo: '테스트',
  descriptionKo: '테스트',
  startsAt: new Date().toISOString(),
  durationMinutes: 60,
  authLatitude: 35.1587,
  authLongitude: 129.1604,
  authRadiusM: 150,
};

describe('authRadius', () => {
  it('returns inside when user is within radius', () => {
    const user = { lat: 35.1587, lng: 129.1604 };
    const result = evaluateAuthRadius(user, baseEvent);
    expect(result.status).toBe('inside');
    if (result.status === 'inside') {
      expect(result.distanceM).toBeLessThanOrEqual(1);
      expect(result.radiusM).toBe(150);
    }
    expect(isWithinAuthRadius(user, baseEvent)).toBe(true);
  });

  it('returns outside when user is beyond radius', () => {
    const user = { lat: 35.17, lng: 129.18 };
    const result = evaluateAuthRadius(user, baseEvent);
    expect(result.status).toBe('outside');
    if (result.status === 'outside') {
      expect(result.distanceM).toBeGreaterThan(150);
    }
    expect(isWithinAuthRadius(user, baseEvent)).toBe(false);
  });

  it('treats missing user coords as outside', () => {
    const result = evaluateAuthRadius(null, baseEvent);
    expect(result.status).toBe('outside');
  });

  it('measures meters between two points', () => {
    const meters = distanceMetersBetween(
      { lat: 35.1587, lng: 129.1604 },
      { latitude: 35.1587, longitude: 129.1604 },
    );
    expect(meters).toBeLessThan(1);
  });
});
