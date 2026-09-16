import {
  mapStorageLocationToLockerStation,
  mapStorageLocationsToLockerStations,
} from '../src/services/locker/storageLocationMapper';

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

  it('maps OpenAPI counts nested object and 1호선 line', () => {
    const station = mapStorageLocationToLockerStation({
      line: '1호선',
      stationName: '초량',
      locationDetail: '(B1) 8번출입구 방향',
      latitude: 35.121168,
      longitude: 129.043039,
      distanceMeters: 668,
      openNow: true,
      counts: { small: 10, medium: 8, large: 0, extraLarge: 4 },
      cost: '특대: 6,000원 / 대:4,000원 / 중: 3,000원 / 소: 2,000원(3시간당)',
      company: '위드락커',
      fees: [
        {
          schedule: 'DEFAULT',
          items: [
            { size: 'EXTRA_LARGE', amount: 6000, unit: '3시간당' },
            { size: 'LARGE', amount: 4000, unit: '3시간당' },
            { size: 'MEDIUM', amount: 3000, unit: '3시간당' },
            { size: 'SMALL', amount: 2000, unit: '3시간당' },
          ],
        },
      ],
    });

    expect(station).toMatchObject({
      line: 1,
      name: '초량',
      lockers: { small: 10, medium: 8, large: 0, extraLarge: 4, total: 22 },
      company: '위드락커',
      fees: [
        {
          schedule: 'default',
          items: [
            { size: 'extraLarge', amount: 6000, unit: '3시간당' },
            { size: 'large', amount: 4000, unit: '3시간당' },
            { size: 'medium', amount: 3000, unit: '3시간당' },
            { size: 'small', amount: 2000, unit: '3시간당' },
          ],
        },
      ],
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

describe('mapStorageLocationsToLockerStations', () => {
  it('drops duplicate stations from the API payload', () => {
    const duplicate = {
      line: '1호선',
      stationName: '초량',
      locationDetail: '(B1) 8번출입구 방향',
      latitude: 35.121168,
      longitude: 129.043039,
      counts: { small: 10, medium: 8, large: 0, extraLarge: 4 },
    };

    const stations = mapStorageLocationsToLockerStations([duplicate, duplicate]);

    expect(stations).toHaveLength(1);
    expect(stations[0].lockers.total).toBe(22);
  });

  it('keeps same-name stations with different location details', () => {
    const stations = mapStorageLocationsToLockerStations([
      {
        line: '2호선',
        stationName: '서면',
        locationDetail: '(B1) 표내는 곳 인근',
        latitude: 35.15774,
        longitude: 129.059084,
        counts: { small: 38, medium: 64, large: 14, extraLarge: 46 },
      },
      {
        line: '2호선',
        stationName: '서면',
        locationDetail: '(B1) 서면롯데백화점 출입구 방향',
        latitude: 35.15774,
        longitude: 129.059084,
        counts: { small: 58, medium: 0, large: 22, extraLarge: 30 },
      },
    ]);

    expect(stations).toHaveLength(2);
    expect(stations.map(station => station.lockers.total)).toEqual([162, 110]);
  });
});
