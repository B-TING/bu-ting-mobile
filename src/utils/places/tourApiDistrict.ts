import {
  BUSAN_DISTRICT_BY_ID,
  BUSAN_DISTRICT_LABEL_CENTERS,
} from '../../constants/eventZone/busanMapPaths';
import type { EventZoneCoordinate } from '../../types/eventZone';
import type { TourApiDistrictCode } from '../../types/placesApi';
import { projectLatLngToMapPoint } from '../eventZone/zoneResolver';

const DEFAULT_DISTRICT_CODE: TourApiDistrictCode = '350';

const BUSAN_CITY_PREFIX = 'CD26';

/** 이벤트존 행정구역 ID(CD26110) → 관광공사 시군구 코드(110) */
function tourApiDistrictCodeFromDistrictId(districtId: string): TourApiDistrictCode {
  if (!districtId.startsWith(BUSAN_CITY_PREFIX) || districtId.length < BUSAN_CITY_PREFIX.length + 3) {
    return DEFAULT_DISTRICT_CODE;
  }
  return districtId.slice(-3) as TourApiDistrictCode;
}

export function resolveNearestTourApiDistrictCode(
  location: EventZoneCoordinate,
): TourApiDistrictCode {
  const mapPoint = projectLatLngToMapPoint(location);
  let bestDistrictId = `${BUSAN_CITY_PREFIX}${DEFAULT_DISTRICT_CODE}`;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [districtId, center] of Object.entries(BUSAN_DISTRICT_LABEL_CENTERS)) {
    const distance = (mapPoint.x - center.x) ** 2 + (mapPoint.y - center.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestDistrictId = districtId;
    }
  }

  return tourApiDistrictCodeFromDistrictId(bestDistrictId);
}

export function tourApiDistrictLabelKo(code: string): string {
  return BUSAN_DISTRICT_BY_ID[`${BUSAN_CITY_PREFIX}${code}`]?.labelKo ?? code;
}
