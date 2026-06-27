import type {
  PlaceReview,
  ReviewMedia,
  Travelogue,
  TravelogueDaySnapshot,
  TravelogueRouteSnapshot,
  TravelogueSocial,
} from '../../types/travelReview';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import { sortedRoutes } from '../plan/planItinerary';

export function averageRating(reviews: PlaceReview[]): number {
  if (reviews.length === 0) {
    return 0;
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function getReviewForRoute(
  reviews: PlaceReview[],
  routeItemId: string,
): PlaceReview | undefined {
  return reviews.find(r => r.routeItemId === routeItemId);
}

export function collectPlanRoutes(routes: RouteItem[]): RouteItem[] {
  return routes.filter(r => r.type !== 'LOCKER');
}

export function reviewProgress(
  routes: RouteItem[],
  reviews: PlaceReview[],
): { total: number; completed: number; allDone: boolean } {
  const eligible = collectPlanRoutes(routes);
  const completed = eligible.filter(r =>
    reviews.some(rv => rv.routeItemId === r.itemId),
  ).length;
  return {
    total: eligible.length,
    completed,
    allDone: eligible.length > 0 && completed === eligible.length,
  };
}

export function buildDefaultTravelogueTitle(
  destinationLabel: string,
  lang: 'ko' | 'en' | 'ja' | 'zh',
): string {
  switch (lang) {
    case 'ko':
      return `${destinationLabel} 여행기`;
    case 'ja':
      return `${destinationLabel}旅行記`;
    case 'zh':
      return `${destinationLabel}游记`;
    default:
      return `${destinationLabel} Travelogue`;
  }
}

export function buildDefaultOverallReview(
  reviews: PlaceReview[],
  lang: 'ko' | 'en' | 'ja' | 'zh',
): string {
  if (reviews.length === 0) {
    return '';
  }
  const highlights = reviews
    .filter(r => r.rating >= 4)
    .map(r => r.placeName)
    .slice(0, 3);
  if (highlights.length === 0) {
    return reviews[0]?.comment ?? '';
  }
  switch (lang) {
    case 'ko':
      return `${highlights.join(', ')} 등 ${reviews.length}곳을 다녀왔어요. 각 장소 후기를 참고해 주세요!`;
    case 'ja':
      return `${highlights.join('、')}など${reviews.length}箇所を訪れました。各スポットのレビューをご覧ください。`;
    case 'zh':
      return `去了${highlights.join('、')}等${reviews.length}个地方。欢迎查看各地点评！`;
    default:
      return `Visited ${reviews.length} spots including ${highlights.join(', ')}. See place reviews below!`;
  }
}

export function buildItinerarySnapshot(plan: TravelPlan): TravelogueDaySnapshot[] {
  return plan.itinerary.map(day => ({
    dayNumber: day.dayNumber,
    date: day.date,
    routes: sortedRoutes(day.routes)
      .filter(r => r.type !== 'LOCKER')
      .map(
        (r): TravelogueRouteSnapshot => ({
          itemId: r.itemId,
          sequence: r.sequence,
          placeId: r.placeId,
          placeName: r.placeName,
          type: r.type,
          location: r.location,
          isVisited: r.isVisited,
        }),
      ),
  }));
}

export function flattenItineraryRoutes(
  itinerary: TravelogueDaySnapshot[],
): TravelogueRouteSnapshot[] {
  const routes: TravelogueRouteSnapshot[] = [];
  itinerary.forEach(day => {
    day.routes.forEach(route => {
      routes.push(route);
    });
  });
  return routes;
}

export function resolveTravelogueItinerary(
  travelogue: Travelogue,
  plan: TravelPlan | null,
): TravelogueDaySnapshot[] {
  if (travelogue.itinerary?.length) {
    return travelogue.itinerary;
  }
  if (plan) {
    return buildItinerarySnapshot(plan);
  }
  return [];
}

export function snapshotToRouteItems(
  routes: TravelogueRouteSnapshot[],
): RouteItem[] {
  return routes.map((r, index) => ({
    ...r,
    sequence: index,
    placeInfo: undefined,
  }));
}

export function isTraveloguePublic(travelogue: Travelogue): boolean {
  return travelogue.isPublic !== false;
}

export function collectTravelogueImages(travelogue: Travelogue): ReviewMedia[] {
  const images: ReviewMedia[] = [];
  travelogue.placeReviews.forEach(review => {
    review.media.forEach(media => {
      if (media.type === 'image') {
        images.push(media);
      }
    });
  });
  return images;
}

export function getHelpfulCount(social: TravelogueSocial | undefined): number {
  return social?.helpfulUserIds.length ?? 0;
}

export function isHelpfulByUser(
  social: TravelogueSocial | undefined,
  userId: string,
): boolean {
  return social?.helpfulUserIds.includes(userId) ?? false;
}

export function authorInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
}

export function travelogueThumbnailEmoji(travelogue: Travelogue): string {
  const top = travelogue.placeReviews.find(r => r.rating >= 4);
  if (top?.tags.includes('맛집') || top?.tags.includes('food')) {
    return '🍽️';
  }
  if (top?.tags.includes('뷰맛집') || top?.tags.includes('view')) {
    return '🌅';
  }
  return '🗺️';
}

export function buildPlanFromTravelogue(
  travelogue: Travelogue,
  linkedPlan: TravelPlan | null,
  member: { userId: string; displayName: string },
  idFactory: (prefix: string) => string,
): TravelPlan | null {
  const snapshot = resolveTravelogueItinerary(travelogue, linkedPlan);
  if (snapshot.length === 0) {
    return null;
  }

  const startDate =
    travelogue.startDate ?? snapshot[0]?.date ?? new Date().toISOString().slice(0, 10);
  const endDate =
    travelogue.endDate ?? snapshot[snapshot.length - 1]?.date ?? startDate;

  return {
    planId: idFactory('plan-'),
    title: travelogue.title,
    startDate,
    endDate,
    status: 'DRAFT',
    constraints: linkedPlan?.constraints ?? {},
    members: [{ userId: member.userId, nickname: member.displayName, role: 'OWNER' }],
    itinerary: snapshot.map(day => ({
      dailyId: idFactory('day-'),
      dayNumber: day.dayNumber,
      date: day.date,
      routes: day.routes.map((route, index) => ({
        itemId: idFactory('route-'),
        sequence: index,
        placeId: route.placeId,
        placeName: route.placeName,
        type: route.type,
        location: route.location,
        isVisited: false,
      })),
    })),
    createdAt: new Date().toISOString(),
    aiPromptContext: linkedPlan?.aiPromptContext,
  };
}
