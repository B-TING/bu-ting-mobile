import type { PlaceReview, Travelogue } from '../types/travelReview';
import type { RouteItem } from '../types/travelPlan';

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

export function isTraveloguePublic(travelogue: Travelogue): boolean {
  return travelogue.isPublic !== false;
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
