export type EventZoneId =
  | 'haeundae-gijang'
  | 'suyeong-nam'
  | 'geumjeong-dongnae'
  | 'seo-jung-dong'
  | 'yeongdo'
  | 'gangseo-northwest';

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
  | 'zone_battle'; // 타 구역 유저와 대결

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
};