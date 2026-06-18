import { ACCOMMODATION_AREAS, ACCOMMODATION_SEARCH } from './planWizard';
import type { AccommodationPlaceDetail } from '../types/googlePlaces';
import type { BusanAccommodation } from '../types/accommodation';
import type { AppLanguage } from '../types/user';

export const ACCOMMODATION_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    loading: string;
    detailLoading: string;
    notFound: string;
    empty: string;
    emptySub: string;
    summary: (count: number, areaCount: number) => string;
    dataHint: string;
    mapTitle: string;
    mapSubtitle: string;
    selectHint: string;
    close: string;
    ratingSummary: (rating: number, count: number) => string;
    reviewsTitle: string;
    reviewsSource: string;
    openInGoogleMaps: string;
    addressLabel: string;
    phoneLabel: string;
    hoursLabel: string;
    websiteLabel: string;
    priceLevelLabel: string;
    openNow: string;
    closedNow: string;
    priceLevel: (level: number) => string;
    pinA11y: (name: string, rating: number) => string;
    areaLabel: (area: string) => string;
  }
> = {
  ko: {
    screenTitle: '부산 숙소',
    loading: '부산 숙소 정보를 불러오는 중…',
    detailLoading: '리뷰·평점을 불러오는 중…',
    notFound: '숙소 정보를 찾을 수 없어요.',
    empty: '표시할 숙소가 없어요',
    emptySub: '다른 지역을 확인해 보세요',
    summary: (count, areaCount) => `${areaCount}개 권역 · 숙소 ${count}곳`,
    dataHint: '평점·리뷰는 Google Maps API 연동 예정',
    mapTitle: '카카오맵',
    mapSubtitle: '부산 주요 숙소 위치',
    selectHint: '지도에서 숙소를 선택하면 평점·리뷰를 볼 수 있어요',
    close: '닫기',
    ratingSummary: (rating, count) => `★ ${rating.toFixed(1)} · 리뷰 ${count.toLocaleString()}개`,
    reviewsTitle: 'Google 리뷰',
    reviewsSource: 'Google Maps에서 제공하는 리뷰입니다.',
    openInGoogleMaps: 'Google 지도에서 보기',
    addressLabel: '주소',
    phoneLabel: '전화',
    hoursLabel: '영업 시간',
    websiteLabel: '웹사이트',
    priceLevelLabel: '가격대',
    openNow: '영업 중',
    closedNow: '영업 종료',
    priceLevel: level => '₩'.repeat(Math.min(level, 4)),
    pinA11y: (name, rating) => `${name}, 별점 ${rating.toFixed(1)}`,
    areaLabel: area => area,
  },
  en: {
    screenTitle: 'Busan stays',
    loading: 'Loading stays in Busan…',
    detailLoading: 'Loading ratings and reviews…',
    notFound: 'Stay not found.',
    empty: 'No stays to show',
    emptySub: 'Try another area',
    summary: (count, areaCount) => `${areaCount} areas · ${count} stays`,
    dataHint: 'Ratings and reviews via Google Maps API (planned)',
    mapTitle: 'Kakao Map',
    mapSubtitle: 'Major stays in Busan',
    selectHint: 'Select a stay on the map to see ratings and reviews',
    close: 'Close',
    ratingSummary: (rating, count) => `★ ${rating.toFixed(1)} · ${count.toLocaleString()} reviews`,
    reviewsTitle: 'Google reviews',
    reviewsSource: 'Reviews provided by Google Maps.',
    openInGoogleMaps: 'Open in Google Maps',
    addressLabel: 'Address',
    phoneLabel: 'Phone',
    hoursLabel: 'Hours',
    websiteLabel: 'Website',
    priceLevelLabel: 'Price level',
    openNow: 'Open now',
    closedNow: 'Closed',
    priceLevel: level => '$'.repeat(Math.min(level, 4)),
    pinA11y: (name, rating) => `${name}, rating ${rating.toFixed(1)}`,
    areaLabel: area => area,
  },
  ja: {
    screenTitle: '釜山の宿泊',
    loading: '釜山の宿泊情報を読み込み中…',
    detailLoading: '評価・レビューを読み込み中…',
    notFound: '宿泊情報が見つかりません。',
    empty: '表示する宿がありません',
    emptySub: '他のエリアを確認してください',
    summary: (count, areaCount) => `${areaCount}エリア · 宿泊 ${count}件`,
    dataHint: '評価・レビューはGoogle Maps API連携予定',
    mapTitle: 'Googleマップ',
    mapSubtitle: '釜山の主要宿泊施設',
    selectHint: '地図で宿を選ぶと評価・レビューが表示されます',
    close: '閉じる',
    ratingSummary: (rating, count) => `★ ${rating.toFixed(1)} · レビュー ${count.toLocaleString()}件`,
    reviewsTitle: 'Googleレビュー',
    reviewsSource: 'Google Mapsのレビューです。',
    openInGoogleMaps: 'Googleマップで見る',
    addressLabel: '住所',
    phoneLabel: '電話',
    hoursLabel: '営業時間',
    websiteLabel: 'ウェブサイト',
    priceLevelLabel: '価格帯',
    openNow: '営業中',
    closedNow: '営業終了',
    priceLevel: level => '¥'.repeat(Math.min(level, 4)),
    pinA11y: (name, rating) => `${name}、評価 ${rating.toFixed(1)}`,
    areaLabel: area => area,
  },
  zh: {
    screenTitle: '釜山住宿',
    loading: '正在加载釜山住宿信息…',
    detailLoading: '正在加载评分与评价…',
    notFound: '未找到住宿信息。',
    empty: '暂无住宿可显示',
    emptySub: '请尝试其他区域',
    summary: (count, areaCount) => `${areaCount} 个区域 · ${count} 家住宿`,
    dataHint: '评分与评价将通过 Google Maps API 接入',
    mapTitle: 'Google 地图',
    mapSubtitle: '釜山主要住宿位置',
    selectHint: '在地图上选择住宿即可查看评分与评价',
    close: '关闭',
    ratingSummary: (rating, count) => `★ ${rating.toFixed(1)} · ${count.toLocaleString()} 条评价`,
    reviewsTitle: 'Google 评价',
    reviewsSource: '评价来自 Google Maps。',
    openInGoogleMaps: '在 Google 地图中打开',
    addressLabel: '地址',
    phoneLabel: '电话',
    hoursLabel: '营业时间',
    websiteLabel: '网站',
    priceLevelLabel: '价格',
    openNow: '营业中',
    closedNow: '已打烊',
    priceLevel: level => '¥'.repeat(Math.min(level, 4)),
    pinA11y: (name, rating) => `${name}，评分 ${rating.toFixed(1)}`,
    areaLabel: area => area,
  },
};

const MOCK_REVIEWS: Record<string, import('../types/googlePlaces').PlaceReviewVO[]> = {
  paradise: [
    {
      authorName: '김민지',
      rating: 5,
      text: '해운대 바다뷰가 정말 좋아요. 조식도 훌륭하고 직원분들이 친절합니다.',
      relativePublishTimeDescription: '2주 전',
      publishTime: '2026-05-19T00:00:00.000Z',
    },
    {
      authorName: 'James Park',
      rating: 4,
      text: 'Great location near the beach. Room was clean but a bit pricey for the season.',
      relativePublishTimeDescription: '1개월 전',
      publishTime: '2026-04-01T00:00:00.000Z',
    },
    {
      authorName: '佐藤花子',
      rating: 5,
      text: 'ロビーからの眺めが最高。チェックインもスムーズでした。',
      relativePublishTimeDescription: '2개월 전',
      publishTime: '2026-03-01T00:00:00.000Z',
    },
  ],
  signiel: [
    {
      authorName: '이서준',
      rating: 5,
      text: '부산 최고급 호텔답게 서비스와 전망 모두 만족스러웠습니다.',
      relativePublishTimeDescription: '3일 전',
      publishTime: '2026-06-12T00:00:00.000Z',
    },
    {
      authorName: 'Chen Wei',
      rating: 5,
      text: 'Stunning ocean view from the lounge. Worth every won.',
      relativePublishTimeDescription: '2주 전',
      publishTime: '2026-05-29T00:00:00.000Z',
    },
  ],
  lotte: [
    {
      authorName: '박지훈',
      rating: 4,
      text: '서면 중심이라 쇼핑·교통 편해요. 객실은 조용하고 깔끔합니다.',
      relativePublishTimeDescription: '1주 전',
      publishTime: '2026-06-08T00:00:00.000Z',
    },
    {
      authorName: 'Maria Lopez',
      rating: 4,
      text: 'Central Seomyeon location. Easy access to subway and restaurants.',
      relativePublishTimeDescription: '3주 전',
      publishTime: '2026-05-25T00:00:00.000Z',
    },
  ],
  nampo: [
    {
      authorName: '최유나',
      rating: 4,
      text: '가성비 좋은 게스트하우스. 남포·자갈치 산책하기 좋아요.',
      relativePublishTimeDescription: '5일 전',
      publishTime: '2026-06-10T00:00:00.000Z',
    },
    {
      authorName: 'Tom Baker',
      rating: 3,
      text: 'Basic but clean. Shared kitchen was useful for budget travelers.',
      relativePublishTimeDescription: '1개월 전',
      publishTime: '2026-05-02T00:00:00.000Z',
    },
  ],
  gwangan: [
    {
      authorName: '정하늘',
      rating: 4,
      text: '광안대교 야경이 보이는 객실이 인상적이었어요.',
      relativePublishTimeDescription: '1주 전',
      publishTime: '2026-06-08T00:00:00.000Z',
    },
    {
      authorName: 'Anna Kim',
      rating: 5,
      text: 'Perfect for Gwangalli night views. Beach is right across the street.',
      relativePublishTimeDescription: '2주 전',
      publishTime: '2026-05-29T00:00:00.000Z',
    },
  ],
};

function mockAccommodationDetail(
  entry: Omit<AccommodationPlaceDetail, 'kind' | 'googleTypes' | 'photos'> & {
    googleTypes?: string[];
    photos?: AccommodationPlaceDetail['photos'];
  },
): AccommodationPlaceDetail {
  return {
    ...entry,
    kind: 'accommodation',
    googleTypes: entry.googleTypes ?? ['lodging', 'hotel'],
    photos: entry.photos ?? [],
  };
}

/** Google Places API 연동 전 목업 — internalPlaceId(stay_*) 키 */
export const ACCOMMODATION_MOCK_DETAILS: Record<string, AccommodationPlaceDetail> = {
  stay_paradise: mockAccommodationDetail({
    internalPlaceId: 'stay_paradise',
    googlePlaceId: 'ChIJmock_paradise_hotel_busan',
    name: '파라다이스 호텔 부산',
    formattedAddress: '부산광역시 해운대구 해운대해변로 296',
    location: { lat: 35.158, lng: 129.165 },
    rating: 4.5,
    userRatingCount: 3842,
    openingHours: {
      openNow: true,
      weekdayDescriptions: [
        '월요일: 24시간',
        '화요일: 24시간',
        '수요일: 24시간',
        '목요일: 24시간',
        '금요일: 24시간',
        '토요일: 24시간',
        '일요일: 24시간',
      ],
    },
    phones: { international: '+82-51-742-2121' },
    websiteUri: 'https://www.busanparadisehotel.co.kr',
    priceLevel: 4,
    googleTypes: ['lodging', 'hotel'],
    editorialSummary:
      '해운대 해변과 인접한 5성급 리조트 호텔. 오션뷰 객실과 스파·수영장 시설을 갖추고 있습니다.',
    reviews: MOCK_REVIEWS.paradise,
  }),
  stay_signiel: mockAccommodationDetail({
    internalPlaceId: 'stay_signiel',
    googlePlaceId: 'ChIJmock_signiel_busan',
    name: '시그니엘 부산',
    formattedAddress: '부산광역시 해운대구 마린시티2로 38',
    location: { lat: 35.163, lng: 129.17 },
    rating: 4.8,
    userRatingCount: 2156,
    openingHours: {
      openNow: true,
      weekdayDescriptions: ['월요일: 24시간', '화요일: 24시간', '수요일: 24시간', '목요일: 24시간', '금요일: 24시간', '토요일: 24시간', '일요일: 24시간'],
    },
    phones: { international: '+82-51-922-9000' },
    websiteUri: 'https://www.signiel.com/busan',
    priceLevel: 4,
    editorialSummary: '마린시티 랜드마크 초고층 호텔. 파노라마 오션뷰와 미슐랭 레스토랑이 특징입니다.',
    reviews: MOCK_REVIEWS.signiel,
  }),
  stay_lotte: mockAccommodationDetail({
    internalPlaceId: 'stay_lotte',
    googlePlaceId: 'ChIJmock_lotte_hotel_busan',
    name: '롯데 호텔 부산',
    formattedAddress: '부산광역시 부산진구 가야대로 772',
    location: { lat: 35.157, lng: 129.055 },
    rating: 4.4,
    userRatingCount: 4521,
    openingHours: {
      openNow: true,
      weekdayDescriptions: ['월요일: 24시간', '화요일: 24시간', '수요일: 24시간', '목요일: 24시간', '금요일: 24시간', '토요일: 24시간', '일요일: 24시간'],
    },
    phones: { international: '+82-51-810-5101' },
    websiteUri: 'https://www.lottehotel.com/busan',
    priceLevel: 4,
    editorialSummary: '서면 중심가에 위치한 비즈니스·관광 겸용 호텔입니다.',
    reviews: MOCK_REVIEWS.lotte,
  }),
  stay_nampo_gh: mockAccommodationDetail({
    internalPlaceId: 'stay_nampo_gh',
    googlePlaceId: 'ChIJmock_nampo_guesthouse',
    name: '남포 게스트하우스',
    formattedAddress: '부산광역시 중구 광복로 일대',
    location: { lat: 35.099, lng: 129.034 },
    rating: 4.1,
    userRatingCount: 892,
    openingHours: {
      openNow: true,
      weekdayDescriptions: ['월요일: 15:00 - 22:00', '화요일: 15:00 - 22:00', '수요일: 15:00 - 22:00', '목요일: 15:00 - 22:00', '금요일: 15:00 - 23:00', '토요일: 15:00 - 23:00', '일요일: 15:00 - 22:00'],
    },
    phones: { international: '+82-10-1234-5678' },
    priceLevel: 1,
    googleTypes: ['lodging', 'guest_house'],
    editorialSummary: '남포·BIFF 광장 근처의 아늑한 게스트하우스. 배낭 여행객에게 인기 있습니다.',
    reviews: MOCK_REVIEWS.nampo,
  }),
  stay_gwangan: mockAccommodationDetail({
    internalPlaceId: 'stay_gwangan',
    googlePlaceId: 'ChIJmock_gwangan_beach_hotel',
    name: '광안리 비치 호텔',
    formattedAddress: '부산광역시 수영구 광안해변로 219',
    location: { lat: 35.154, lng: 129.118 },
    rating: 4.3,
    userRatingCount: 1678,
    openingHours: {
      openNow: true,
      weekdayDescriptions: ['월요일: 24시간', '화요일: 24시간', '수요일: 24시간', '목요일: 24시간', '금요일: 24시간', '토요일: 24시간', '일요일: 24시간'],
    },
    phones: { international: '+82-51-622-8000' },
    priceLevel: 3,
    editorialSummary: '광안리 해변과 광안대교 야경을 즐기기 좋은 비치프론트 호텔입니다.',
    reviews: MOCK_REVIEWS.gwangan,
  }),
};

/** route.placeId 또는 wizard accommodation id → mock lookup key */
export function resolveAccommodationPlaceId(placeId: string): string {
  const byMeta = ACCOMMODATION_SEARCH.find(
    s => s.meta?.placeId === placeId || s.id === placeId,
  );
  return byMeta?.meta?.placeId ?? placeId;
}

export function getAccommodationMockDetail(placeId: string): AccommodationPlaceDetail | null {
  const key = resolveAccommodationPlaceId(placeId);
  return ACCOMMODATION_MOCK_DETAILS[key] ?? null;
}

export function buildBusanAccommodationListings(): BusanAccommodation[] {
  return ACCOMMODATION_SEARCH.flatMap(stay => {
    if (!stay.meta) {
      return [];
    }
    const internalPlaceId = stay.meta.placeId ?? stay.id;
    const detail = ACCOMMODATION_MOCK_DETAILS[internalPlaceId];
    const area = ACCOMMODATION_AREAS.find(a => a.id === stay.areaId);
    if (!area) {
      return [];
    }
    return [
      {
        id: stay.id,
        internalPlaceId,
        googlePlaceId: detail?.googlePlaceId ?? '',
        name: stay.label.ko,
        areaId: stay.areaId,
        areaLabel: area.label,
        location: { lat: stay.meta.lat, lng: stay.meta.lng },
        rating: detail?.rating ?? 0,
        userRatingsTotal: detail?.userRatingCount ?? 0,
        formattedAddress: detail?.formattedAddress ?? '',
        priceLevel: detail?.priceLevel as BusanAccommodation['priceLevel'],
        stayType: detail?.googleTypes[1] ?? detail?.googleTypes[0] ?? 'lodging',
      },
    ];
  });
}

export function localizedAccommodationName(stay: BusanAccommodation, language: AppLanguage): string {
  const search = ACCOMMODATION_SEARCH.find(s => s.id === stay.id);
  return search?.label[language] ?? stay.name;
}

export function localizedAreaName(stay: BusanAccommodation, language: AppLanguage): string {
  return stay.areaLabel[language] ?? stay.areaLabel.ko;
}
