import {
  resolveDistrictIdFromCoordinate,
  resolveEventZoneFromCoordinate,
} from '../src/utils/eventZone/zoneResolver';

describe('resolveEventZoneFromCoordinate (PIP + label fallback)', () => {
  const samples: Array<{
    name: string;
    lat: number;
    lng: number;
    zoneId: string;
    districtId?: string | null;
  }> = [
    {
      name: 'suyeong-centroid',
      lat: 35.1654,
      lng: 129.1098,
      districtId: 'CD26500',
      zoneId: 'SUYEONG_NAMGU',
    },
    {
      name: 'suyeong-gwangalli-coast',
      lat: 35.1532,
      lng: 129.1186,
      zoneId: 'SUYEONG_NAMGU',
    },
    {
      name: 'namgu-inland',
      lat: 35.136,
      lng: 129.084,
      districtId: 'CD26290',
      zoneId: 'SUYEONG_NAMGU',
    },
    {
      name: 'yeonje-cityhall',
      lat: 35.1796,
      lng: 129.0756,
      districtId: 'CD26470',
      zoneId: 'CENTRAL_NORTH',
    },
    {
      name: 'dongnae',
      lat: 35.2048,
      lng: 129.0837,
      districtId: 'CD26260',
      zoneId: 'CENTRAL_NORTH',
    },
    {
      name: 'busanjin-seomyeon',
      lat: 35.157,
      lng: 129.0594,
      districtId: 'CD26230',
      zoneId: 'CENTRAL_NORTH',
    },
    {
      name: 'haeundae-inland',
      lat: 35.1635,
      lng: 129.1638,
      districtId: 'CD26350',
      zoneId: 'HAEUNDAE_GIJANG',
    },
  ];

  it.each(samples)('$name → $zoneId', ({ lat, lng, zoneId, districtId }) => {
    if (districtId !== undefined) {
      expect(resolveDistrictIdFromCoordinate({ lat, lng })).toBe(districtId);
    }
    expect(resolveEventZoneFromCoordinate({ lat, lng })).toBe(zoneId);
  });
});
