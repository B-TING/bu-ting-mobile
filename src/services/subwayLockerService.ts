import { BUSAN_SUBWAY_LOCKER_COORDS } from '../constants/subwayStations';
import subwayLockerData from '../data/subwayLockerData.json';
import type { SubwayLockerRecord, SubwayLockerStation } from '../types/subwayLocker';

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

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

/** 부산교통공사 역시설물 API 연동 전 JSON 데이터 사용 */
export async function fetchSubwayLockerStations(): Promise<SubwayLockerStation[]> {
  await delay(200);
  return mapRecordsToLockerStations(LOCKER_DATA);
}
