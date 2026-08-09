import type { BusanPlace } from '../src/types/placeSearch';
import { PLACE_CONTENT_TYPE } from '../src/types/placesApi';
import { act, renderHook } from './helpers/renderHook';

const mockSearchPlacesByKeyword = jest.fn();
const mockFetchPlaceDetailsForList = jest.fn();
const mockMergeDetails = jest.fn();
const mockLogPlacesApiError = jest.fn();

jest.mock('../src/services/places/placesApiService', () => ({
  searchPlacesByKeyword: (...args: unknown[]) => mockSearchPlacesByKeyword(...args),
  fetchPlaceDetailsForList: (...args: unknown[]) => mockFetchPlaceDetailsForList(...args),
}));

jest.mock('../src/utils/places/placesApiLogger', () => ({
  logPlacesApiError: (...args: unknown[]) => mockLogPlacesApiError(...args),
}));

jest.mock('../src/stores', () => ({
  usePlaceDetailCacheStore: (selector: (s: { mergeDetails: typeof mockMergeDetails }) => unknown) =>
    selector({ mergeDetails: mockMergeDetails }),
  placeSearchCatchMessage: jest.requireActual('../src/stores/usePlaceSearchStore')
    .placeSearchCatchMessage,
}));

import { usePlaceMapKeywordSearch } from '../src/hooks/places/usePlaceMapKeywordSearch';

const place: BusanPlace = {
  id: 'p1',
  contentId: 'c1',
  contentTypeId: PLACE_CONTENT_TYPE.attraction,
  name: '해운대',
  address: '부산',
  location: { lat: 35.16, lng: 129.16 },
  rating: 4.5,
  userRatingsTotal: 10,
};

const copy = {
  searchNoResults: '결과 없음',
  searchServerError: '서버 오류',
};

describe('usePlaceMapKeywordSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchPlaceDetailsForList.mockResolvedValue({});
  });

  it('ignores blank keywords', async () => {
    const { result } = renderHook(() => usePlaceMapKeywordSearch({ copy }));

    await act(async () => {
      await result.current.runKeywordSearch('   ', PLACE_CONTENT_TYPE.attraction);
    });

    expect(mockSearchPlacesByKeyword).not.toHaveBeenCalled();
    expect(result.current.isKeywordMode).toBe(false);
  });

  it('loads places and enters keyword mode on success', async () => {
    mockSearchPlacesByKeyword.mockResolvedValue({ places: [place] });
    const onSearchStart = jest.fn();
    const onFirstResult = jest.fn();

    const { result } = renderHook(() =>
      usePlaceMapKeywordSearch({ copy, onSearchStart, onFirstResult }),
    );

    await act(async () => {
      await result.current.runKeywordSearch('해운대', PLACE_CONTENT_TYPE.attraction);
    });

    expect(onSearchStart).toHaveBeenCalled();
    expect(onFirstResult).toHaveBeenCalledWith(place.location);
    expect(result.current.isKeywordMode).toBe(true);
    expect(result.current.activeKeyword).toBe('해운대');
    expect(result.current.keywordPlaces).toHaveLength(1);
    expect(result.current.keywordErrorMessage).toBeNull();
    expect(result.current.keywordLoading).toBe(false);
    expect(mockMergeDetails).toHaveBeenCalled();
  });

  it('shows no-results message when API returns empty list', async () => {
    mockSearchPlacesByKeyword.mockResolvedValue({ places: [] });

    const { result } = renderHook(() => usePlaceMapKeywordSearch({ copy }));

    await act(async () => {
      await result.current.runKeywordSearch('없는곳', PLACE_CONTENT_TYPE.attraction);
    });

    expect(result.current.keywordPlaces).toEqual([]);
    expect(result.current.keywordErrorMessage).toBe('결과 없음');
    expect(result.current.keywordLoading).toBe(false);
  });

  it('maps 404 search errors to no-results copy', async () => {
    mockSearchPlacesByKeyword.mockRejectedValue(
      Object.assign(new Error('Places request failed (404)'), { status: 404 }),
    );

    const { result } = renderHook(() => usePlaceMapKeywordSearch({ copy }));

    await act(async () => {
      await result.current.runKeywordSearch('없는곳', PLACE_CONTENT_TYPE.attraction);
    });

    expect(result.current.keywordErrorMessage).toBe('결과 없음');
    expect(mockLogPlacesApiError).toHaveBeenCalled();
  });

  it('maps 5xx search errors to server-error copy', async () => {
    mockSearchPlacesByKeyword.mockRejectedValue(
      Object.assign(new Error('server boom'), { status: 500 }),
    );

    const { result } = renderHook(() => usePlaceMapKeywordSearch({ copy }));

    await act(async () => {
      await result.current.runKeywordSearch('해운대', PLACE_CONTENT_TYPE.attraction);
    });

    expect(result.current.keywordErrorMessage).toBe('서버 오류');
  });

  it('clearKeyword resets keyword mode', async () => {
    mockSearchPlacesByKeyword.mockResolvedValue({ places: [place] });

    const { result } = renderHook(() => usePlaceMapKeywordSearch({ copy }));

    await act(async () => {
      await result.current.runKeywordSearch('해운대', PLACE_CONTENT_TYPE.attraction);
    });
    expect(result.current.isKeywordMode).toBe(true);

    act(() => {
      result.current.clearKeyword();
    });

    expect(result.current.isKeywordMode).toBe(false);
    expect(result.current.activeKeyword).toBeNull();
    expect(result.current.keywordPlaces).toEqual([]);
    expect(result.current.keywordDraft).toBe('');
  });
});
