/** 백엔드 ChatZone enum 과 동일한 구역 ID */
export type EventZoneId =
  | 'HAEUNDAE_GIJANG'
  | 'SUYEONG_NAMGU'
  | 'CENTRAL_NORTH'
  | 'OLD_DOWNTOWN'
  | 'YEONGDO'
  | 'WESTERN_BUSAN';

/** REST·WebSocket 채팅 API query `zone` 파라미터 */
export type ChatZone = EventZoneId;

export type EventZoneCoordinate = {
  lat: number;
  lng: number;
};

export type EventZoneMapPoint = {
  /** assets/map/busan.svg viewBox 기준 x */
  x: number;
  /** assets/map/busan.svg viewBox 기준 y */
  y: number;
};

export type EventZoneLandmark = {
  id: string;
  nameKo: string;
  nameEn: string;
  nameJa: string;
  nameZh: string;
  /** GPS·구역 판별용 실제 좌표 */
  location: EventZoneCoordinate;
  /** busan.svg 위 마커 위치 (800×754) */
  mapPoint: EventZoneMapPoint;
  emoji: string;
};

export type EventZoneDefinition = {
  id: EventZoneId;
  nameKo: string;
  nameEn: string;
  nameJa: string;
  nameZh: string;
  summaryKo: string;
  summaryEn: string;
  summaryJa: string;
  summaryZh: string;
  baseColor: string;
  highlightColor: string;
  landmarks: EventZoneLandmark[];
  /** 위치 기반 구역 판별용 경계 상자 */
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
};

/** 구역별 앱 내 채팅방 (직접 구현) */
export type EventZoneChatRoom = {
  id: string;
  zoneId: EventZoneId;
  topicKo: string;
  topicEn: string;
  memberCount: number;
};

export type EventZoneChatMessage = {
  id: string;
  roomId: string;
  authorId: string;
  authorNickname: string;
  text: string;
  sentAt: string;
  isMine?: boolean;
};

/** 번개 이벤트 종류 (기획 확정 전 목업) */
export type ZoneEventType =
  | 'walk_conquest' // 부산 도보 정복전
  | 'receipt_auth' // 소울푸드 영수증 인증
  | 'qr_cross' // 핫플 QR 크로스
  | 'zone_battle' // 타 구역 유저와 대결
  | 'place_auth' // 장소 인증 (카메라 + GPS)
  | 'object_sight' // 사물 인증 (카메라 + 객체 인식)
  | 'mukjjippa'; // 묵찌빠 (타 구역 유저 대결)

/** 이벤트 게임 타입 */
export type EventGameType = 'place_auth' | 'object_sight' | 'mukjjippa';

/** 구역에 발생하는 이벤트 VO (목업) */
export type ZoneEvent = {
  id: string;
  type: ZoneEventType;
  zoneId: EventZoneId;
  titleKo: string;
  descriptionKo: string;
  /** ISO 8601 시작 시각 */
  startsAt: string;
  /** 이벤트 지속 시간(분) */
  durationMinutes: number;
  /** 장소 인증: 목표 랜드마크 ID */
  targetLandmarkId?: string;
  /** 사물 인증: 목표 사물 라벨 (i18n 키 대신 목업용 단일 필드) */
  targetObjectLabelKo?: string;
  targetObjectLabelEn?: string;
  targetObjectLabelJa?: string;
  targetObjectLabelZh?: string;
  /** 인증 반경 중심 (없으면 랜드마크/구역 첫 명소 location) */
  authLatitude?: number;
  authLongitude?: number;
  /** 인증 허용 반경(m). Phase 1 GPS 검사용 */
  authRadiusM?: number;
};