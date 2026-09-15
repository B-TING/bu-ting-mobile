import {
  BUSAN_DISTRICT_BOUNDARIES,
  BUSAN_DISTRICT_EXTENT,
} from '../src/constants/eventZone/busanDistrictBoundaries';
import { EVENT_ZONE_DISTRICT_IDS } from '../src/constants/eventZone/busanMapPaths';
import type { EventZoneCoordinate, EventZoneId } from '../src/types/eventZone';
import { pointInFlattenedBoundaryRings } from '../src/utils/geo/pointInPolygon';
import {
  resolveDistrictIdFromCoordinate,
  resolveUserEventZone,
} from '../src/utils/eventZone/zoneResolver';

const DISTRICT_ID_TO_ZONE = Object.fromEntries(
  (Object.entries(EVENT_ZONE_DISTRICT_IDS) as [EventZoneId, string[]][]).flatMap(
    ([zoneId, districtIds]) => districtIds.map(id => [id, zoneId]),
  ),
) as Record<string, EventZoneId>;

/** 고정 시드로 재현 가능한 의사난수 */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function ringBBox(rings: EventZoneCoordinate[][]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const ring of rings) {
    for (const p of ring) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }
  }
  return { minLat, maxLat, minLng, maxLng };
}

/** bbox 안에서 PIP로 해당 구에 들어갈 때까지 샘플 */
function samplePointsInDistrict(
  rings: EventZoneCoordinate[][],
  count: number,
  rng: () => number,
  maxAttempts = 8_000,
): EventZoneCoordinate[] {
  const bbox = ringBBox(rings);
  const points: EventZoneCoordinate[] = [];
  let attempts = 0;
  while (points.length < count && attempts < maxAttempts) {
    attempts += 1;
    const lat = bbox.minLat + rng() * (bbox.maxLat - bbox.minLat);
    const lng = bbox.minLng + rng() * (bbox.maxLng - bbox.minLng);
    const point = { lat, lng };
    if (pointInFlattenedBoundaryRings(point, rings)) {
      points.push(point);
    }
  }
  return points;
}

describe('부산 구·군 랜덤 좌표 → 예상 채팅 구역', () => {
  const SAMPLES_PER_DISTRICT = 20;
  const rng = createRng(20260916);

  it.each(
    BUSAN_DISTRICT_BOUNDARIES.map(boundary => ({
      districtId: boundary.districtId,
      labelKo: boundary.labelKo,
      expectedZone: DISTRICT_ID_TO_ZONE[boundary.districtId],
      rings: boundary.rings,
    })),
  )(
    '$labelKo ($districtId) → $expectedZone',
    ({ districtId, labelKo, expectedZone, rings }) => {
      expect(expectedZone).toBeDefined();

      const samples = samplePointsInDistrict(rings, SAMPLES_PER_DISTRICT, rng);
      expect(samples.length).toBe(SAMPLES_PER_DISTRICT);

      const failures: string[] = [];
      for (const point of samples) {
        const resolvedDistrict = resolveDistrictIdFromCoordinate(point);
        const zone = resolveUserEventZone(point);
        if (resolvedDistrict !== districtId || zone !== expectedZone) {
          failures.push(
            `${labelKo} (${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})` +
              ` → district=${resolvedDistrict} zone=${zone}` +
              ` (expected ${districtId}/${expectedZone})`,
          );
        }
      }

      expect(failures).toEqual([]);
    },
  );

  it('부산 extent 랜덤 점: PIP 구가 있으면 존 매핑이 일치한다', () => {
    const samples = 200;
    let insideCount = 0;
    const mismatches: string[] = [];

    for (let i = 0; i < samples; i += 1) {
      const point = {
        lat:
          BUSAN_DISTRICT_EXTENT.minLat +
          rng() * (BUSAN_DISTRICT_EXTENT.maxLat - BUSAN_DISTRICT_EXTENT.minLat),
        lng:
          BUSAN_DISTRICT_EXTENT.minLng +
          rng() * (BUSAN_DISTRICT_EXTENT.maxLng - BUSAN_DISTRICT_EXTENT.minLng),
      };
      const districtId = resolveDistrictIdFromCoordinate(point);
      const zone = resolveUserEventZone(point);
      if (!districtId) {
        continue;
      }
      insideCount += 1;
      const expected = DISTRICT_ID_TO_ZONE[districtId];
      if (zone !== expected) {
        mismatches.push(
          `(${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})` +
            ` district=${districtId} zone=${zone} expected=${expected}`,
        );
      }
    }

    expect(insideCount).toBeGreaterThan(40);
    expect(mismatches).toEqual([]);
  });

  it('구별 샘플 요약 로그 (수동 확인용)', () => {
    const summary = BUSAN_DISTRICT_BOUNDARIES.map(boundary => {
      const expectedZone = DISTRICT_ID_TO_ZONE[boundary.districtId];
      const [sample] = samplePointsInDistrict(boundary.rings, 1, createRng(boundary.districtId.length * 97));
      expect(sample).toBeDefined();
      const zone = resolveUserEventZone(sample!);
      return {
        district: boundary.labelKo,
        lat: Number(sample!.lat.toFixed(5)),
        lng: Number(sample!.lng.toFixed(5)),
        expected: expectedZone,
        got: zone,
        ok: zone === expectedZone,
      };
    });

    // eslint-disable-next-line no-console
    console.table(summary);
    expect(summary.every(row => row.ok)).toBe(true);
  });
});
