import {
  resolveDistrictIdFromCoordinate,
  resolveEventZoneFromCoordinate,
  resolveEventZoneFromDistrictPolygon,
  resolveUserEventZone,
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

describe('resolveUserEventZone (PIP + 200m, no map AABB / label)', () => {
  const GIJANG_EAST = { lat: 35.318, lng: 129.258 };
  const ULSAN = { lat: 35.538, lng: 129.311 };
  const SUYEONG = { lat: 35.1654, lng: 129.1098 };

  it('keeps 기장 even when the old map AABB would exclude it', () => {
    expect(GIJANG_EAST.lat > 35.3 || GIJANG_EAST.lng > 129.24).toBe(true);
    expect(resolveUserEventZone(GIJANG_EAST)).toBe('HAEUNDAE_GIJANG');
  });

  it('returns null far outside Busan instead of nearest SVG label', () => {
    expect(resolveUserEventZone(ULSAN)).toBeNull();
    expect(resolveEventZoneFromDistrictPolygon(ULSAN)).toBeNull();
  });

  it('still resolves a swimming-gu interior point', () => {
    expect(resolveUserEventZone(SUYEONG)).toBe('SUYEONG_NAMGU');
  });

  it('uses the 200m edge fallback just outside a district ring', () => {
    // 수영 내부에서 남동으로 나와 PIP 밖·약 7m 지점.
    const justOutside = { lat: 35.1567, lng: 129.1185 };
    expect(resolveDistrictIdFromCoordinate(justOutside)).toBeNull();
    expect(resolveUserEventZone(justOutside)).toBe('SUYEONG_NAMGU');
  });
});
