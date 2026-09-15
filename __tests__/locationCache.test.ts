import { getCachedCoordinates, useLocationStore } from '../src/stores/useLocationStore';
import {
  isAccurateEnoughForZone,
  isFreshLocationCache,
} from '../src/utils/location/locationCache';

describe('isFreshLocationCache', () => {
  it('rejects missing timestamp', () => {
    expect(isFreshLocationCache(null, 1000, 45_000)).toBe(false);
  });

  it('accepts a sample within max age', () => {
    expect(isFreshLocationCache(1000, 20_000, 45_000)).toBe(true);
  });

  it('rejects a sample older than max age', () => {
    expect(isFreshLocationCache(1000, 50_000, 45_000)).toBe(false);
  });
});

describe('getCachedCoordinates', () => {
  beforeEach(() => {
    useLocationStore.getState().clear();
  });

  it('returns null when empty', () => {
    expect(getCachedCoordinates()).toBeNull();
  });

  it('returns coords while the cache is fresh', () => {
    useLocationStore.getState().setCoords({ lat: 35.15, lng: 129.16 });
    expect(getCachedCoordinates()).toEqual({ lat: 35.15, lng: 129.16 });
  });

  it('returns null when older than maxAge', () => {
    useLocationStore.getState().setCoords({ lat: 35.15, lng: 129.16 }, Date.now() - 60_000);
    expect(getCachedCoordinates(45_000)).toBeNull();
  });
});

describe('isAccurateEnoughForZone', () => {
  it('accepts missing accuracy', () => {
    expect(isAccurateEnoughForZone(undefined)).toBe(true);
  });

  it('accepts accuracy within the zone threshold', () => {
    expect(isAccurateEnoughForZone(120)).toBe(true);
  });

  it('rejects coarse accuracy', () => {
    expect(isAccurateEnoughForZone(800)).toBe(false);
  });
});
