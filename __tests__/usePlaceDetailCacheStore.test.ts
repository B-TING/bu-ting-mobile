jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

const mockFetchRoutePlaceDetail = jest.fn();

jest.mock('../src/utils/places/routePlaceDetail', () => ({
  fetchRoutePlaceDetail: (...args: unknown[]) => mockFetchRoutePlaceDetail(...args),
  shouldPrefetchRouteDetail: (route: { placeId: string }) => Boolean(route.placeId),
}));

import type { PlaceDetailVO } from '../src/types/googlePlaces';
import { usePlaceDetailCacheStore } from '../src/stores/usePlaceDetailCacheStore';

function detail(name: string): PlaceDetailVO {
  return {
    name,
    formattedAddress: '부산',
  } as PlaceDetailVO;
}

describe('usePlaceDetailCacheStore null handling', () => {
  beforeEach(() => {
    mockFetchRoutePlaceDetail.mockReset();
    usePlaceDetailCacheStore.setState({
      detailsByPlaceId: {},
      loadingIds: {},
    });
  });

  it('does not cache null results and allows a later retry', async () => {
    mockFetchRoutePlaceDetail.mockResolvedValueOnce(null);

    const first = await usePlaceDetailCacheStore
      .getState()
      .fetchForRoute('126535', 'ATTRACTION', { placeName: '해운대' });

    expect(first).toBeNull();
    expect(usePlaceDetailCacheStore.getState().hasDetail('126535')).toBe(false);
    expect(usePlaceDetailCacheStore.getState().detailsByPlaceId['126535']).toBeUndefined();

    mockFetchRoutePlaceDetail.mockResolvedValueOnce(detail('해운대'));

    const second = await usePlaceDetailCacheStore
      .getState()
      .fetchForRoute('126535', 'ATTRACTION', { placeName: '해운대' });

    expect(second?.name).toBe('해운대');
    expect(usePlaceDetailCacheStore.getState().hasDetail('126535')).toBe(true);
    expect(mockFetchRoutePlaceDetail).toHaveBeenCalledTimes(2);
  });

  it('clears a previously poisoned null entry on merge', () => {
    usePlaceDetailCacheStore.setState({
      detailsByPlaceId: { poisoned: null as never },
      loadingIds: {},
    });

    usePlaceDetailCacheStore.getState().mergeDetails({ poisoned: null });

    expect(usePlaceDetailCacheStore.getState().detailsByPlaceId).not.toHaveProperty('poisoned');
    expect(usePlaceDetailCacheStore.getState().hasDetail('poisoned')).toBe(false);
  });

  it('returns cached detail without refetching on success', async () => {
    mockFetchRoutePlaceDetail.mockResolvedValue(detail('광안리'));

    await usePlaceDetailCacheStore
      .getState()
      .fetchForRoute('100', 'ATTRACTION', { placeName: '광안리' });
    await usePlaceDetailCacheStore
      .getState()
      .fetchForRoute('100', 'ATTRACTION', { placeName: '광안리' });

    expect(mockFetchRoutePlaceDetail).toHaveBeenCalledTimes(1);
  });
});
