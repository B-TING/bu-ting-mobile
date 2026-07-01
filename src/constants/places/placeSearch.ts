import type { AppLanguage } from '../../types/user';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { PlaceContentTypeId } from '../../types/placesApi';

export const PLACE_SEARCH_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    loading: string;
    detailLoading: string;
    notFound: string;
    empty: string;
    emptySub: string;
    summary: (count: number, district: string) => string;
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
    bookmark: string;
    unbookmark: string;
    priceLevel: (level: number) => string;
    priceLevelLabel: string;
    categoryLabels: Record<PlaceContentTypeId, string>;
    categoryTabA11y: (label: string) => string;
    subtitleLabel: (label: string) => string;
  }
> = {
  ko: {
    screenTitle: '부산 장소 찾기',
    loading: '장소 정보를 불러오는 중…',
    detailLoading: '상세 정보를 불러오는 중…',
    notFound: '장소 정보를 찾을 수 없어요.',
    empty: '표시할 장소가 없어요',
    emptySub: '다른 유형이나 지역을 확인해 보세요',
    summary: (count, district) => `${district} · ${count}곳`,
    dataHint: '한국관광공사·Google Places 연동',
    mapTitle: '카카오맵',
    mapSubtitle: '선택한 지역의 장소',
    selectHint: '지도에서 장소를 선택하면 상세 정보를 볼 수 있어요',
    close: '닫기',
    ratingSummary: (rating, count) =>
      count > 0 ? `★ ${rating.toFixed(1)} · 리뷰 ${count.toLocaleString()}개` : '리뷰 없음',
    reviewsTitle: 'Google 리뷰',
    reviewsSource: 'Google Maps에서 제공하는 리뷰입니다.',
    openInGoogleMaps: 'Google 지도에서 보기',
    addressLabel: '주소',
    phoneLabel: '전화',
    hoursLabel: '영업 시간',
    openNow: '영업 중',
    closedNow: '영업 종료',
    bookmark: '북마크',
    unbookmark: '북마크 해제',
    priceLevelLabel: '가격대',
    priceLevel: level => `${'₩'.repeat(level)}`,
    categoryLabels: {
      [PLACE_CONTENT_TYPE.attraction]: '관광지',
      [PLACE_CONTENT_TYPE.accommodation]: '숙박',
      [PLACE_CONTENT_TYPE.restaurant]: '음식점',
    },
    categoryTabA11y: label => `${label} 보기`,
    subtitleLabel: label => label,
  },
  en: {
    screenTitle: 'Find places in Busan',
    loading: 'Loading places…',
    detailLoading: 'Loading details…',
    notFound: 'Place not found.',
    empty: 'No places to show',
    emptySub: 'Try another category or district',
    summary: (count, district) => `${district} · ${count} places`,
    dataHint: 'Korea Tourism Organization · Google Places',
    mapTitle: 'Kakao Map',
    mapSubtitle: 'Places in your district',
    selectHint: 'Select a place on the map to see details',
    close: 'Close',
    ratingSummary: (rating, count) =>
      count > 0 ? `★ ${rating.toFixed(1)} · ${count.toLocaleString()} reviews` : 'No reviews',
    reviewsTitle: 'Google reviews',
    reviewsSource: 'Reviews from Google Maps.',
    openInGoogleMaps: 'Open in Google Maps',
    addressLabel: 'Address',
    phoneLabel: 'Phone',
    hoursLabel: 'Hours',
    openNow: 'Open now',
    closedNow: 'Closed',
    bookmark: 'Bookmark',
    unbookmark: 'Remove bookmark',
    priceLevelLabel: 'Price level',
    priceLevel: level => `${'$'.repeat(level)}`,
    categoryLabels: {
      [PLACE_CONTENT_TYPE.attraction]: 'Attractions',
      [PLACE_CONTENT_TYPE.accommodation]: 'Stays',
      [PLACE_CONTENT_TYPE.restaurant]: 'Restaurants',
    },
    categoryTabA11y: label => `Show ${label}`,
    subtitleLabel: label => label,
  },
  ja: {
    screenTitle: '釜山のスポット',
    loading: '読み込み中…',
    detailLoading: '詳細を読み込み中…',
    notFound: '情報が見つかりません。',
    empty: '表示する場所がありません',
    emptySub: '他のカテゴリや地域をお試しください',
    summary: (count, district) => `${district} · ${count}件`,
    dataHint: '韓国観光公社・Google Places',
    mapTitle: 'カカオマップ',
    mapSubtitle: '選択した地域のスポット',
    selectHint: '地図で場所を選ぶと詳細が表示されます',
    close: '閉じる',
    ratingSummary: (rating, count) =>
      count > 0 ? `★ ${rating.toFixed(1)} · レビュー ${count.toLocaleString()}件` : 'レビューなし',
    reviewsTitle: 'Googleレビュー',
    reviewsSource: 'Google Mapsのレビューです。',
    openInGoogleMaps: 'Googleマップで見る',
    addressLabel: '住所',
    phoneLabel: '電話',
    hoursLabel: '営業時間',
    openNow: '営業中',
    closedNow: '営業終了',
    bookmark: 'ブックマーク',
    unbookmark: '解除',
    priceLevelLabel: '価格帯',
    priceLevel: level => `${'¥'.repeat(level)}`,
    categoryLabels: {
      [PLACE_CONTENT_TYPE.attraction]: '観光地',
      [PLACE_CONTENT_TYPE.accommodation]: '宿泊',
      [PLACE_CONTENT_TYPE.restaurant]: '飲食店',
    },
    categoryTabA11y: label => `${label}を表示`,
    subtitleLabel: label => label,
  },
  zh: {
    screenTitle: '釜山地点搜索',
    loading: '正在加载…',
    detailLoading: '正在加载详情…',
    notFound: '未找到地点信息。',
    empty: '暂无地点',
    emptySub: '请尝试其他分类或区域',
    summary: (count, district) => `${district} · ${count} 个`,
    dataHint: '韩国观光公社 · Google Places',
    mapTitle: 'Kakao地图',
    mapSubtitle: '所选区域的地点',
    selectHint: '在地图上选择地点查看详情',
    close: '关闭',
    ratingSummary: (rating, count) =>
      count > 0 ? `★ ${rating.toFixed(1)} · ${count.toLocaleString()} 条评价` : '暂无评价',
    reviewsTitle: 'Google评价',
    reviewsSource: '来自 Google Maps。',
    openInGoogleMaps: '在 Google 地图中打开',
    addressLabel: '地址',
    phoneLabel: '电话',
    hoursLabel: '营业时间',
    openNow: '营业中',
    closedNow: '已打烊',
    bookmark: '收藏',
    unbookmark: '取消收藏',
    priceLevelLabel: '价格',
    priceLevel: level => `${'¥'.repeat(level)}`,
    categoryLabels: {
      [PLACE_CONTENT_TYPE.attraction]: '景点',
      [PLACE_CONTENT_TYPE.accommodation]: '住宿',
      [PLACE_CONTENT_TYPE.restaurant]: '餐厅',
    },
    categoryTabA11y: label => `查看${label}`,
    subtitleLabel: label => label,
  },
};

export function defaultPlaceContentTypeId(
  value: PlaceContentTypeId | undefined,
): PlaceContentTypeId {
  return value ?? PLACE_CONTENT_TYPE.attraction;
}
