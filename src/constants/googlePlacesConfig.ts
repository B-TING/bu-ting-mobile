/**
 * Google Places API 연동 상수 (비밀키 제외).
 * API 키는 .env 의 GOOGLE_PLACES_API_KEY — Node 스크립트·백엔드에서만 사용.
 * 모바일 앱에 키를 번들하지 않고 백엔드 프록시를 권장합니다.
 */

/** Find Place from Text (Legacy REST) */
export const GOOGLE_FIND_PLACE_URL =
  'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';

/** Place Details (New) — place_id 확보 후 상세·리뷰·사진 */
export const GOOGLE_PLACE_DETAILS_NEW_URL =
  'https://places.googleapis.com/v1/places';

/** Find Place fields — place_id만 요청 (비용 최소화) */
export const GOOGLE_FIND_PLACE_FIELDS = 'place_id';

export const GOOGLE_FIND_PLACE_INPUT_TYPE = 'textquery';

/** locationbias circle 반경 기본값(m). .env GOOGLE_PLACES_FIND_RADIUS_M 로 덮어씀 */
export const DEFAULT_FIND_PLACE_RADIUS_M = 150;

export const DEFAULT_PLACES_LANGUAGE = 'ko';

/** DB place_id 매핑 실패 플래그 */
export type GooglePlaceIdResolveStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'NOT_FOUND'
  | 'ERROR'
  | 'PENDING';

export const GOOGLE_PLACE_ID_NOT_FOUND = 'NOT_FOUND' as const;
