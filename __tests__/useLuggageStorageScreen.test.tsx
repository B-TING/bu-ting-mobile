jest.mock('../src/i18n', () => ({
  useCopy: () => ({}),
}));

const mockLocation = { lat: 35.1152, lng: 129.0422 };
let mockLocationStatus: 'loading' | 'ready' | 'fallback' = 'ready';

jest.mock('../src/hooks/usePlaceMapUserLocation', () => ({
  usePlaceMapUserLocation: () => ({
    location: mockLocation,
    status: mockLocationStatus,
  }),
}));

const mockFetchStations = jest.fn();

jest.mock('../src/services/locker/subwayLockerService', () => ({
  fetchSubwayLockerStations: (...args: unknown[]) => mockFetchStations(...args),
}));

const mockBookmarkState = {
  bookmarkedStationIds: [] as string[],
  toggleBookmark: jest.fn(),
  isBookmarked: jest.fn(() => false),
};

jest.mock('../src/stores', () => ({
  useLockerBookmarkStore: (selector: (s: typeof mockBookmarkState) => unknown) =>
    selector(mockBookmarkState),
}));

import type { SubwayLockerStation } from '../src/types/subwayLocker';
import { useLuggageStorageScreen } from '../src/hooks/locker/useLuggageStorageScreen';
import { act, renderHook } from './helpers/renderHook';

function station(
  partial: Pick<SubwayLockerStation, 'id' | 'name' | 'line'> &
    Partial<SubwayLockerStation>,
): SubwayLockerStation {
  return {
    locationDetail: '',
    location: { lat: 35.11, lng: 129.04 },
    lockers: { small: 1, medium: 0, large: 0, extraLarge: 0, total: 1 },
    fees: [],
    costRaw: '',
    company: '',
    distanceMeters: 100,
    ...partial,
  };
}

const stations = [
  station({ id: 's1', name: '부산역', line: 1, distanceMeters: 120 }),
  station({ id: 's2', name: '서면역', line: 2, distanceMeters: 800 }),
];

describe('useLuggageStorageScreen', () => {
  beforeEach(() => {
    mockLocationStatus = 'ready';
    mockFetchStations.mockReset();
    mockFetchStations.mockResolvedValue(stations);
    mockBookmarkState.bookmarkedStationIds = [];
    jest.clearAllMocks();
  });

  it('does not fetch while location is loading', () => {
    mockLocationStatus = 'loading';

    const { result } = renderHook(() => useLuggageStorageScreen());

    expect(mockFetchStations).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it('fetches nearby stations after location is ready', async () => {
    const { result } = renderHook(() => useLuggageStorageScreen());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchStations).toHaveBeenCalledWith({
      latitude: mockLocation.lat,
      longitude: mockLocation.lng,
      radius: expect.any(Number),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.stations).toHaveLength(2);
  });

  it('filters stations by subway line', async () => {
    const { result } = renderHook(() => useLuggageStorageScreen());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleLineFilterChange(1);
    });

    expect(result.current.filteredStations).toHaveLength(1);
    expect(result.current.filteredStations[0]?.id).toBe('s1');
  });
});
