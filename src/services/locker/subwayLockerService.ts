import { BUSAN_SUBWAY_LOCKER_COORDS } from '../../constants/locker/subwayStations';
import subwayLockerData from '../../data/subwayLockerData.json';
import type { SubwayLockerRecord, SubwayLockerStation } from '../../types/subwayLocker';

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

/** Î∂Ä?∞Íµê?µÍ≥µ????ãú?§Î¨º API ?∞Îèô ??JSON ?∞Ïù¥???¨Ïö© */
export async function fetchSubwayLockerStations(): Promise<SubwayLockerStation[]> {
  await delay(200);
  return mapRecordsToLockerStations(LOCKER_DATA);
}
