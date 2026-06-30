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
