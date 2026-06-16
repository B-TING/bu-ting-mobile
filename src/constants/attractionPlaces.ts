import { BUSAN_ATTRACTIONS } from './planWizard';
import { PLACE_CATALOG, type PlaceCatalogEntry } from './placeCatalog';
import { getJagalchiMarketPlaceDetail } from './placeSamples';
import type { AttractionPlaceDetail, PlaceReviewVO } from '../types/googlePlaces';

function mockReviews(placeName: string): PlaceReviewVO[] {
  return [
    {
      authorName: '김여행',
      rating: 5,
      text: `${placeName} 분위기가 좋아요. 부산 여행 때 꼭 들러보세요.`,
      relativePublishTimeDescription: '1주 전',
      publishTime: '2026-06-08T00:00:00.000Z',
    },
    {
      authorName: 'Alex Park',
      rating: 4,
      text: `Great spot in Busan. ${placeName} is worth the visit.`,
      relativePublishTimeDescription: '2주 전',
      publishTime: '2026-05-29T00:00:00.000Z',
    },
  ];
}

function kindFromCatalog(
  placeId: string,
  catalog: PlaceCatalogEntry,
): AttractionPlaceDetail['kind'] {
  if (placeId === 'tour_jagalchi') {
    return 'market';
  }
  if (catalog.category.includes('식') || catalog.typeLabel.ko.includes('식')) {
    return 'restaurant';
  }
  return 'attraction';
}

function mockAttractionDetail(params: {
  internalPlaceId: string;
  name: string;
  location: { lat: number; lng: number };
  catalog: PlaceCatalogEntry;
  googlePlaceId?: string;
  editorialSummary?: string;
  websiteUri?: string;
  phones?: { international?: string };
}): AttractionPlaceDetail {
  const kind = kindFromCatalog(params.internalPlaceId, params.catalog);
  const hoursLines = params.catalog.hours.includes(' - ')
    ? [`매일: ${params.catalog.hours}`]
    : [params.catalog.hours];

  return {
    googlePlaceId: params.googlePlaceId ?? `ChIJmock_${params.internalPlaceId}`,
    internalPlaceId: params.internalPlaceId,
    name: params.name,
    kind,
    googleTypes: kind === 'market' ? ['market', 'tourist_attraction'] : ['tourist_attraction'],
    primaryType: kind === 'market' ? 'market' : 'tourist_attraction',
    primaryTypeLabel: params.catalog.typeLabel.ko,
    formattedAddress: params.catalog.address,
    location: params.location,
    rating: params.catalog.rating,
    userRatingCount: params.catalog.reviewCount,
    phones: params.phones,
    websiteUri: params.websiteUri,
    openingHours: {
      openNow: true,
      weekdayDescriptions: hoursLines,
    },
    editorialSummary: params.editorialSummary ?? params.catalog.description,
    reviews: mockReviews(params.name),
    photos: [],
  };
}

function buildAttractionMockDetails(): Record<string, AttractionPlaceDetail> {
  const details: Record<string, AttractionPlaceDetail> = {};

  const jagalchi = getJagalchiMarketPlaceDetail();
  if (jagalchi) {
    details.tour_jagalchi = {
      ...jagalchi,
      internalPlaceId: 'tour_jagalchi',
      kind: 'market',
    };
  }

  for (const spot of BUSAN_ATTRACTIONS) {
    if (!spot.meta) {
      continue;
    }
    const internalPlaceId = spot.meta.placeId ?? `tour_${spot.id}`;
    if (details[internalPlaceId]) {
      continue;
    }
    const catalog =
      PLACE_CATALOG[internalPlaceId] ??
      ({
        typeLabel: { ko: '관광지', en: 'Attraction', ja: '観光', zh: '景点' },
        description:
          `${spot.label.ko} — 부산 여행 명소입니다. 현장 상황에 따라 운영 시간이 달라질 수 있습니다.`,
        hours: '09:00 - 18:00',
        category: '관광지',
        address: '부산광역시',
        rating: 4.3,
        reviewCount: 800,
        dwellMinutes: 60,
        thumbnailHue: '#94A3B8',
      } satisfies PlaceCatalogEntry);
    details[internalPlaceId] = mockAttractionDetail({
      internalPlaceId,
      name: spot.label.ko,
      location: { lat: spot.meta.lat, lng: spot.meta.lng },
      catalog,
    });
  }

  return details;
}

export const ATTRACTION_MOCK_DETAILS: Record<string, AttractionPlaceDetail> =
  buildAttractionMockDetails();

/** route.placeId 또는 wizard attraction id → mock lookup key */
export function resolveAttractionPlaceId(placeId: string): string {
  const byMeta = BUSAN_ATTRACTIONS.find(
    s => s.meta?.placeId === placeId || s.id === placeId || `tour_${s.id}` === placeId,
  );
  return byMeta?.meta?.placeId ?? placeId;
}

export function getAttractionMockDetail(placeId: string): AttractionPlaceDetail | null {
  const key = resolveAttractionPlaceId(placeId);
  return ATTRACTION_MOCK_DETAILS[key] ?? null;
}

export function listKnownAttractionPlaceIds(): string[] {
  return Object.keys(ATTRACTION_MOCK_DETAILS);
}
