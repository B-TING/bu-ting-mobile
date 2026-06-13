import type { PlaceInfo, RouteItemType } from '../types/travelPlan';

export type PlaceCatalogEntry = PlaceInfo & {
  typeLabel: Record<'ko' | 'en' | 'ja' | 'zh', string>;
  thumbnailHue: string;
};

const defaults = (
  category: PlaceCatalogEntry['typeLabel'],
  desc: Partial<Record<'ko' | 'en' | 'ja' | 'zh', string>>,
): Omit<PlaceCatalogEntry, 'typeLabel'> & { typeLabel: PlaceCatalogEntry['typeLabel'] } => ({
  typeLabel: category,
  description:
    desc.ko ??
    '부산 여행 명소입니다. 현장 상황에 따라 운영 시간이 달라질 수 있습니다.',
  hours: '09:00 - 18:00',
  category: category.ko,
  address: '부산광역시',
  rating: 4.3,
  reviewCount: 1200,
  dwellMinutes: 60,
  thumbnailHue: '#94A3B8',
});

export const PLACE_CATALOG: Record<string, PlaceCatalogEntry> = {
  tour_gamcheon: {
    ...defaults(
      { ko: '관광지', en: 'Attraction', ja: '観光', zh: '景点' },
      {
        ko: '알록달록한 벽화 마을로 부산을 대표하는 문화 거리입니다. 언덕이 있어 편한 신발을 권장합니다.',
      },
    ),
    address: '부산광역시 사하구 감천문화마을',
    rating: 4.5,
    reviewCount: 18420,
    dwellMinutes: 90,
    thumbnailHue: '#F472B6',
  },
  tour_haeundae: {
    ...defaults(
      { ko: '해변', en: 'Beach', ja: 'ビーチ', zh: '海滩' },
      { ko: '대표 해수욕장으로 산책·야경·해산물 맛집이 가깝습니다.' },
    ),
    address: '부산광역시 해운대구 해운대해변로',
    rating: 4.4,
    reviewCount: 22100,
    dwellMinutes: 120,
    thumbnailHue: '#38BDF8',
  },
  tour_gwangan: {
    ...defaults(
      { ko: '해변·야경', en: 'Beach & night view', ja: '夜景', zh: '夜景' },
      { ko: '광안대교 야경과 함께 즐기기 좋은 해변 산책 코스입니다.' },
    ),
    address: '부산광역시 수영구 광안해변로',
    rating: 4.6,
    reviewCount: 15300,
    thumbnailHue: '#818CF8',
  },
  tour_jagalchi: {
    ...defaults(
      { ko: '시장·해산물', en: 'Seafood market', ja: '市場', zh: '市场' },
      { ko: '신선한 해산물과 회를 맛볼 수 있는 대표 수산 시장입니다.' },
    ),
    hours: '05:00 - 22:00',
    address: '부산광역시 중구 자갈치해안로',
    rating: 4.2,
    reviewCount: 9800,
    dwellMinutes: 75,
    thumbnailHue: '#FB923C',
  },
  tour_busan_station_locker: {
    typeLabel: { ko: '짐 보관', en: 'Locker', ja: 'ロッカー', zh: '寄存' },
    description: '부산역 인근 물품 보관 시설. 짐이 많을 때 첫날 일정 전에 이용하기 좋습니다.',
    hours: '24시간 (시설별 상이)',
    category: 'LOCKER',
    address: '부산광역시 동구 중앙대로 206',
    dwellMinutes: 20,
    thumbnailHue: '#A78BFA',
  },
};

export function enrichPlaceInfo(
  placeId: string,
  placeName: string,
  type: RouteItemType,
  lang: 'ko' | 'en' | 'ja' | 'zh',
): PlaceInfo {
  const entry = PLACE_CATALOG[placeId];
  if (entry) {
    return {
      description: entry.description,
      hours: entry.hours,
      category: entry.typeLabel[lang],
      address: entry.address,
      rating: entry.rating,
      reviewCount: entry.reviewCount,
      dwellMinutes: entry.dwellMinutes,
    };
  }
  const typeFallback: Record<RouteItemType, string> = {
    ATTRACTION: lang === 'ko' ? '관광지' : 'Attraction',
    RESTAURANT: lang === 'ko' ? '식당' : 'Restaurant',
    ACCOMMODATION: lang === 'ko' ? '숙소' : 'Stay',
    LOCKER: lang === 'ko' ? '보관소' : 'Locker',
  };
  return {
    description:
      lang === 'ko'
        ? `${placeName} — 상세 정보는 추후 TourAPI·네이버 지도 연동 시 표시됩니다.`
        : `${placeName} — details coming with map API integration.`,
    hours: '—',
    category: typeFallback[type],
    address: '부산광역시',
    dwellMinutes: 45,
  };
}

export function catalogThumbnail(placeId: string): string {
  return PLACE_CATALOG[placeId]?.thumbnailHue ?? '#CBD5E1';
}
