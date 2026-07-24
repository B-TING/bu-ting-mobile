import { mapStorageLocationToLockerStation } from '../src/services/locker/storageLocationMapper';

describe('mapStorageLocationToLockerStation', () => {
  it('maps camelCase storage location DTO', () => {
    const station = mapStorageLocationToLockerStation({
      id: 'st-1',
      line: 1,
      name: '서면',
      locationDetail: '대합실',
      latitude: 35.1578,
      longitude: 129.0592,
      distanceMeters: 420,
      smallCount: 4,
      mediumCount: 2,
      largeCount: 1,
      extraLargeCount: 0,
      company: '부산교통공사',
      costRaw: '소 2000원',
    });

    expect(station).toMatchObject({
      id: 'st-1',
      line: 1,
      name: '서면',
      locationDetail: '대합실',
      location: { lat: 35.1578, lng: 129.0592 },
      lockers: { small: 4, medium: 2, large: 1, extraLarge: 0, total: 7 },
      company: '부산교통공사',
      costRaw: '소 2000원',
      distanceMeters: 420,
    });
  });

  it('keeps stations without locker counts', () => {
    const station = mapStorageLocationToLockerStation({
      stationName: '남포',
      lat: 35.0975,
      lng: 129.0305,
      distance: 1500,
    });

    expect(station).toMatchObject({
      name: '남포',
      location: { lat: 35.0975, lng: 129.0305 },
      lockers: { total: 0 },
      distanceMeters: 1500,
    });
  });

  it('returns null when name or coordinates are missing', () => {
    expect(mapStorageLocationToLockerStation({ name: '서면' })).toBeNull();
    expect(
      mapStorageLocationToLockerStation({ latitude: 35.1, longitude: 129.0 }),
    ).toBeNull();
  });
});
