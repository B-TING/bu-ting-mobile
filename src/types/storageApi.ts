/** GET /api/v1/storage-locations 응답 DTO */

export type StorageLocationResponse = {
  id?: string | number | null;
  line?: number | null;
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
  lockers?: {
    small?: number | null;
    medium?: number | null;
    large?: number | null;
    extraLarge?: number | null;
    total?: number | null;
  } | null;
};

export type StorageLocationQuery = {
  longitude: number;
  latitude: number;
  /** 검색 반경(m), 1~20000 */
  radius: number;
};

export const STORAGE_SEARCH_RADIUS_DEFAULT_M = 5000;
export const STORAGE_SEARCH_RADIUS_MAX_M = 20000;
