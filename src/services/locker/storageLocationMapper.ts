import type { StorageLocationResponse } from '../../types/storageApi';
import type { SubwayLockerStation } from '../../types/subwayLocker';

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const parsed = asNumber(value);
    if (parsed != null) {
      return parsed;
    }
  }
  return 0;
}

/**
 * StorageLocationResponse → UI SubwayLockerStation.
 * 서버 필드명 변형(camelCase / 공공데이터식)을 흡수합니다.
 */
export function mapStorageLocationToLockerStation(
  dto: StorageLocationResponse,
): SubwayLockerStation | null {
  const name = asString(dto.name) || asString(dto.stationName);
  const lat = firstNumber(dto.latitude, dto.lat);
  const lng = firstNumber(dto.longitude, dto.lng);

  if (!name || (lat === 0 && lng === 0)) {
    return null;
  }

  const small = firstNumber(
    dto.lockers?.small,
    dto.smallCount,
    dto.small,
    dto.cabinetS,
  );
  const medium = firstNumber(
    dto.lockers?.medium,
    dto.mediumCount,
    dto.medium,
    dto.cabinetM,
  );
  const large = firstNumber(
    dto.lockers?.large,
    dto.largeCount,
    dto.large,
    dto.cabinetL,
  );
  const extraLarge = firstNumber(
    dto.lockers?.extraLarge,
    dto.extraLargeCount,
    dto.extraLarge,
    dto.cabinetXl,
  );
  const total =
    firstNumber(dto.lockers?.total) || small + medium + large + extraLarge;

  // 보관함 수 필드가 없어도 위치·역명은 노출 (요금/상세만 비어 있을 수 있음)
  const id = asString(dto.id) || `${name}-${lat.toFixed(5)}-${lng.toFixed(5)}`;
  const distanceMeters = asNumber(dto.distanceMeters) ?? asNumber(dto.distance);

  return {
    id,
    line: firstNumber(dto.line) || 0,
    name,
    locationDetail: asString(dto.locationDetail) || asString(dto.detailLocation),
    location: { lat, lng },
    lockers: { small, medium, large, extraLarge, total },
    fees: [],
    costRaw:
      asString(dto.costRaw) || asString(dto.cost) || asString(dto.cabinetCost),
    company: asString(dto.company) || asString(dto.cabinetCompany),
    distanceMeters: distanceMeters ?? undefined,
  };
}

export function mapStorageLocationsToLockerStations(
  items: StorageLocationResponse[],
): SubwayLockerStation[] {
  return items
    .map(mapStorageLocationToLockerStation)
    .filter((station): station is SubwayLockerStation => station != null);
}
