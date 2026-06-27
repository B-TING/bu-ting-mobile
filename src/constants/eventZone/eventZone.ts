import type { AppLanguage } from '../../types/user';
import type {
  EventZoneChatMessage,
  EventZoneChatRoom,
  EventZoneDefinition,
  EventZoneId,
  EventZoneLandmark,
} from '../../types/eventZone';

export const BUSAN_MAP_VIEWBOX = { width: 360, height: 480 } as const;

export const BUSAN_MAP_BOUNDS = {
  minLat: 35.04,
  maxLat: 35.3,
  minLng: 128.92,
  maxLng: 129.24,
} as const;

export const EVENT_ZONES: EventZoneDefinition[] = [
  {
    id: 'haeundae-gijang',
    nameKo: '해운대·기장',
    nameEn: 'Haeundae · Gijang',
    nameJa: '海雲台·機張',
    nameZh: '海云台·机张',
    summaryKo: '동부 해안과 센텀 일대 이벤트·채팅',
    summaryEn: 'East coast events and zone chat near Centum',
    summaryJa: '東部海岸とセンタム周辺のイベント',
    summaryZh: '东部海岸与 Centum 一带活动',
    baseColor: '#38BDF8',
    highlightColor: '#0EA5E9',
    svgPath: 'M 228 24 L 356 48 L 348 132 L 268 156 L 232 108 Z',
    bounds: { minLat: 35.19, maxLat: 35.32, minLng: 129.12, maxLng: 129.26 },
    landmarks: [
      {
        id: 'haeundae-beach',
        nameKo: '해운대 해수욕장',
        nameEn: 'Haeundae Beach',
        nameJa: '海雲台海水浴場',
        nameZh: '海云台海水浴场',
        emoji: '🏖️',
        location: { lat: 35.1587, lng: 129.1604 },
      },
      {
        id: 'haedong-yonggungsa',
        nameKo: '해동용궁사',
        nameEn: 'Haedong Yonggungsa',
        nameJa: '海東龍宮寺',
        nameZh: '海东龙宫寺',
        emoji: '🛕',
        location: { lat: 35.1885, lng: 129.223 },
      },
      {
        id: 'centum-city',
        nameKo: '센텀시티',
        nameEn: 'Centum City',
        nameJa: 'センタムシティ',
        nameZh: 'Centum City',
        emoji: '🏬',
        location: { lat: 35.1694, lng: 129.1314 },
      },
    ],
  },
  {
    id: 'suyeong-nam',
    nameKo: '수영·남구',
    nameEn: 'Suyeong · Nam',
    nameJa: '水营·南区',
    nameZh: '水营·南区',
    summaryKo: '광안리·민락·오륙도 해안 이벤트',
    summaryEn: 'Gwangan, Millak, and Oryukdo coastal zone',
    summaryJa: '広安里·民楽·五六島の海岸ゾーン',
    summaryZh: '广安里·民乐·五六岛海岸区域',
    baseColor: '#A78BFA',
    highlightColor: '#8B5CF6',
    svgPath: 'M 248 156 L 352 136 L 356 268 L 248 252 L 214 228 Z',
    bounds: { minLat: 35.11, maxLat: 35.19, minLng: 129.1, maxLng: 129.18 },
    landmarks: [
      {
        id: 'gwangalli-beach',
        nameKo: '광안리 해수욕장',
        nameEn: 'Gwangalli Beach',
        nameJa: '広安里海水浴場',
        nameZh: '广安里海水浴场',
        emoji: '🌉',
        location: { lat: 35.1532, lng: 129.1186 },
      },
      {
        id: 'millak-park',
        nameKo: '민락수변공원',
        nameEn: 'Millak Waterside Park',
        nameJa: '民楽水辺公園',
        nameZh: '民乐水边公园',
        emoji: '🌊',
        location: { lat: 35.155, lng: 129.127 },
      },
      {
        id: 'oryukdo-skywalk',
        nameKo: '오륙도 스카이워크',
        nameEn: 'Oryukdo Skywalk',
        nameJa: '五六島スカイウォーク',
        nameZh: '五六岛天空步道',
        emoji: '🚶',
        location: { lat: 35.0945, lng: 129.124 },
      },
    ],
  },
  {
    id: 'geumjeong-dongnae',
    nameKo: '금정·동래·연제·부산진',
    nameEn: 'Geumjeong · Dongnae · Yeonje · Busanjin',
    nameJa: '金井·東莱·莲堤·釜山镇',
    nameZh: '金井·东莱·莲堤·釜山镇',
    summaryKo: '전포·서면·사직·범어사 중심 이벤트',
    summaryEn: 'Jeonpo, Seomyeon, Sajik, and Beomeosa hub',
    summaryJa: '田浦·西面·社稷·梵鱼寺エリア',
    summaryZh: '田浦·西面·社稷·梵鱼寺区域',
    baseColor: '#FBBF24',
    highlightColor: '#F59E0B',
    svgPath: 'M 132 72 L 228 56 L 244 168 L 188 188 L 128 168 Z',
    bounds: { minLat: 35.14, maxLat: 35.22, minLng: 129.03, maxLng: 129.1 },
    landmarks: [
      {
        id: 'jeonpo-seomyeon',
        nameKo: '전포·서면',
        nameEn: 'Jeonpo · Seomyeon',
        nameJa: '田浦·西面',
        nameZh: '田浦·西面',
        emoji: '☕',
        location: { lat: 35.1578, lng: 129.0595 },
      },
      {
        id: 'sajik-stadium',
        nameKo: '사직구장',
        nameEn: 'Sajik Baseball Stadium',
        nameJa: '社稷球場',
        nameZh: '社稷球场',
        emoji: '⚾',
        location: { lat: 35.194, lng: 129.061 },
      },
      {
        id: 'beomeosa',
        nameKo: '범어사',
        nameEn: 'Beomeosa Temple',
        nameJa: '梵鱼寺',
        nameZh: '梵鱼寺',
        emoji: '⛩️',
        location: { lat: 35.259, lng: 129.082 },
      },
    ],
  },
  {
    id: 'seo-jung-dong',
    nameKo: '서·중·동구',
    nameEn: 'Seo · Jung · Dong',
    nameJa: '西·中·東区',
    nameZh: '西·中·东区',
    summaryKo: '자갈치·국제시장·용두산 원도심 이벤트',
    summaryEn: 'Jagalchi, Gukje Market, and Yongdusan downtown',
    summaryJa: '札幌市場·国際市場·龙头山の都心',
    summaryZh: '札嘎其·国际市场·龙头山市中心',
    baseColor: '#FB7185',
    highlightColor: '#F43F5E',
    svgPath: 'M 118 188 L 206 172 L 214 252 L 176 304 L 112 284 Z',
    bounds: { minLat: 35.09, maxLat: 35.13, minLng: 129.01, maxLng: 129.06 },
    landmarks: [
      {
        id: 'jagalchi-market',
        nameKo: '자갈치시장',
        nameEn: 'Jagalchi Market',
        nameJa: '札幌市場',
        nameZh: '札嘎其市场',
        emoji: '🐟',
        location: { lat: 35.0966, lng: 129.0308 },
      },
      {
        id: 'gukje-market',
        nameKo: '국제시장',
        nameEn: 'Gukje Market',
        nameJa: '国際市場',
        nameZh: '国际市场',
        emoji: '🏮',
        location: { lat: 35.102, lng: 129.026 },
      },
      {
        id: 'yongdusan-park',
        nameKo: '용두산공원',
        nameEn: 'Yongdusan Park',
        nameJa: '龙头山公園',
        nameZh: '龙头山公园',
        emoji: '🗼',
        location: { lat: 35.099, lng: 129.032 },
      },
    ],
  },
  {
    id: 'yeongdo',
    nameKo: '영도',
    nameEn: 'Yeongdo',
    nameJa: '影岛',
    nameZh: '影岛',
    summaryKo: '흰여울·태종대 남단 섬 이벤트',
    summaryEn: 'Huinnyeoul and Taejongdae island zone',
    summaryJa: '白い波·太宗台の南端エリア',
    summaryZh: '白浪·太宗台南端区域',
    baseColor: '#34D399',
    highlightColor: '#10B981',
    svgPath: 'M 132 304 L 224 292 L 244 372 L 176 452 L 96 396 Z',
    bounds: { minLat: 35.04, maxLat: 35.09, minLng: 129.03, maxLng: 129.1 },
    landmarks: [
      {
        id: 'huinnyeoul',
        nameKo: '흰여울문화마을',
        nameEn: 'Huinnyeoul Culture Village',
        nameJa: '白い波文化村',
        nameZh: '白浪文化村',
        emoji: '🏘️',
        location: { lat: 35.077, lng: 129.045 },
      },
      {
        id: 'taejongdae',
        nameKo: '태종대',
        nameEn: 'Taejongdae',
        nameJa: '太宗台',
        nameZh: '太宗台',
        emoji: '🌅',
        location: { lat: 35.051, lng: 129.086 },
      },
    ],
  },
  {
    id: 'gangseo-northwest',
    nameKo: '강서·사상·사하·북구',
    nameEn: 'Gangseo · Sasang · Saha · Buk',
    nameJa: '江西·沙上·沙下·北区',
    nameZh: '江西·沙上·沙下·北区',
    summaryKo: '감천·다대포·김해공항 서부 이벤트',
    summaryEn: 'Gamcheon, Dadaepo, and airport west zone',
    summaryJa: '甘川·多大浦·金海空港の西部',
    summaryZh: '甘川·多大浦·金海机场西部',
    baseColor: '#818CF8',
    highlightColor: '#6366F1',
    svgPath: 'M 8 108 L 118 92 L 128 196 L 96 284 L 36 352 L 4 312 Z',
    bounds: { minLat: 35.04, maxLat: 35.2, minLng: 128.92, maxLng: 129.02 },
    landmarks: [
      {
        id: 'gamcheon-village',
        nameKo: '감천문화마을',
        nameEn: 'Gamcheon Culture Village',
        nameJa: '甘川文化村',
        nameZh: '甘川文化村',
        emoji: '🎨',
        location: { lat: 35.097, lng: 128.968 },
      },
      {
        id: 'dadaepo-beach',
        nameKo: '다대포 해수욕장',
        nameEn: 'Dadaepo Beach',
        nameJa: '多大浦海水浴場',
        nameZh: '多大浦海水浴场',
        emoji: '🌤️',
        location: { lat: 35.051, lng: 128.966 },
      },
      {
        id: 'gimhae-airport',
        nameKo: '김해국제공항',
        nameEn: 'Gimhae International Airport',
        nameJa: '金海国際空港',
        nameZh: '金海国际机场',
        emoji: '✈️',
        location: { lat: 35.179, lng: 128.938 },
      },
    ],
  },
];

export const EVENT_ZONE_BY_ID: Record<EventZoneId, EventZoneDefinition> = EVENT_ZONES.reduce(
  (acc, zone) => {
    acc[zone.id] = zone;
    return acc;
  },
  {} as Record<EventZoneId, EventZoneDefinition>,
);

/** GPS 미연동 시 부산역 인근 기본 좌표 */
export const DEFAULT_USER_LOCATION = { lat: 35.1152, lng: 129.0422 };

export const MOCK_ZONE_CHAT_ROOMS: EventZoneChatRoom[] = [
  {
    id: 'chat-haeundae-meetup',
    zoneId: 'haeundae-gijang',
    titleKo: '해운대 오늘 만남방',
    titleEn: 'Haeundae meetup today',
    topicKo: '오늘 해운대에서 만날 분 구해요',
    topicEn: 'Looking for company at Haeundae today',
    memberCount: 24,
    isLive: true,
  },
  {
    id: 'chat-gwangan-info',
    zoneId: 'suyeong-nam',
    titleKo: '광안리 야경·맛집 정보',
    titleEn: 'Gwangan night view & food tips',
    topicKo: '광안대교 야경·맛집 정보 공유',
    topicEn: 'Share Gwangan night views and food spots',
    memberCount: 18,
    isLive: true,
  },
  {
    id: 'chat-seomyeon-game',
    zoneId: 'geumjeong-dongnae',
    titleKo: '서면 미니게임 대기실',
    titleEn: 'Seomyeon mini-game lobby',
    topicKo: '구역 미니게임 매칭 대기',
    topicEn: 'Zone mini-game matchmaking lobby',
    memberCount: 31,
    isLive: false,
  },
  {
    id: 'chat-jagalchi-market',
    zoneId: 'seo-jung-dong',
    titleKo: '자갈치 시장 투어',
    titleEn: 'Jagalchi market tour',
    topicKo: '자갈치·국제시장 같이 돌아요',
    topicEn: 'Explore Jagalchi and Gukje Market together',
    memberCount: 12,
    isLive: true,
  },
  {
    id: 'chat-yeongdo-walk',
    zoneId: 'yeongdo',
    titleKo: '영도 산책·사진방',
    titleEn: 'Yeongdo walk & photo chat',
    topicKo: '흰여울·태종대 산책 모임',
    topicEn: 'Huinnyeoul and Taejongdae walk group',
    memberCount: 9,
    isLive: false,
  },
  {
    id: 'chat-gamcheon-art',
    zoneId: 'gangseo-northwest',
    titleKo: '감천마을 아트 챌린지',
    titleEn: 'Gamcheon art challenge',
    topicKo: '감천마을 포토 미션 진행 중',
    topicEn: 'Gamcheon photo mission in progress',
    memberCount: 15,
    isLive: true,
  },
];

export const MOCK_ZONE_CHAT_MESSAGES: EventZoneChatMessage[] = [
  {
    id: 'msg-1',
    roomId: 'chat-haeundae-meetup',
    authorId: 'user-a',
    authorNickname: '바다좋아',
    text: '오늘 저녁 6시쯤 해수욕장 입구에서 만날 분 있나요?',
    sentAt: '2026-06-28T09:10:00.000Z',
  },
  {
    id: 'msg-2',
    roomId: 'chat-haeundae-meetup',
    authorId: 'user-b',
    authorNickname: '부산여행러',
    text: '저 가능해요! 센텀에서 출발합니다.',
    sentAt: '2026-06-28T09:12:00.000Z',
  },
  {
    id: 'msg-3',
    roomId: 'chat-gwangan-info',
    authorId: 'user-c',
    authorNickname: '야경덕후',
    text: '광안리 민락쪽 카페 중 뷰 좋은 곳 추천해 주세요.',
    sentAt: '2026-06-28T08:40:00.000Z',
  },
  {
    id: 'msg-4',
    roomId: 'chat-jagalchi-market',
    authorId: 'user-d',
    authorNickname: '회먹고싶다',
    text: '점심에 자갈치 회 먹을 분~',
    sentAt: '2026-06-28T07:30:00.000Z',
  },
];

export const EVENT_ZONE_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    currentZoneLabel: string;
    mapHint: string;
    landmarksTitle: string;
    chatRoomsTitle: string;
    chatFeatureHint: string;
    chatLiveBadge: string;
    chatMemberCount: (n: number) => string;
    selectZoneHint: string;
    planningBadge: string;
    locationFallbackHint: string;
    enterChat: string;
  }
> = {
  ko: {
    screenTitle: '이벤트 존',
    currentZoneLabel: '내 구역',
    mapHint: '구역을 눌러 하이라이트하고 랜드마크를 확인하세요',
    landmarksTitle: '주요 관광지',
    chatRoomsTitle: '구역 채팅방',
    chatFeatureHint: '앱 내 채팅 (실시간 연동 준비 중)',
    chatLiveBadge: 'LIVE',
    chatMemberCount: n => `${n}명 참여`,
    selectZoneHint: '지도에서 구역을 선택해 주세요',
    planningBadge: '기획 중',
    locationFallbackHint: '현재 위치 기준 (GPS 연동 예정)',
    enterChat: '입장하기',
  },
  en: {
    screenTitle: 'Event Zone',
    currentZoneLabel: 'My zone',
    mapHint: 'Tap a zone to highlight it and view landmarks',
    landmarksTitle: 'Landmarks',
    chatRoomsTitle: 'Zone chat rooms',
    chatFeatureHint: 'In-app chat (realtime sync coming soon)',
    chatLiveBadge: 'LIVE',
    chatMemberCount: n => `${n} joined`,
    selectZoneHint: 'Select a zone on the map',
    planningBadge: 'In planning',
    locationFallbackHint: 'Based on current location (GPS coming soon)',
    enterChat: 'Join',
  },
  ja: {
    screenTitle: 'イベントゾーン',
    currentZoneLabel: '所属エリア',
    mapHint: 'エリアをタップしてランドマークを表示',
    landmarksTitle: '主要観光地',
    chatRoomsTitle: 'エリアチャット',
    chatFeatureHint: 'アプリ内チャット（リアルタイム連携準備中）',
    chatLiveBadge: 'LIVE',
    chatMemberCount: n => `${n}人参加`,
    selectZoneHint: '地図でエリアを選択してください',
    planningBadge: '企画中',
    locationFallbackHint: '現在地基準（GPS連携予定）',
    enterChat: '入室',
  },
  zh: {
    screenTitle: '活动区域',
    currentZoneLabel: '我的区域',
    mapHint: '点击区域高亮并查看地标',
    landmarksTitle: '主要景点',
    chatRoomsTitle: '区域聊天室',
    chatFeatureHint: '应用内聊天（实时同步筹备中）',
    chatLiveBadge: 'LIVE',
    chatMemberCount: n => `${n} 人参与`,
    selectZoneHint: '请在地图上选择区域',
    planningBadge: '策划中',
    locationFallbackHint: '基于当前位置（GPS 接入待定）',
    enterChat: '进入',
  },
};

export const ZONE_CHAT_COPY: Record<
  AppLanguage,
  {
    inputPlaceholder: string;
    send: string;
    emptyMessages: string;
    memberCount: (n: number) => string;
    localOnlyHint: string;
  }
> = {
  ko: {
    inputPlaceholder: '메시지를 입력하세요',
    send: '전송',
    emptyMessages: '아직 메시지가 없어요. 첫 인사를 남겨보세요!',
    memberCount: n => `${n}명 참여 중`,
    localOnlyHint: '현재는 기기 내 목업 채팅입니다. 실시간 서버 연동은 준비 중이에요.',
  },
  en: {
    inputPlaceholder: 'Type a message',
    send: 'Send',
    emptyMessages: 'No messages yet. Say hello!',
    memberCount: n => `${n} joined`,
    localOnlyHint: 'Local mock chat for now. Realtime server sync is coming soon.',
  },
  ja: {
    inputPlaceholder: 'メッセージを入力',
    send: '送信',
    emptyMessages: 'まだメッセージがありません',
    memberCount: n => `${n}人参加中`,
    localOnlyHint: '現在は端末内モックチャットです',
  },
  zh: {
    inputPlaceholder: '输入消息',
    send: '发送',
    emptyMessages: '还没有消息，来打个招呼吧',
    memberCount: n => `${n} 人参与中`,
    localOnlyHint: '当前为本地模拟聊天，实时同步筹备中',
  },
};

export function eventZoneName(
  zone: EventZoneDefinition,
  language: AppLanguage,
): string {
  if (language === 'ko') return zone.nameKo;
  if (language === 'ja') return zone.nameJa;
  if (language === 'zh') return zone.nameZh;
  return zone.nameEn;
}

export function eventZoneSummary(
  zone: EventZoneDefinition,
  language: AppLanguage,
): string {
  if (language === 'ko') return zone.summaryKo;
  if (language === 'ja') return zone.summaryJa;
  if (language === 'zh') return zone.summaryZh;
  return zone.summaryEn;
}

export function landmarkName(
  landmark: EventZoneLandmark,
  language: AppLanguage,
): string {
  if (language === 'ko') return landmark.nameKo;
  if (language === 'ja') return landmark.nameJa;
  if (language === 'zh') return landmark.nameZh;
  return landmark.nameEn;
}

export function chatRoomTitle(
  room: EventZoneChatRoom,
  language: AppLanguage,
): string {
  return language === 'ko' ? room.titleKo : room.titleEn;
}

export function chatRoomTopic(
  room: EventZoneChatRoom,
  language: AppLanguage,
): string {
  return language === 'ko' ? room.topicKo : room.topicEn;
}

export function getChatRoomById(roomId: string): EventZoneChatRoom | undefined {
  return MOCK_ZONE_CHAT_ROOMS.find(room => room.id === roomId);
}

export function chatMessagesForRoom(roomId: string): EventZoneChatMessage[] {
  return MOCK_ZONE_CHAT_MESSAGES.filter(message => message.roomId === roomId).sort(
    (a, b) => a.sentAt.localeCompare(b.sentAt),
  );
}

export function chatRoomsForZone(zoneId: EventZoneId): EventZoneChatRoom[] {
  return MOCK_ZONE_CHAT_ROOMS.filter(room => room.zoneId === zoneId);
}
