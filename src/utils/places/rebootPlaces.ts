import { BUSAN_ATTRACTIONS } from '../../constants/plan/planWizard';
import { enrichPlaceInfo } from '../../constants/places/placeCatalog';
import type { RouteItem, RouteItemType } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';
import { createId } from '../common/id';
import { haversineKm } from '../geo/geo';

export type RebootPlaceCandidate = {
  attractionId: string;
  placeId: string;
  placeName: string;
  location: { lat: number; lng: number };
  distanceKm: number;
};

const REBOOT_NEARBY_LIMIT = 5;
const REBOOT_SEARCH_LIMIT = 12;

function attractionLabel(
  spot: (typeof BUSAN_ATTRACTIONS)[number],
  language: AppLanguage,
): string {
  return spot.label[language] ?? spot.label.ko;
}

export function findNearbyRebootCandidates(
  anchor: { lat: number; lng: number },
  options: {
    excludePlaceIds: string[];
    language: AppLanguage;
    limit?: number;
  },
): RebootPlaceCandidate[] {
  const limit = options.limit ?? REBOOT_NEARBY_LIMIT;
  const exclude = new Set(options.excludePlaceIds);

  return BUSAN_ATTRACTIONS.filter(s => s.meta && !exclude.has(s.meta.placeId ?? `tour_${s.id}`))
    .map(spot => {
      const placeId = spot.meta!.placeId ?? `tour_${spot.id}`;
      const distanceKm = haversineKm(
        anchor.lat,
        anchor.lng,
        spot.meta!.lat,
        spot.meta!.lng,
      );
      return {
        attractionId: spot.id,
        placeId,
        placeName: attractionLabel(spot, options.language),
        location: { lat: spot.meta!.lat, lng: spot.meta!.lng },
        distanceKm,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function listBrowseRebootPlaces(options: {
  excludePlaceIds: string[];
  language: AppLanguage;
  limit?: number;
}): RebootPlaceCandidate[] {
  const limit = options.limit ?? 8;
  const exclude = new Set(options.excludePlaceIds);

  return BUSAN_ATTRACTIONS.filter(spot => {
    if (!spot.meta) {
      return false;
    }
    const placeId = spot.meta.placeId ?? `tour_${spot.id}`;
    return !exclude.has(placeId);
  })
    .slice(0, limit)
    .map(spot => ({
      attractionId: spot.id,
      placeId: spot.meta!.placeId ?? `tour_${spot.id}`,
      placeName: attractionLabel(spot, options.language),
      location: { lat: spot.meta!.lat, lng: spot.meta!.lng },
      distanceKm: 0,
    }));
}

export function searchRebootPlaces(
  query: string,
  options: {
    excludePlaceIds: string[];
    language: AppLanguage;
    limit?: number;
  },
): RebootPlaceCandidate[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const limit = options.limit ?? REBOOT_SEARCH_LIMIT;
  const exclude = new Set(options.excludePlaceIds);

  return BUSAN_ATTRACTIONS.filter(spot => {
    if (!spot.meta) {
      return false;
    }
    const placeId = spot.meta.placeId ?? `tour_${spot.id}`;
    if (exclude.has(placeId)) {
      return false;
    }
    const labels = Object.values(spot.label).join(' ').toLowerCase();
    return labels.includes(q) || spot.id.toLowerCase().includes(q);
  })
    .slice(0, limit)
    .map(spot => ({
      attractionId: spot.id,
      placeId: spot.meta!.placeId ?? `tour_${spot.id}`,
      placeName: attractionLabel(spot, options.language),
      location: { lat: spot.meta!.lat, lng: spot.meta!.lng },
      distanceKm: 0,
    }));
}

export function candidateToRouteItem(
  candidate: RebootPlaceCandidate,
  sequence: number,
  language: AppLanguage,
  type: RouteItemType = 'ATTRACTION',
  legMode?: RouteItem['legMode'],
): RouteItem {
  return {
    itemId: createId('r'),
    sequence,
    placeId: candidate.placeId,
    placeName: candidate.placeName,
    type,
    location: candidate.location,
    isVisited: false,
    legMode,
    placeInfo: enrichPlaceInfo(
      candidate.placeId,
      candidate.placeName,
      type,
      language,
    ),
  };
}

export function formatDistanceKm(km: number, language: AppLanguage): string {
  if (km < 0.1) {
    return language === 'ko' ? '근처' : language === 'ja' ? '近く' : language === 'zh' ? '?�近' : 'Nearby';
  }
  const rounded = Math.round(km * 10) / 10;
  if (language === 'ko') {
    return `${rounded}km`;
  }
  return `${rounded} km`;
}
