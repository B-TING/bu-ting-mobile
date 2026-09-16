import type {
  StorageFeeGroupDto,
  StorageLocationResponse,
  StorageLockerCountsDto,
} from '../../types/storageApi';
import type {
  LockerFeeGroup,
  LockerFeeItem,
  LockerFeeSchedule,
  LockerSize,
  SubwayLockerStation,
} from '../../types/subwayLocker';

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

/** "1호선" / "Line 2" / 1 → 1 */
export function parseStorageLine(value: unknown): number {
  const numeric = asNumber(value);
  if (numeric != null && numeric > 0) {
    return numeric;
  }
  if (typeof value === 'string') {
    const match = value.match(/(\d+)/);
    if (match) {
      return Number(match[1]);
    }
  }
  return 0;
}

const SIZE_ALIASES: Record<string, LockerSize> = {
  small: 'small',
  s: 'small',
  medium: 'medium',
  m: 'medium',
  large: 'large',
  l: 'large',
  extralarge: 'extraLarge',
  extra_large: 'extraLarge',
  xl: 'extraLarge',
};

function parseLockerSize(value: unknown): LockerSize | null {
  if (typeof value !== 'string') {
    return null;
  }
  const key = value.trim().toLowerCase().replace(/[\s-]/g, '_');
  return SIZE_ALIASES[key] ?? null;
}

const SCHEDULE_ALIASES: Record<string, LockerFeeSchedule> = {
  default: 'default',
  weekday: 'weekday',
  weekend: 'weekend',
};

function parseFeeSchedule(value: unknown): LockerFeeSchedule | null {
  if (typeof value !== 'string') {
    return null;
  }
  return SCHEDULE_ALIASES[value.trim().toLowerCase()] ?? null;
}

function mapFeeItems(items: StorageFeeGroupDto['items']): LockerFeeItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap(item => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const size = parseLockerSize(item.size);
    const amount = asNumber(item.amount);
    if (!size || amount == null) {
      return [];
    }
    return [
      {
        size,
        amount,
        unit: asString(item.unit) || '기본',
      },
    ];
  });
}

export function mapStorageFees(fees: StorageLocationResponse['fees']): LockerFeeGroup[] {
  if (!Array.isArray(fees)) {
    return [];
  }

  const groups: LockerFeeGroup[] = [];
  const seen = new Set<LockerFeeSchedule>();

  for (const group of fees) {
    if (!group || typeof group !== 'object') {
      continue;
    }
    const schedule = parseFeeSchedule(group.schedule);
    if (!schedule || seen.has(schedule)) {
      continue;
    }
    const items = mapFeeItems(group.items);
    if (items.length === 0) {
      continue;
    }
    seen.add(schedule);
    groups.push({ schedule, items });
  }

  return groups;
}

function lockerCountsFrom(dto: StorageLocationResponse) {
  const nested: StorageLockerCountsDto = {
    ...(dto.lockers ?? {}),
    ...(dto.counts ?? {}),
  };

  const small = firstNumber(nested.small, dto.smallCount, dto.small, dto.cabinetS);
  const medium = firstNumber(
    nested.medium,
    dto.mediumCount,
    dto.medium,
    dto.cabinetM,
  );
  const large = firstNumber(nested.large, dto.largeCount, dto.large, dto.cabinetL);
  const extraLarge = firstNumber(
    nested.extraLarge,
    dto.extraLargeCount,
    dto.extraLarge,
    dto.cabinetXl,
  );
  const total = firstNumber(nested.total) || small + medium + large + extraLarge;

  return { small, medium, large, extraLarge, total };
}

/**
 * StorageLocationResponse → UI SubwayLockerStation.
 * 서버 필드명 변형(camelCase / 공공데이터식 / OpenAPI counts)을 흡수합니다.
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

  const locationDetail = asString(dto.locationDetail) || asString(dto.detailLocation);
  const id =
    asString(dto.id) || `${name}-${locationDetail}-${lat.toFixed(5)}-${lng.toFixed(5)}`;
  const distanceMeters = asNumber(dto.distanceMeters) ?? asNumber(dto.distance);

  return {
    id,
    line: parseStorageLine(dto.line),
    name,
    locationDetail,
    location: { lat, lng },
    lockers: lockerCountsFrom(dto),
    fees: mapStorageFees(dto.fees),
    costRaw:
      asString(dto.costRaw) || asString(dto.cost) || asString(dto.cabinetCost),
    company: asString(dto.company) || asString(dto.cabinetCompany),
    distanceMeters: distanceMeters ?? undefined,
  };
}

function stationDedupeKey(station: SubwayLockerStation): string {
  return [
    station.name,
    station.locationDetail,
    station.location.lat.toFixed(5),
    station.location.lng.toFixed(5),
  ].join('|');
}

export function mapStorageLocationsToLockerStations(
  items: StorageLocationResponse[],
): SubwayLockerStation[] {
  const seen = new Set<string>();
  const stations: SubwayLockerStation[] = [];

  for (const item of items) {
    const station = mapStorageLocationToLockerStation(item);
    if (!station) {
      continue;
    }
    const key = stationDedupeKey(station);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    stations.push(station);
  }

  return stations;
}
