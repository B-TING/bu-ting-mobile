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
  summaryKo: string;
  summaryEn: string;
  summaryJa: string;
  summaryZh: string;
  imageUri: string;
  imageColor: string;
  imageEmoji: string;
  location: { lat: number; lng: number };
};

export const MONTH_NAMES: Record<AppLanguage, string[]> = {
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

export const FESTIVAL_CALENDAR_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    monthFestivalsLabel: (year: number, month: number) => string;
    emptyMonthList: string;
    emptyMonthListSub: string;
    festivalCount: (n: number) => string;
    prevMonth: string;
    nextMonth: string;
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
    statusComingSoon: string;
    statusEnded: string;
    commentsTitle: string;
    commentPlaceholder: string;
    commentsEmpty: string;
    commentsComingSoon: string;
    close: string;
    mockHint: string;
  }
> = {
  ko: {
    screenTitle: '축제 캘린더',
    monthFestivalsLabel: (year, month) => `${year}년 ${MONTH_NAMES.ko[month]} 축제`,
    emptyMonthList: '이 달에 예정된 축제가 없어요',
    emptyMonthListSub: '다른 달을 선택해 보세요',
    festivalCount: n => `${n}개 축제`,
    prevMonth: '이전 달',
    nextMonth: '다음 달',
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
    statusComingSoon: 'COMING SOON',
    statusEnded: '종료된 행사입니다',
    commentsTitle: '코멘트',
    commentPlaceholder: '축제 후기를 남겨보세요',
    commentsEmpty: '아직 코멘트가 없어요',
    commentsComingSoon: '코멘트 기능은 준비 중이에요',
    close: '닫기',
    mockHint: '축제 API 연동 전 목업 데이터입니다.',
  },
  en: {
    screenTitle: 'Festival Calendar',
    monthFestivalsLabel: (year, month) => `Festivals in ${MONTH_NAMES.en[month]} ${year}`,
    emptyMonthList: 'No festivals this month',
    emptyMonthListSub: 'Try browsing another month',
    festivalCount: n => `${n} festival${n === 1 ? '' : 's'}`,
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
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
    statusComingSoon: 'COMING SOON',
    statusEnded: 'This event has ended',
    commentsTitle: 'Comments',
    commentPlaceholder: 'Share your festival experience',
    commentsEmpty: 'No comments yet',
    commentsComingSoon: 'Comments are coming soon',
    close: 'Close',
    mockHint: 'Mock data until festival API is connected.',
  },
  ja: {
    screenTitle: '祭りカレンダー',
    monthFestivalsLabel: (year, month) => `${year}年${MONTH_NAMES.ja[month]}の祭り`,
    emptyMonthList: '今月予定の祭りはありません',
    emptyMonthListSub: '別の月を選んでみてください',
    festivalCount: n => `${n}件の祭り`,
    prevMonth: '前の月',
    nextMonth: '次の月',
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
    statusComingSoon: 'COMING SOON',
    statusEnded: '終了したイベントです',
    commentsTitle: 'コメント',
    commentPlaceholder: '祭りの感想を書いてみましょう',
    commentsEmpty: 'まだコメントがありません',
    commentsComingSoon: 'コメント機能は準備中です',
    close: '閉じる',
    mockHint: '祭りAPI連携前のモックデータです。',
  },
  zh: {
    screenTitle: '节庆日历',
    monthFestivalsLabel: (year, month) => `${year}年${MONTH_NAMES.zh[month]}节庆`,
    emptyMonthList: '本月没有节庆活动',
    emptyMonthListSub: '请尝试浏览其他月份',
    festivalCount: n => `${n} 个节庆`,
    prevMonth: '上个月',
    nextMonth: '下个月',
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
    statusComingSoon: 'COMING SOON',
    statusEnded: '活动已结束',
    commentsTitle: '评论',
    commentPlaceholder: '分享你的节庆体验',
    commentsEmpty: '暂无评论',
    commentsComingSoon: '评论功能即将上线',
    close: '关闭',
    mockHint: '节庆 API 接入前的模拟数据。',
  },
};

export type FestivalStatus = 'upcoming' | 'ongoing' | 'ended';

const FESTIVAL_STATUS_ORDER: Record<FestivalStatus, number> = {
  ongoing: 0,
  upcoming: 1,
  ended: 2,
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
    summaryKo: '세계적인 모래조각 작품과 체험 부스가 가득한 여름 대표 축제',
    summaryEn: 'Summer festival with world-class sand sculptures and hands-on booths',
    summaryJa: '世界的な砂の彫刻と体験ブースが楽しめる夏の代表祭り',
    summaryZh: '世界级沙雕作品与体验摊位齐聚的夏季代表节庆',
    imageUri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
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
    summaryKo: '국내외 거리무용 팀의 화려한 퍼포먼스, 저녁 공연이 특히 인기',
    summaryEn: 'Vibrant street dance performances from crews around the world',
    summaryJa: '国内外のストリートダンスチームによる華やかなパフォーマンス',
    summaryZh: '国内外街舞团队的精彩演出，晚间场次尤其热门',
    imageUri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
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
    summaryKo: '매주 토요일 밤, 광안대교를 배경으로 펼쳐지는 드론 라이트쇼',
    summaryEn: 'Saturday night drone light show over Gwangandaegyo Bridge',
    summaryJa: '毎週土曜の夜、広安大橋を背景に繰り広げられるドローンショー',
    summaryZh: '每周六夜晚，以广安大桥为背景的无人机灯光秀',
    imageUri: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
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
    summaryKo: '부산 대표 먹거리와 전국 미식 트럭이 한자리에 모이는 미식 축제',
    summaryEn: 'Busan signature dishes and gourmet food trucks in one place',
    summaryJa: '釜山代表グルメと全国のグルメトラックが集まる食の祭典',
    summaryZh: '釜山特色美食与全国美食餐车齐聚一堂的美食节',
    imageUri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
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
    summaryKo: '국내외 록·인디 밴드가 모이는 대규모 야외 음악 축제',
    summaryEn: 'Large outdoor music festival with rock and indie bands',
    summaryJa: '国内外のロック・インディーバンドが集う大規模野外音楽祭',
    summaryZh: '国内外摇滚与独立乐队齐聚的大型户外音乐节',
    imageUri: 'https://images.unsplash.com/photo-1459747229923-d7f20585ecc5?w=800&q=80',
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
    summaryKo: '아시아 최대 규모 영화제, 상영작·GV·야외 상영까지',
    summaryEn: 'Asia\'s largest film festival with screenings and director talks',
    summaryJa: 'アジア最大級の映画祭、上映・トーク・野外上映を開催',
    summaryZh: '亚洲最大规模电影节，展映、见面会、露天放映应有尽有',
    imageUri: 'https://images.unsplash.com/photo-1489599849927-2fa91eadacb4?w=800&q=80',
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
    summaryKo: '광안대교를 배경으로 펼쳐지는 화려한 불꽃쇼와 해변 축제',
    summaryEn: 'Spectacular fireworks over Gwangandaegyo Bridge and beach festivities',
    summaryJa: '広安大橋を背景に繰り広げられる華やかな花火とビーチフェス',
    summaryZh: '以广安大桥为背景的绚烂烟花秀与海滩庆典',
    imageUri: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
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

export function getFestivalStatus(
  festival: BusanFestival,
  refDate: string = todayIso(),
): FestivalStatus {
  const today = parseIsoDate(refDate);
  const start = parseIsoDate(festival.startDate);
  const end = parseIsoDate(festival.endDate);
  if (today < start) {
    return 'upcoming';
  }
  if (today > end) {
    return 'ended';
  }
  return 'ongoing';
}

export function festivalStatusLabel(status: FestivalStatus, language: AppLanguage): string {
  const copy = FESTIVAL_CALENDAR_COPY[language];
  return status === 'upcoming' ? copy.statusComingSoon : copy.statusEnded;
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

export function sortFestivalsByStatus(
  festivals: BusanFestival[],
  refDate: string = todayIso(),
): BusanFestival[] {
  return [...festivals].sort((a, b) => {
    const statusDiff =
      FESTIVAL_STATUS_ORDER[getFestivalStatus(a, refDate)] -
      FESTIVAL_STATUS_ORDER[getFestivalStatus(b, refDate)];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return a.startDate.localeCompare(b.startDate);
  });
}

export function festivalsInMonth(
  festivals: BusanFestival[],
  year: number,
  month: number,
): BusanFestival[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const inMonth = festivals.filter(f => {
    for (let day = 1; day <= daysInMonth; day++) {
      if (festivalActiveOnDate(f, toIsoDate(year, month, day))) {
        return true;
      }
    }
    return false;
  });
  return sortFestivalsByStatus(inMonth);
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

export function festivalSummary(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.summaryKo;
  if (language === 'ja') return festival.summaryJa;
  if (language === 'zh') return festival.summaryZh;
  return festival.summaryEn;
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
