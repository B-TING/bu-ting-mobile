import { DEFAULT_USER_LOCATION_BUSAN } from '../../constants/eventZone/eventZone';
import { BUSAN_SUBWAY_LOCKER_COORDS } from '../../constants/locker/subwayStations';
import subwayLockerData from '../../data/subwayLockerData.json';
import type { StorageLocationQuery } from '../../types/storageApi';
import {
  STORAGE_SEARCH_RADIUS_DEFAULT_M,
  STORAGE_SEARCH_RADIUS_MAX_M,
} from '../../types/storageApi';
import type { SubwayLockerRecord, SubwayLockerStation } from '../../types/subwayLocker';
import { haversineKm } from '../../utils/geo/geo';
import { mapStorageLocationsToLockerStations } from './storageLocationMapper';
import { fetchNearbyStorageLocations } from './storageLocationService';

const LOCKER_DATA = subwayLockerData as SubwayLockerRecord[];

export function mapRecordToLockerStation(record: SubwayLockerRecord): SubwayLockerStation | null {
  const { small, medium, large, extraLarge } = record.counts;
  const total = small + medium + large + extraLarge;

  if (total <= 0) {
    return null;
  }

  const coords = BUSAN_SUBWAY_LOCKER_COORDS[record.id];
  if (!coords) {
    return null;
  }

  return {
    id: record.id,
    line: record.line,
    name: record.name,
    locationDetail: record.locationDetail,
    location: coords,
    lockers: { small, medium, large, extraLarge, total },
    fees: record.fees,
    costRaw: record.costRaw,
    company: record.company,
  };
}

export function mapRecordsToLockerStations(records: SubwayLockerRecord[]): SubwayLockerStation[] {
  return records
    .map(mapRecordToLockerStation)
    .filter((station): station is SubwayLockerStation => station != null)
    .sort((a, b) => a.line - b.line || a.name.localeCompare(b.name, 'ko'));
}

function withDistanceFrom(
  stations: SubwayLockerStation[],
  latitude: number,
  longitude: number,
): SubwayLockerStation[] {
  return stations
    .map(station => {
      const distanceKm = haversineKm(
        latitude,
        longitude,
        station.location.lat,
        station.location.lng,
      );
      return {
        ...station,
        distanceMeters: Math.round(distanceKm * 1000),
      };
    })
    .sort(
      (a, b) =>
        (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) ||
        a.line - b.line ||
        a.name.localeCompare(b.name, 'ko'),
    );
}

function localStationsNear(query: StorageLocationQuery): SubwayLockerStation[] {
  const radiusM = Math.min(
    STORAGE_SEARCH_RADIUS_MAX_M,
    Math.max(1, Math.round(query.radius || STORAGE_SEARCH_RADIUS_DEFAULT_M)),
  );

  const nearby = withDistanceFrom(
    mapRecordsToLockerStations(LOCKER_DATA),
    query.latitude,
    query.longitude,
  ).filter(station => (station.distanceMeters ?? Number.POSITIVE_INFINITY) <= radiusM);

  if (nearby.length > 0) {
    return nearby;
  }

  // ?? ??? ?? ?? ???? ????? ?? (????/? API ??)
  return withDistanceFrom(
    mapRecordsToLockerStations(LOCKER_DATA),
    query.latitude,
    query.longitude,
  );
}

/**
 * ?? ? ??? ??.
 * 1) GET /api/v1/storage-locations
 * 2) ??·? ?? ? ?? ?? ??? + ?? ?? ??
 */
export async function fetchSubwayLockerStations(
  query?: Partial<StorageLocationQuery>,
): Promise<SubwayLockerStation[]> {
  const resolved: StorageLocationQuery = {
    latitude: query?.latitude ?? DEFAULT_USER_LOCATION_BUSAN.lat,
    longitude: query?.longitude ?? DEFAULT_USER_LOCATION_BUSAN.lng,
    radius: query?.radius ?? STORAGE_SEARCH_RADIUS_DEFAULT_M,
  };

  try {
    const remote = await fetchNearbyStorageLocations(resolved);
    const mapped = mapStorageLocationsToLockerStations(remote);
    if (mapped.length > 0) {
      return mapped.sort(
        (a, b) =>
          (a.distanceMeters ?? Number.POSITIVE_INFINITY) -
            (b.distanceMeters ?? Number.POSITIVE_INFINITY) ||
          a.line - b.line ||
          a.name.localeCompare(b.name, 'ko'),
      );
    }
  } catch {
    // ????/?? ?? ? ?? ??
  }

  return localStationsNear(resolved);
}
