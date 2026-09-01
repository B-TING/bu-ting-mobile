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
const mockFetchRoutePlaceImageViaKeywordSearch = jest.fn();

jest.mock('../src/utils/places/routePlaceDetail', () => ({
  fetchRoutePlaceDetail: (...args: unknown[]) => mockFetchRoutePlaceDetail(...args),
  fetchRoutePlaceImageViaKeywordSearch: (...args: unknown[]) =>
    mockFetchRoutePlaceImageViaKeywordSearch(...args),
  isRouteImageOnlyDetail: (detail: { reviews?: unknown[]; editorialSummary?: string; photos?: unknown[]; tourismRawDetails?: unknown }) =>
    !detail.editorialSummary?.trim() &&
    (detail.reviews?.length ?? 0) === 0 &&
    (detail.photos?.length ?? 0) === 0 &&
    !detail.tourismRawDetails,
  shouldPrefetchRouteDetail: (route: { placeId: string; placeInfo?: { imageUrl?: string } }) =>
    Boolean(route.placeId) && !route.placeInfo?.imageUrl?.trim(),
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
    mockFetchRoutePlaceImageViaKeywordSearch.mockReset();
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
    mockFetchRoutePlaceDetail.mockResolvedValue({
      ...detail('광안리'),
      editorialSummary: '광안리 해수욕장',
      reviews: [{ authorName: 'guest', rating: 5, text: '좋아요' }],
      photos: [],
    });

    await usePlaceDetailCacheStore
      .getState()
      .fetchForRoute('100', 'ATTRACTION', { placeName: '광안리' });
    await usePlaceDetailCacheStore
      .getState()
      .fetchForRoute('100', 'ATTRACTION', { placeName: '광안리' });

    expect(mockFetchRoutePlaceDetail).toHaveBeenCalledTimes(1);
  });

  it('seeds imageUrl for immediate route card display', () => {
    usePlaceDetailCacheStore.getState().seedImageUrl('126535', 'https://example.com/a.jpg', {
      name: '해운대',
      address: '부산 해운대구',
    });

    expect(usePlaceDetailCacheStore.getState().getDetail('126535')?.imageUrl).toBe(
      'https://example.com/a.jpg',
    );
    expect(usePlaceDetailCacheStore.getState().getDetail('126535')?.name).toBe('해운대');
  });

  it('does not overwrite an existing cached imageUrl when seeding', () => {
    usePlaceDetailCacheStore.getState().mergeDetails({
      seeded: {
        ...detail('기존'),
        googlePlaceId: 'seeded',
        imageUrl: 'https://example.com/original.jpg',
      },
    });

    usePlaceDetailCacheStore.getState().seedImageUrl('seeded', 'https://example.com/new.jpg');

    expect(usePlaceDetailCacheStore.getState().getDetail('seeded')?.imageUrl).toBe(
      'https://example.com/original.jpg',
    );
  });

  it('prefetches route images via keyword search, not detail API', async () => {
    mockFetchRoutePlaceImageViaKeywordSearch.mockResolvedValue({
      ...detail('해운대'),
      googlePlaceId: '126535',
      imageUrl: 'https://example.com/haeundae.jpg',
    });

    usePlaceDetailCacheStore.getState().prefetchRoutes([
      {
        itemId: 'r1',
        sequence: 1,
        placeId: '126535',
        placeName: '해운대해수욕장',
        type: 'ATTRACTION',
        location: { lat: 35.1587, lng: 129.1604 },
        isVisited: false,
      },
    ]);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockFetchRoutePlaceImageViaKeywordSearch).toHaveBeenCalledTimes(1);
    expect(mockFetchRoutePlaceDetail).not.toHaveBeenCalled();
    expect(usePlaceDetailCacheStore.getState().getDetail('126535')?.imageUrl).toBe(
      'https://example.com/haeundae.jpg',
    );
  });

  it('still fetches full detail when opening place detail after image prefetch', async () => {
    mockFetchRoutePlaceImageViaKeywordSearch.mockResolvedValue({
      ...detail('해운대'),
      googlePlaceId: '126535',
      imageUrl: 'https://example.com/haeundae.jpg',
    });
    mockFetchRoutePlaceDetail.mockResolvedValue({
      ...detail('해운대'),
      googlePlaceId: '126535',
      imageUrl: 'https://example.com/haeundae-detail.jpg',
      editorialSummary: '부산 대표 해수욕장',
      reviews: [{ authorName: 'guest', rating: 5, text: '좋아요' }],
      photos: [],
    });

    await usePlaceDetailCacheStore.getState().prefetchImageForRoute({
      itemId: 'r1',
      sequence: 1,
      placeId: '126535',
      placeName: '해운대해수욕장',
      type: 'ATTRACTION',
      location: { lat: 35.1587, lng: 129.1604 },
      isVisited: false,
    });

    const full = await usePlaceDetailCacheStore
      .getState()
      .fetchForRoute('126535', 'ATTRACTION', { placeName: '해운대해수욕장' });

    expect(mockFetchRoutePlaceDetail).toHaveBeenCalledTimes(1);
    expect(full?.editorialSummary).toBe('부산 대표 해수욕장');
    expect(full?.imageUrl).toBe('https://example.com/haeundae-detail.jpg');
  });
});
