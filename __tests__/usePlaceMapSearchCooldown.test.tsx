import { PLACE_SEARCH_REFRESH_COOLDOWN_MS } from '../src/constants/places/placeSearch';
import { usePlaceMapSearchCooldown } from '../src/hooks/places/usePlaceMapSearchCooldown';
import { act, renderHook } from './helpers/renderHook';

describe('usePlaceMapSearchCooldown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is inactive when lastSearchRequestedAt is null', () => {
    const { result } = renderHook(() => usePlaceMapSearchCooldown(null));
    expect(result.current.isActive).toBe(false);
    expect(result.current.remainingMs).toBe(0);
  });

  it('is active immediately after a search request', () => {
    const now = Date.now();
    jest.setSystemTime(now);

    const { result } = renderHook(() => usePlaceMapSearchCooldown(now));
    expect(result.current.isActive).toBe(true);
    expect(result.current.remainingMs).toBe(PLACE_SEARCH_REFRESH_COOLDOWN_MS);
    expect(result.current.seconds).toBe(10);
  });

  it('becomes inactive after the cooldown elapses', () => {
    const now = Date.now();
    jest.setSystemTime(now);

    const { result } = renderHook(() => usePlaceMapSearchCooldown(now));
    expect(result.current.isActive).toBe(true);

    act(() => {
      jest.advanceTimersByTime(PLACE_SEARCH_REFRESH_COOLDOWN_MS + 250);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.remainingMs).toBe(0);
  });
});
