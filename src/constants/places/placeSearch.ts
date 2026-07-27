import type { AppLanguage } from '../../types/user';
import type { BusanPlace } from '../../types/placeSearch';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { PlaceContentTypeId } from '../../types/placesApi';

/** 위치 기반 장소 검색 반경 (meter) */
export const PLACE_SEARCH_RADIUS_M = 3000;

/** 지도 중심이 검색 중심과 이 거리(m) 이상 벗어나면 '이곳에서 검색하기' 표시 */
export const PLACE_SEARCH_CENTER_THRESHOLD_M = 150;

/** @deprecated Use useCopy('placeSearch') from src/i18n */
export const PLACE_SEARCH_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    loading: string;
    detailLoading: string;
    notFound: string;
    empty: string;
    emptySub: string;
    summary: (count: number, radiusKm: number) => string;
    searchHere: string;
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
    tourismDetailsTitle: string;
    tourismDetailsExpand: string;
    tourismDetailsCollapse: string;
    detailSectionInfo: string;
    detailSectionFacility: string;
    detailSectionReviews: string;
    detailSectionEmpty: string;
    categoryLabels: Record<PlaceContentTypeId, string>;
    categoryTabA11y: (label: string) => string;
    subtitleLabel: (label: string) => string;
    festivalSummary: (count: number) => string;
    festivalEmptySub: string;
    festivalMapSubtitle: string;
    festivalListMeta: (address: string) => string;
    festivalDetailMeta: string;
    festivalTagFestival: string;
    festivalTagExhibition: string;
    detailSectionEvent: string;
  }
> = {
  ko: {
    screenTitle: '부산 장소 찾기',
    loading: '장소·상세 정보를 불러오는 중…',
    detailLoading: '상세 정보를 불러오는 중…',
    notFound: '장소 정보를 찾을 수 없어요.',
    empty: '표시할 장소가 없어요',
    emptySub: '지도를 움직여 다른 위치를 검색해 보세요',
    summary: (count, radiusKm) => `주변 ${radiusKm}km · ${count}곳`,
    searchHere: '이곳에서 검색하기',
    dataHint: '한국관광공사·Google Places 연동',
    mapTitle: '카카오맵',
    mapSubtitle: '지도를 움직이면 다른 위치를 검색할 수 있어요',
    selectHint: '지도에서 장소를 선택하면 상세 정보를 볼 수 있어요',
    close: '닫기',
    ratingSummary: (rating, count) => {
      const r = Number(rating) || 0;
      const c = Number(count) || 0;
      return c > 0 ? `★ ${r.toFixed(1)} · 리뷰 ${c.toLocaleString()}개` : '리뷰 없음';
    },
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
    tourismDetailsTitle: '시설 상세',
    tourismDetailsExpand: '펼치기',
    tourismDetailsCollapse: '접기',
    detailSectionInfo: '기본 정보',
    detailSectionFacility: '시설',
    detailSectionReviews: '리뷰',
    detailSectionEmpty: '표시할 정보가 없어요',
    categoryLabels: {
      [PLACE_CONTENT_TYPE.attraction]: '관광지',
      [PLACE_CONTENT_TYPE.accommodation]: '숙박',
      [PLACE_CONTENT_TYPE.restaurant]: '음식점',
      [PLACE_CONTENT_TYPE.festival]: '축제',
    },
    categoryTabA11y: label => `${label} 보기`,
    subtitleLabel: label => label,
    festivalSummary: count => `이번 달 행사 · ${count}건`,
    festivalEmptySub: '다른 달 축제는 캘린더에서 확인해 보세요',
    festivalMapSubtitle: '행사 장소를 지도에서 확인할 수 있어요',
    festivalListMeta: address => (address ? address : '행사 정보'),
    festivalDetailMeta: '한국관광공사 행사 정보',
    festivalTagFestival: '축제',
    festivalTagExhibition: '전시',
    detailSectionEvent: '행사 정보',
  },
  en: {
    screenTitle: 'Find places in Busan',
    loading: 'Loading places and details…',
    detailLoading: 'Loading details…',
    notFound: 'Place not found.',
    empty: 'No places to show',
    emptySub: 'Move the map and search another area',
    summary: (count, radiusKm) => `Within ${radiusKm} km · ${count} places`,
    searchHere: 'Search this area',
    dataHint: 'Korea Tourism Organization · Google Places',
    mapTitle: 'Kakao Map',
    mapSubtitle: 'Pan the map to search a different area',
    selectHint: 'Select a place on the map to see details',
    close: 'Close',
    ratingSummary: (rating, count) => {
      const r = Number(rating) || 0;
      const c = Number(count) || 0;
      return c > 0 ? `★ ${r.toFixed(1)} · ${c.toLocaleString()} reviews` : 'No reviews';
    },
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
    tourismDetailsTitle: 'Facility details',
    tourismDetailsExpand: 'Show more',
    tourismDetailsCollapse: 'Show less',
    detailSectionInfo: 'Info',
    detailSectionFacility: 'Facilities',
    detailSectionReviews: 'Reviews',
    detailSectionEmpty: 'No details to show',
    categoryLabels: {
      [PLACE_CONTENT_TYPE.attraction]: 'Attractions',
      [PLACE_CONTENT_TYPE.accommodation]: 'Stays',
      [PLACE_CONTENT_TYPE.restaurant]: 'Restaurants',
      [PLACE_CONTENT_TYPE.festival]: 'Festivals',
    },
    categoryTabA11y: label => `Show ${label}`,
    subtitleLabel: label => label,
    festivalSummary: count => `Events this month · ${count}`,
    festivalEmptySub: 'Browse the festival calendar for other months',
    festivalMapSubtitle: 'Festival venues on the map',
    festivalListMeta: address => (address ? address : 'Event info'),
    festivalDetailMeta: 'Korea Tourism Organization event info',
    festivalTagFestival: 'Festival',
    festivalTagExhibition: 'Exhibition',
    detailSectionEvent: 'Event info',
  },
  ja: {
    screenTitle: '釜山のスポット',
    loading: 'スポット・詳細を読み込み中…',
    detailLoading: '詳細を読み込み中…',
    notFound: '情報が見つかりません。',
    empty: '表示する場所がありません',
    emptySub: '地図を動かして別のエリアを検索してください',
    summary: (count, radiusKm) => `周辺${radiusKm}km · ${count}件`,
    searchHere: 'このエリアで検索',
    dataHint: '韓国観光公社・Google Places',
    mapTitle: 'カカオマップ',
    mapSubtitle: '地図を動かすと別のエリアを検索できます',
    selectHint: '地図で場所を選ぶと詳細が表示されます',
    close: '閉じる',
    ratingSummary: (rating, count) => {
      const r = Number(rating) || 0;
      const c = Number(count) || 0;
      return c > 0 ? `★ ${r.toFixed(1)} · レビュー ${c.toLocaleString()}件` : 'レビューなし';
    },
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
    tourismDetailsTitle: '施設詳細',
    tourismDetailsExpand: 'もっと見る',
    tourismDetailsCollapse: '閉じる',
    detailSectionInfo: '基本情報',
    detailSectionFacility: '施設',
    detailSectionReviews: 'レビュー',
    detailSectionEmpty: '表示する情報がありません',
    categoryLabels: {
      [PLACE_CONTENT_TYPE.attraction]: '観光地',
      [PLACE_CONTENT_TYPE.accommodation]: '宿泊',
      [PLACE_CONTENT_TYPE.restaurant]: '飲食店',
      [PLACE_CONTENT_TYPE.festival]: '祭り',
    },
    categoryTabA11y: label => `${label}を表示`,
    subtitleLabel: label => label,
    festivalSummary: count => `今月のイベント · ${count}件`,
    festivalEmptySub: '他の月は祭りカレンダーで確認してください',
    festivalMapSubtitle: '地図で会場を確認できます',
    festivalListMeta: address => (address ? address : 'イベント情報'),
    festivalDetailMeta: '韓国観光公社イベント情報',
    festivalTagFestival: '祭り',
    festivalTagExhibition: '展示',
    detailSectionEvent: 'イベント情報',
  },
  zh: {
    screenTitle: '釜山地点搜索',
    loading: '正在加载地点与详情…',
    detailLoading: '正在加载详情…',
    notFound: '未找到地点信息。',
    empty: '暂无地点',
    emptySub: '移动地图后搜索其他区域',
    summary: (count, radiusKm) => `周边 ${radiusKm} km · ${count} 个`,
    searchHere: '在此区域搜索',
    dataHint: '韩国观光公社 · Google Places',
    mapTitle: 'Kakao地图',
    mapSubtitle: '移动地图可搜索其他区域',
    selectHint: '在地图上选择地点查看详情',
    close: '关闭',
    ratingSummary: (rating, count) => {
      const r = Number(rating) || 0;
      const c = Number(count) || 0;
      return c > 0 ? `★ ${r.toFixed(1)} · ${c.toLocaleString()} 条评价` : '暂无评价';
    },
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
    tourismDetailsTitle: '设施详情',
    tourismDetailsExpand: '展开',
    tourismDetailsCollapse: '收起',
    detailSectionInfo: '基本信息',
    detailSectionFacility: '设施',
    detailSectionReviews: '评价',
    detailSectionEmpty: '暂无详情',
    categoryLabels: {
      [PLACE_CONTENT_TYPE.attraction]: '景点',
      [PLACE_CONTENT_TYPE.accommodation]: '住宿',
      [PLACE_CONTENT_TYPE.restaurant]: '餐厅',
      [PLACE_CONTENT_TYPE.festival]: '节庆',
    },
    categoryTabA11y: label => `查看${label}`,
    subtitleLabel: label => label,
    festivalSummary: count => `本月活动 · ${count} 个`,
    festivalEmptySub: '其他月份请查看节庆日历',
    festivalMapSubtitle: '在地图上查看活动地点',
    festivalListMeta: address => (address ? address : '活动信息'),
    festivalDetailMeta: '韩国观光公社活动信息',
    festivalTagFestival: '节庆',
    festivalTagExhibition: '展览',
    detailSectionEvent: '活动信息',
  },
};

export function defaultPlaceContentTypeId(
  value: PlaceContentTypeId | undefined,
): PlaceContentTypeId {
  return value ?? PLACE_CONTENT_TYPE.attraction;
}

export function isFestivalPlaceSearch(contentTypeId: PlaceContentTypeId): boolean {
  return contentTypeId === PLACE_CONTENT_TYPE.festival;
}

type PlaceSearchCopy = (typeof PLACE_SEARCH_COPY)['ko'];

/** 지도·리스트 공통 — `관광지 · ★ 4.5` 형식 */
export function buildPlaceListMetaLine(
  place: BusanPlace,
  copy: PlaceSearchCopy,
  secondary?: string,
): string {
  const category = copy.categoryLabels[place.contentTypeId];
  const tail =
    secondary ??
    (isFestivalPlaceSearch(place.contentTypeId)
      ? copy.festivalListMeta(place.address)
      : copy.ratingSummary(place.rating, place.userRatingsTotal));
  return `${category} · ${tail}`;
}
