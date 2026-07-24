jest.mock('../src/constants/api/apiConfig', () => ({
  API_BASE_URL: 'https://api.example.com',
  STORAGE_ENDPOINTS: {
    nearby: '/api/v1/storage-locations',
  },
}));

const mockApiGet = jest.fn();

jest.mock('../src/services/api/apiClient', () => ({
  ApiClientError: class ApiClientError extends Error {
    status?: number;
    url?: string;
    responseBody?: unknown;
    constructor(
      message: string,
      options?: { status?: number; url?: string; responseBody?: unknown },
    ) {
      super(message);
      this.status = options?.status;
      this.url = options?.url;
      this.responseBody = options?.responseBody;
    }
  },
  apiGet: (...args: unknown[]) => mockApiGet(...args),
}));

import { fetchNearbyStorageLocations } from '../src/services/locker/storageLocationService';

describe('storageLocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches nearby storage locations with query params', async () => {
    mockApiGet.mockResolvedValue([
      {
        id: 'st-1',
        name: '서면',
        latitude: 35.1578,
        longitude: 129.0592,
        distanceMeters: 420,
      },
    ]);

    const result = await fetchNearbyStorageLocations({
      longitude: 129.0594,
      latitude: 35.1579,
      radius: 5000,
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('서면');
    expect(mockApiGet).toHaveBeenCalledTimes(1);

    const [url, options] = mockApiGet.mock.calls[0];
    expect(url).toContain('/api/v1/storage-locations');
    expect(url).toContain('longitude=129.0594');
    expect(url).toContain('latitude=35.1579');
    expect(url).toContain('radius=5000');
    expect(options.errorMessagePrefix).toBe('Storage locations request failed');
    expect(typeof options.mapError).toBe('function');
  });

  it('clamps radius to 1..20000 and defaults non-finite values', async () => {
    mockApiGet.mockResolvedValue([]);

    await fetchNearbyStorageLocations({
      longitude: 129.0756,
      latitude: 35.1796,
      radius: 99999,
    });
    expect(mockApiGet.mock.calls[0][0]).toContain('radius=20000');

    await fetchNearbyStorageLocations({
      longitude: 129.0756,
      latitude: 35.1796,
      radius: 0,
    });
    expect(mockApiGet.mock.calls[1][0]).toContain('radius=1');

    await fetchNearbyStorageLocations({
      longitude: 129.0756,
      latitude: 35.1796,
      radius: Number.NaN,
    });
    expect(mockApiGet.mock.calls[2][0]).toContain('radius=5000');
  });

  it('returns empty array when response is null', async () => {
    mockApiGet.mockResolvedValue(null);

    const result = await fetchNearbyStorageLocations({
      longitude: 129.0756,
      latitude: 35.1796,
      radius: 3000,
    });

    expect(result).toEqual([]);
  });

  it('unwraps content envelope arrays', async () => {
    mockApiGet.mockResolvedValue({
      content: [
        { id: 'a', name: '남포', lat: 35.0975, lng: 129.0305 },
        { id: 'b', name: '자갈치', lat: 35.097, lng: 129.026 },
      ],
    });

    const result = await fetchNearbyStorageLocations({
      longitude: 129.03,
      latitude: 35.1,
      radius: 2000,
    });

    expect(result.map(item => item.name)).toEqual(['남포', '자갈치']);
  });

  it('returns empty array for unexpected payload shapes', async () => {
    mockApiGet.mockResolvedValue({ items: [{ name: '서면' }] });

    const result = await fetchNearbyStorageLocations({
      longitude: 129.0594,
      latitude: 35.1579,
      radius: 1000,
    });

    expect(result).toEqual([]);
  });
});
