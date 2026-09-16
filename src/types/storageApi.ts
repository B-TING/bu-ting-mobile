/** GET /api/v1/storage-locations 응답 DTO */

export type StorageLockerSizeDto =
  | 'small'
  | 'medium'
  | 'large'
  | 'extraLarge'
  | 'SMALL'
  | 'MEDIUM'
  | 'LARGE'
  | 'EXTRA_LARGE'
  | (string & {});

export type StorageFeeScheduleDto =
  | 'default'
  | 'weekday'
  | 'weekend'
  | 'DEFAULT'
  | 'WEEKDAY'
  | 'WEEKEND'
  | (string & {});

export type StorageLockerCountsDto = {
  small?: number | null;
  medium?: number | null;
  large?: number | null;
  extraLarge?: number | null;
  total?: number | null;
};

export type StorageFeeItemDto = {
  size?: StorageLockerSizeDto | null;
  amount?: number | null;
  unit?: string | null;
};

export type StorageFeeGroupDto = {
  schedule?: StorageFeeScheduleDto | null;
  items?: StorageFeeItemDto[] | null;
};

export type StorageLocationResponse = {
  id?: string | number | null;
  /** 숫자 1 또는 "1호선" */
  line?: number | string | null;
  name?: string | null;
  stationName?: string | null;
  locationDetail?: string | null;
  detailLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  distanceMeters?: number | null;
  distance?: number | null;
  openNow?: boolean | null;
  /** OpenAPI 정식 필드 */
  counts?: StorageLockerCountsDto | null;
  fees?: StorageFeeGroupDto[] | null;
  /** 크기별 보관함 수 — 서버 필드명 변형 대응 */
  smallCount?: number | null;
  mediumCount?: number | null;
  largeCount?: number | null;
  extraLargeCount?: number | null;
  small?: number | null;
  medium?: number | null;
  large?: number | null;
  extraLarge?: number | null;
  cabinetS?: number | null;
  cabinetM?: number | null;
  cabinetL?: number | null;
  cabinetXl?: number | null;
  company?: string | null;
  cabinetCompany?: string | null;
  cost?: string | null;
  costRaw?: string | null;
  cabinetCost?: string | null;
  lockers?: StorageLockerCountsDto | null;
};

export type StorageLocationQuery = {
  longitude: number;
  latitude: number;
  /** 검색 반경(m), 1~20000 */
  radius: number;
};

/** 기본 위치(남포·초량 일대)에서도 3·4호선이 들어가도록 20km */
export const STORAGE_SEARCH_RADIUS_DEFAULT_M = 20000;
export const STORAGE_SEARCH_RADIUS_MAX_M = 20000;
