import type { AppLanguage } from '../types/user';
import type { RouteItem } from '../types/travelPlan';

export type BusanFestival = {
  id: string;
  tag: 'FESTIVAL' | 'EXHIBITION';
  titleKo: string;
  titleEn: string;
  titleJa: string;
  titleZh: string;
  locationKo: string;
  locationEn: string;
  locationJa: string;
  locationZh: string;
  addressKo: string;
  addressEn: string;
  addressJa: string;
  addressZh: string;
  descriptionKo: string;
  descriptionEn: string;
  descriptionJa: string;
  descriptionZh: string;
  hoursKo: string;
  hoursEn: string;
  hoursJa: string;
  hoursZh: string;
  startDate: string;
  endDate: string;
  /** 0=일 ~ 6=토. 설정 시 기간 내 해당 요일만 진행 */
  recurringWeekday?: number;
  imageColor: string;
  imageEmoji: string;
  location: { lat: number; lng: number };
};

export const FESTIVAL_CALENDAR_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    selectedDateLabel: (label: string) => string;
    emptyList: string;
    emptyListSub: string;
    festivalCount: (n: number) => string;
    detailTitle: string;
    locationLabel: string;
    periodLabel: string;
    hoursLabel: string;
    descriptionLabel: string;
    mapTitle: string;
    mapSubtitle: string;
    notFound: string;
    weekDays: string[];
    today: string;
    mockHint: string;
  }
> = {
  ko: {
    screenTitle: '축제 캘린더',
    selectedDateLabel: label => `${label} 진행 축제`,
    emptyList: '이 날짜에 예정된 축제가 없어요',
    emptyListSub: '다른 날짜를 선택해 보세요',
    festivalCount: n => `${n}개 축제`,
    detailTitle: '축제 상세',
    locationLabel: '장소',
    periodLabel: '기간',
    hoursLabel: '운영 시간',
    descriptionLabel: '소개',
    mapTitle: '네이버 지도 (준비 중)',
    mapSubtitle: '축제 장소 미리보기',
    notFound: '축제 정보를 찾을 수 없어요',
    weekDays: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘',
    mockHint: '축제 API 연동 전 목업 데이터입니다.',
  },
  en: {
    screenTitle: 'Festival Calendar',
    selectedDateLabel: label => `Festivals on ${label}`,
    emptyList: 'No festivals on this date',
    emptyListSub: 'Try selecting another date',
    festivalCount: n => `${n} festival${n === 1 ? '' : 's'}`,
    detailTitle: 'Festival details',
    locationLabel: 'Venue',
    periodLabel: 'Period',
    hoursLabel: 'Hours',
    descriptionLabel: 'About',
    mapTitle: 'Naver Map (coming soon)',
    mapSubtitle: 'Festival venue preview',
    notFound: 'Festival not found',
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'Today',
    mockHint: 'Mock data until festival API is connected.',
  },
  ja: {
    screenTitle: '祭りカレンダー',
    selectedDateLabel: label => `${label}の祭り`,
    emptyList: 'この日に予定された祭りはありません',
    emptyListSub: '別の日付を選んでみてください',
    festivalCount: n => `${n}件の祭り`,
    detailTitle: '祭り詳細',
    locationLabel: '会場',
    periodLabel: '期間',
    hoursLabel: '営業時間',
    descriptionLabel: '紹介',
    mapTitle: 'NAVERマップ（準備中）',
    mapSubtitle: '会場プレビュー',
    notFound: '祭り情報が見つかりません',
    weekDays: ['日', '月', '火', '水', '木', '金', '土'],
    today: '今日',
    mockHint: '祭りAPI連携前のモックデータです。',
  },
  zh: {
    screenTitle: '节庆日历',
    selectedDateLabel: label => `${label} 的节庆`,
    emptyList: '该日期没有节庆活动',
    emptyListSub: '请尝试选择其他日期',
    festivalCount: n => `${n} 个节庆`,
    detailTitle: '节庆详情',
    locationLabel: '地点',
    periodLabel: '期间',
    hoursLabel: '营业时间',
    descriptionLabel: '介绍',
    mapTitle: 'Naver 地图（即将上线）',
    mapSubtitle: '节庆地点预览',
    notFound: '找不到节庆信息',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    today: '今天',
    mockHint: '节庆 API 接入前的模拟数据。',
  },
};

/** 축제 API 연동 전 부산 축제 목업 */
export const MOCK_BUSAN_FESTIVALS: BusanFestival[] = [
  {
    id: 'haeundae-sand',
    tag: 'FESTIVAL',
    titleKo: '해운대 모래축제',
    titleEn: 'Haeundae Sand Festival',
    titleJa: '海雲台砂祭り',
    titleZh: '海云台沙节',
    locationKo: '해운대 해수욕장',
    locationEn: 'Haeundae Beach',
    locationJa: '海雲台海水浴場',
    locationZh: '海云台海水浴场',
    addressKo: '부산 해운대구 우동 해운대해수욕장',
    addressEn: 'Haeundae Beach, Haeundae-gu, Busan',
    addressJa: '釜山広域市海雲台区海雲台海水浴場',
    addressZh: '釜山广域市海云台区海云台海水浴场',
    descriptionKo:
      '세계적인 모래조각 작가들이 만든 대형 작품과 체험 부스가 해운대 해변을 가득 채웁니다. 가족 단위 방문객에게 인기 있는 여름 대표 축제입니다.',
    descriptionEn:
      'World-class sand sculptors fill Haeundae Beach with large artworks and hands-on booths — a summer favorite for families.',
    descriptionJa:
      '世界的な砂の彫刻作家による大型作品と体験ブースが海雲台ビーチを彩る、夏の代表的な家族向け祭りです。',
    descriptionZh:
      '世界级沙雕艺术家的巨型作品与体验摊位遍布海云台海滩，是深受家庭游客喜爱的夏季代表性节庆。',
    hoursKo: '10:00 - 21:00',
    hoursEn: '10:00 AM - 9:00 PM',
    hoursJa: '10:00〜21:00',
    hoursZh: '10:00 - 21:00',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    imageColor: '#f59e0b',
    imageEmoji: '🏖️',
    location: { lat: 35.1587, lng: 129.1604 },
  },
  {
    id: 'busan-dance',
    tag: 'FESTIVAL',
    titleKo: '부산 국제 거리무용 축제',
    titleEn: 'Busan International Street Dance Festival',
    titleJa: '釜山国際ストリートダンス祭り',
    titleZh: '釜山国际街头舞蹈节',
    locationKo: '서면 로데오거리',
    locationEn: 'Seomyeon Rodeo Street',
    locationJa: '西面ロデオ通り',
    locationZh: '西面罗迪欧街',
    addressKo: '부산 부산진구 부전동 로데오거리 일대',
    addressEn: 'Rodeo Street, Seomyeon, Busanjin-gu, Busan',
    addressJa: '釜山広域市釜山鎮区西面ロデオ通り一帯',
    addressZh: '釜山广域市釜山镇区西面罗迪欧街一带',
    descriptionKo:
      '국내외 거리무용 팀이 서면 일대에서 퍼포먼스를 펼칩니다. 저녁 시간대 공연이 특히 인기 있습니다.',
    descriptionEn:
      'Street dance crews from Korea and abroad perform across Seomyeon, with evening shows especially popular.',
    descriptionJa:
      '国内外のストリートダンスチームが西面一帯でパフォーマンスを披露。夕方の公演が特に人気です。',
    descriptionZh:
      '国内外街头舞蹈团队在西面一带表演，晚间演出尤其受欢迎。',
    hoursKo: '14:00 - 22:00',
    hoursEn: '2:00 PM - 10:00 PM',
    hoursJa: '14:00〜22:00',
    hoursZh: '14:00 - 22:00',
    startDate: '2026-06-05',
    endDate: '2026-06-07',
    imageColor: '#7c3aed',
    imageEmoji: '💃',
    location: { lat: 35.1578, lng: 129.0595 },
  },
  {
    id: 'gwangalli-drone',
    tag: 'EXHIBITION',
    titleKo: '광안리 M 드론 라이트쇼',
    titleEn: 'Gwangalli M Drone Light Show',
    titleJa: '広安里Mドローンライトショー',
    titleZh: '广安里 M 无人机灯光秀',
    locationKo: '광안리 해수욕장',
    locationEn: 'Gwangalli Beach',
    locationJa: '広安里海水浴場',
    locationZh: '广安里海水浴场',
    addressKo: '부산 수영구 광안동 광안리해수욕장',
    addressEn: 'Gwangalli Beach, Suyeong-gu, Busan',
    addressJa: '釜山広域市水営区広安里海水浴場',
    addressZh: '釜山广域市水营区广安里海水浴场',
    descriptionKo:
      '매주 토요일 밤, 광안대교를 배경으로 수백 대의 드론이 부산의 밤하늘을 수놓습니다. 무료 관람 가능합니다.',
    descriptionEn:
      'Every Saturday night, hundreds of drones paint the Busan sky against Gwangandaegyo Bridge. Free to watch.',
    descriptionJa:
      '毎週土曜の夜、広安大橋を背景に数百機のドローンが釜山の夜空を彩ります。無料観覧可能。',
    descriptionZh:
      '每周六夜晚，数百架无人机以广安大桥为背景点亮釜山夜空。免费观赏。',
    hoursKo: '20:30 - 21:00',
    hoursEn: '8:30 PM - 9:00 PM',
    hoursJa: '20:30〜21:00',
    hoursZh: '20:30 - 21:00',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    recurringWeekday: 6,
    imageColor: '#0f766e',
    imageEmoji: '🛸',
    location: { lat: 35.1532, lng: 129.1186 },
  },
  {
    id: 'busan-food',
    tag: 'FESTIVAL',
    titleKo: '부산 먹거리 페스티벌',
    titleEn: 'Busan Food Festival',
    titleJa: '釜山グルメフェスティバル',
    titleZh: '釜山美食节',
    locationKo: '민락수변공원',
    locationEn: 'Millak Waterside Park',
    locationJa: 'ミラク水辺公園',
    locationZh: '民乐水边公园',
    addressKo: '부산 수영구 민락동 민락수변공원',
    addressEn: 'Millak Waterside Park, Suyeong-gu, Busan',
    addressJa: '釜山広域市水営区ミラク水辺公園',
    addressZh: '釜山广域市水营区民乐水边公园',
    descriptionKo:
      '부산 대표 먹거리와 전국 미식 트럭이 한자리에 모입니다. 해산물 요리 체험과 쿠킹 클래스도 운영됩니다.',
    descriptionEn:
      'Busan signature dishes and gourmet food trucks gather in one place, with seafood tastings and cooking classes.',
    descriptionJa:
      '釜山代表グルメと全国のグルメトラックが集結。海鮮料理体験やクッキングクラスも開催。',
    descriptionZh:
      '釜山代表性美食与全国美食餐车齐聚一堂，还有海鲜料理体验与烹饪课程。',
    hoursKo: '11:00 - 21:00',
    hoursEn: '11:00 AM - 9:00 PM',
    hoursJa: '11:00〜21:00',
    hoursZh: '11:00 - 21:00',
    startDate: '2026-06-18',
    endDate: '2026-06-22',
    imageColor: '#dc2626',
    imageEmoji: '🍜',
    location: { lat: 35.155, lng: 129.127 },
  },
  {
    id: 'rock-festival',
    tag: 'FESTIVAL',
    titleKo: '부산 국제 록 페스티벌',
    titleEn: 'Busan International Rock Festival',
    titleJa: '釜山国際ロックフェスティバル',
    titleZh: '釜山国际摇滚节',
    locationKo: '사상 삼락생태공원',
    locationEn: 'Sasang Samnak Eco Park',
    locationJa: '沙上三楽生態公園',
    locationZh: '沙上三乐生态公园',
    addressKo: '부산 사상구 삼락동 삼락생태공원',
    addressEn: 'Samnak Eco Park, Sasang-gu, Busan',
    addressJa: '釜山広域市沙上区三楽生態公園',
    addressZh: '釜山广域市沙上区三乐生态公园',
    descriptionKo:
      '국내외 록·인디 밴드가 참여하는 대규모 야외 음악 축제입니다. 캠핑존과 푸드코트도 함께 운영됩니다.',
    descriptionEn:
      'A large outdoor music festival featuring rock and indie bands from Korea and abroad, with camping and food courts.',
    descriptionJa:
      '国内外のロック・インディーバンドが参加する大規模野外音楽祭。キャンプ場とフードコートも併設。',
    descriptionZh:
      '国内外摇滚与独立乐队参与的大型户外音乐节，同时设有露营区和美食广场。',
    hoursKo: '14:00 - 23:00',
    hoursEn: '2:00 PM - 11:00 PM',
    hoursJa: '14:00〜23:00',
    hoursZh: '14:00 - 23:00',
    startDate: '2026-10-04',
    endDate: '2026-10-06',
    imageColor: '#1e3a5f',
    imageEmoji: '🎆',
    location: { lat: 35.1045, lng: 128.9743 },
  },
  {
    id: 'biff',
    tag: 'EXHIBITION',
    titleKo: '부산국제영화제',
    titleEn: 'Busan International Film Festival',
    titleJa: '釜山国際映画祭',
    titleZh: '釜山国际电影节',
    locationKo: '영화의전당',
    locationEn: 'Busan Cinema Center',
    locationJa: '映画の殿堂',
    locationZh: '电影殿堂',
    addressKo: '부산 해운대구 수영강변로 120',
    addressEn: '120 Suyeonggangbyeon-daero, Haeundae-gu, Busan',
    addressJa: '釜山広域市海雲台区水營江辺路120',
    addressZh: '釜山广域市海云台区水营江边路120',
    descriptionKo:
      '아시아 최대 규모의 영화제로, 상영작 티켓 예매와 감독 GV, 야외 상영 등 다양한 프로그램이 진행됩니다.',
    descriptionEn:
      'Asia\'s largest film festival with screenings, director talks, and open-air cinema programs.',
    descriptionJa:
      'アジア最大級の映画祭。上映チケット予約、監督トーク、野外上映など多彩なプログラムを開催。',
    descriptionZh:
      '亚洲最大规模电影节，提供展映票务、导演见面会与露天放映等丰富活动。',
    hoursKo: '10:00 - 22:00',
    hoursEn: '10:00 AM - 10:00 PM',
    hoursJa: '10:00〜22:00',
    hoursZh: '10:00 - 22:00',
    startDate: '2026-09-24',
    endDate: '2026-10-03',
    imageColor: '#312e81',
    imageEmoji: '🎬',
    location: { lat: 35.1712, lng: 129.1315 },
  },
  {
    id: 'fireworks',
    tag: 'FESTIVAL',
    titleKo: '부산 불꽃축제',
    titleEn: 'Busan Fireworks Festival',
    titleJa: '釜山花火祭り',
    titleZh: '釜山烟花节',
    locationKo: '광안리 해수욕장',
    locationEn: 'Gwangalli Beach',
    locationJa: '広安里海水浴場',
    locationZh: '广安里海水浴场',
    addressKo: '부산 수영구 광안동 광안리해수욕장',
    addressEn: 'Gwangalli Beach, Suyeong-gu, Busan',
    addressJa: '釜山広域市水営区広安里海水浴場',
    addressZh: '釜山广域市水营区广安里海水浴场',
    descriptionKo:
      '광안대교를 배경으로 펼쳐지는 화려한 불꽃쇼. 해변 일대에서 야외 공연과 먹거리 부스도 함께 즐길 수 있습니다.',
    descriptionEn:
      'A spectacular fireworks show over Gwangandaegyo Bridge, with beach performances and food stalls.',
    descriptionJa:
      '広安大橋を背景に繰り広げられる華やかな花火ショー。ビーチ一帯で野外公演やグルメブースも楽しめます。',
    descriptionZh:
      '以广安大桥为背景的绚烂烟花秀，海滩一带还可欣赏户外演出与美食摊位。',
    hoursKo: '18:00 - 21:30',
    hoursEn: '6:00 PM - 9:30 PM',
    hoursJa: '18:00〜21:30',
    hoursZh: '18:00 - 21:30',
    startDate: '2026-11-07',
    endDate: '2026-11-08',
    imageColor: '#be123c',
    imageEmoji: '🎇',
    location: { lat: 35.1532, lng: 129.1186 },
  },
];

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameIsoDate(a: string, b: string): boolean {
  return a === b;
}

export function festivalActiveOnDate(festival: BusanFestival, dateIso: string): boolean {
  const d = parseIsoDate(dateIso);
  const start = parseIsoDate(festival.startDate);
  const end = parseIsoDate(festival.endDate);
  if (d < start || d > end) {
    return false;
  }
  if (festival.recurringWeekday != null) {
    return d.getDay() === festival.recurringWeekday;
  }
  return true;
}

export function festivalsOnDate(
  festivals: BusanFestival[],
  dateIso: string,
): BusanFestival[] {
  return festivals.filter(f => festivalActiveOnDate(f, dateIso));
}

export function festivalDaysInMonth(
  festivals: BusanFestival[],
  year: number,
  month: number,
): Set<number> {
  const days = new Set<number>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toIsoDate(year, month, day);
    if (festivalsOnDate(festivals, iso).length > 0) {
      days.add(day);
    }
  }
  return days;
}

export function getFestivalById(id: string): BusanFestival | undefined {
  return MOCK_BUSAN_FESTIVALS.find(f => f.id === id);
}

export function festivalTitle(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.titleKo;
  if (language === 'ja') return festival.titleJa;
  if (language === 'zh') return festival.titleZh;
  return festival.titleEn;
}

export function festivalLocation(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.locationKo;
  if (language === 'ja') return festival.locationJa;
  if (language === 'zh') return festival.locationZh;
  return festival.locationEn;
}

export function festivalAddress(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.addressKo;
  if (language === 'ja') return festival.addressJa;
  if (language === 'zh') return festival.addressZh;
  return festival.addressEn;
}

export function festivalDescription(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.descriptionKo;
  if (language === 'ja') return festival.descriptionJa;
  if (language === 'zh') return festival.descriptionZh;
  return festival.descriptionEn;
}

export function festivalHours(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.hoursKo;
  if (language === 'ja') return festival.hoursJa;
  if (language === 'zh') return festival.hoursZh;
  return festival.hoursEn;
}

export function festivalPeriodLabel(festival: BusanFestival, language: AppLanguage): string {
  const fmt = (iso: string) => {
    const d = parseIsoDate(iso);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return language === 'ko' ? `${m}.${day}` : `${m}/${day}`;
  };
  if (festival.recurringWeekday != null) {
    const weekDay = FESTIVAL_CALENDAR_COPY[language].weekDays[festival.recurringWeekday];
    return language === 'ko'
      ? `매주 ${weekDay}요일`
      : language === 'ja'
        ? `毎週${weekDay}曜日`
        : language === 'zh'
          ? `每周${weekDay}`
          : `Every ${weekDay}`;
  }
  if (festival.startDate === festival.endDate) {
    return fmt(festival.startDate);
  }
  return `${fmt(festival.startDate)} - ${fmt(festival.endDate)}`;
}

export function formatSelectedDateLabel(dateIso: string, language: AppLanguage): string {
  const d = parseIsoDate(dateIso);
  const weekDay = FESTIVAL_CALENDAR_COPY[language].weekDays[d.getDay()];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (language === 'ko') {
    return `${m}월 ${day}일 (${weekDay})`;
  }
  if (language === 'ja') {
    return `${m}月${day}日（${weekDay}）`;
  }
  if (language === 'zh') {
    return `${m}月${day}日（周${weekDay}）`;
  }
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${day} (${weekDay})`;
}

export function festivalToRouteItem(festival: BusanFestival, language: AppLanguage): RouteItem {
  return {
    itemId: festival.id,
    sequence: 0,
    placeId: festival.id,
    placeName: festivalTitle(festival, language),
    type: 'ATTRACTION',
    location: festival.location,
    isVisited: false,
  };
}
