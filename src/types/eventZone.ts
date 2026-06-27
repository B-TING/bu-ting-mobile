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

export type EventZoneLandmark = {
  id: string;
  nameKo: string;
  nameEn: string;
  nameJa: string;
  nameZh: string;
  location: EventZoneCoordinate;
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
  svgPath: string;
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
  titleKo: string;
  titleEn: string;
  topicKo: string;
  topicEn: string;
  memberCount: number;
  isLive: boolean;
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
