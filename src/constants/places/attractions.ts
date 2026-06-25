import { BUSAN_ATTRACTIONS } from '../plan/planWizard';
import { PLACE_CATALOG } from './placeCatalog';
import { ATTRACTION_MOCK_DETAILS } from './attractionPlaces';
import type { BusanAttraction } from '../../types/attraction';
import type { AppLanguage } from '../../types/user';

export const ATTRACTION_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    loading: string;
    detailLoading: string;
    notFound: string;
    empty: string;
    emptySub: string;
    summary: (count: number) => string;
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
    openNow: string;
    closedNow: string;
    pinA11y: (name: string, rating: number) => string;
    bookmarkedPinA11y: (name: string, rating: number) => string;
    bookmark: string;
    unbookmark: string;
    categoryLabel: (category: string) => string;
  }
> = {
  ko: {
    screenTitle: '부산 관광지',
    loading: '부산 관광지 정보를 불러오는 중…',
    detailLoading: '리뷰·평점을 불러오는 중…',
    notFound: '관광지 정보를 찾을 수 없어요.',
    empty: '표시할 관광지가 없어요',
    emptySub: '다른 지역을 확인해 보세요',
    summary: count => `관광지 ${count}곳`,
    dataHint: '평점·리뷰는 Google Maps API 연동 예정',
    mapTitle: '카카오맵',
    mapSubtitle: '부산 주요 관광지 위치',
    selectHint: '지도에서 관광지를 선택하면 평점·리뷰를 볼 수 있어요',
    close: '닫기',
    ratingSummary: (rating, count) => `★ ${rating.toFixed(1)} · 리뷰 ${count.toLocaleString()}개`,
    reviewsTitle: 'Google 리뷰',
    reviewsSource: 'Google Maps에서 제공하는 리뷰입니다.',
    openInGoogleMaps: 'Google 지도에서 보기',
    addressLabel: '주소',
    phoneLabel: '전화',
    hoursLabel: '영업 시간',
    openNow: '영업 중',
    closedNow: '영업 종료',
    pinA11y: (name, rating) => `${name}, 별점 ${rating.toFixed(1)}`,
    bookmarkedPinA11y: (name, rating) => `북마크한 ${name}, 별점 ${rating.toFixed(1)}`,
    bookmark: '북마크',
    unbookmark: '북마크 해제',
    categoryLabel: category => category,
  },
  en: {
    screenTitle: 'Busan attractions',
    loading: 'Loading attractions in Busan…',
    detailLoading: 'Loading ratings and reviews…',
    notFound: 'Attraction not found.',
    empty: 'No attractions to show',
    emptySub: 'Try another area',
    summary: count => `${count} attractions`,
    dataHint: 'Ratings and reviews via Google Maps API (planned)',
    mapTitle: 'Kakao Map',
    mapSubtitle: 'Major attractions in Busan',
    selectHint: 'Select an attraction on the map to see ratings and reviews',
    close: 'Close',
    ratingSummary: (rating, count) => `★ ${rating.toFixed(1)} · ${count.toLocaleString()} reviews`,
    reviewsTitle: 'Google reviews',
    reviewsSource: 'Reviews provided by Google Maps.',
    openInGoogleMaps: 'Open in Google Maps',
    addressLabel: 'Address',
    phoneLabel: 'Phone',
    hoursLabel: 'Hours',
    openNow: 'Open now',
    closedNow: 'Closed',
    pinA11y: (name, rating) => `${name}, rating ${rating.toFixed(1)}`,
    bookmarkedPinA11y: (name, rating) => `Bookmarked ${name}, rating ${rating.toFixed(1)}`,
    bookmark: 'Bookmark',
    unbookmark: 'Remove bookmark',
    categoryLabel: category => category,
  },
  ja: {
    screenTitle: '釜山の観光地',
    loading: '釜山の観光地情報を読み込み中…',
    detailLoading: '評価・レビューを読み込み中…',
    notFound: '観光地情報が見つかりません。',
    empty: '表示する観光地がありません',
    emptySub: '他のエリアを確認してください',
    summary: count => `観光地 ${count}件`,
    dataHint: '評価・レビューはGoogle Maps API連携予定',
    mapTitle: 'Googleマップ',
    mapSubtitle: '釜山の主要観光地',
    selectHint: '地図で観光地を選ぶと評価・レビューが表示されます',
    close: '閉じる',
    ratingSummary: (rating, count) => `★ ${rating.toFixed(1)} · レビュー ${count.toLocaleString()}件`,
    reviewsTitle: 'Googleレビュー',
    reviewsSource: 'Google Mapsのレビューです。',
    openInGoogleMaps: 'Googleマップで見る',
    addressLabel: '住所',
    phoneLabel: '電話',
    hoursLabel: '営業時間',
    openNow: '営業中',
    closedNow: '営業終了',
    pinA11y: (name, rating) => `${name}、評価 ${rating.toFixed(1)}`,
    bookmarkedPinA11y: (name, rating) => `ブックマーク済み ${name}、評価 ${rating.toFixed(1)}`,
    bookmark: 'ブックマーク',
    unbookmark: 'ブックマーク解除',
    categoryLabel: category => category,
  },
  zh: {
    screenTitle: '釜山景点',
    loading: '正在加载釜山景点信息…',
    detailLoading: '正在加载评分与评价…',
    notFound: '未找到景点信息。',
    empty: '暂无景点可显示',
    emptySub: '请尝试其他区域',
    summary: count => `${count} 个景点`,
    dataHint: '评分与评价将通过 Google Maps API 接入',
    mapTitle: 'Google 地图',
    mapSubtitle: '釜山主要景点位置',
    selectHint: '在地图上选择景点即可查看评分与评价',
    close: '关闭',
    ratingSummary: (rating, count) => `★ ${rating.toFixed(1)} · ${count.toLocaleString()} 条评价`,
    reviewsTitle: 'Google 评价',
    reviewsSource: '评价来自 Google Maps。',
    openInGoogleMaps: '在 Google 地图中打开',
    addressLabel: '地址',
    phoneLabel: '电话',
    hoursLabel: '营业时间',
    openNow: '营业中',
    closedNow: '已打烊',
    pinA11y: (name, rating) => `${name}，评分 ${rating.toFixed(1)}`,
    bookmarkedPinA11y: (name, rating) => `已收藏 ${name}，评分 ${rating.toFixed(1)}`,
    bookmark: '收藏',
    unbookmark: '取消收藏',
    categoryLabel: category => category,
  },
};

export function buildBusanAttractionListings(): BusanAttraction[] {
  return BUSAN_ATTRACTIONS.flatMap(spot => {
    if (!spot.meta) {
      return [];
    }
    const internalPlaceId = spot.meta.placeId ?? `tour_${spot.id}`;
    const detail = ATTRACTION_MOCK_DETAILS[internalPlaceId];
    const catalog = PLACE_CATALOG[internalPlaceId];
    const categoryLabel = catalog?.typeLabel ?? {
      ko: '관광지',
      en: 'Attraction',
      ja: '観光',
      zh: '景点',
    };

    return [
      {
        id: spot.id,
        internalPlaceId,
        googlePlaceId: detail?.googlePlaceId ?? '',
        name: spot.label.ko,
        categoryLabel,
        location: { lat: spot.meta.lat, lng: spot.meta.lng },
        rating: detail?.rating ?? catalog?.rating ?? 0,
        userRatingsTotal: detail?.userRatingCount ?? catalog?.reviewCount ?? 0,
        formattedAddress: detail?.formattedAddress ?? '',
      },
    ];
  });
}

export function localizedAttractionName(
  attraction: BusanAttraction,
  language: AppLanguage,
): string {
  const spot = BUSAN_ATTRACTIONS.find(item => item.id === attraction.id);
  return spot?.label[language] ?? attraction.name;
}

export function localizedAttractionCategory(
  attraction: BusanAttraction,
  language: AppLanguage,
): string {
  return attraction.categoryLabel[language] ?? attraction.categoryLabel.ko;
}
