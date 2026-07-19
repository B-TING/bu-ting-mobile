import type {
  PlaceReview,
  ReviewMedia,
  TravelRecord,
  TravelRecordDay,
  TravelRecordPlace,
  TravelRecordSocial,
} from '../../types/travelReview';
import type { LucideIconName } from '../../constants/icons';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import { createId } from '../common/id';
import { sortedRoutes } from '../plan/planItinerary';

export function averageRating(reviews: PlaceReview[]): number {
  if (reviews.length === 0) {
    return 0;
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** 서버 overallRating 우선, 없으면 장소 후기 평균 */
export function travelRecordOverallRating(travelRecord: TravelRecord): number {
  if (
    typeof travelRecord.overallRating === 'number' &&
    !Number.isNaN(travelRecord.overallRating) &&
    travelRecord.overallRating > 0
  ) {
    return travelRecord.overallRating;
  }
  return averageRating(travelRecord.placeReviews);
}

export function reviewMatchesPlaceKey(
  review: PlaceReview,
  placeKey: string,
): boolean {
  return (
    review.planPlaceId === placeKey || review.travelRecordPlaceId === placeKey
  );
}

export function getReviewForPlace(
  reviews: PlaceReview[],
  placeKey: string,
): PlaceReview | undefined {
  return reviews.find(r => reviewMatchesPlaceKey(r, placeKey));
}

/** 초안 장소 ↔ 로컬/서버 후기 (planPlaceId 또는 travelRecordPlaceId) 매칭 */
export function getReviewForTravelRecordPlace(
  reviews: PlaceReview[],
  place: {
    travelRecordPlaceId: string;
    planPlaceId?: string | null;
  },
): PlaceReview | undefined {
  return reviews.find(
    r =>
      reviewMatchesPlaceKey(r, place.travelRecordPlaceId) ||
      (place.planPlaceId != null && reviewMatchesPlaceKey(r, place.planPlaceId)),
  );
}

/** @deprecated Use getReviewForPlace */
export const getReviewForRoute = getReviewForPlace;

export function collectPlanRoutes(routes: RouteItem[]): RouteItem[] {
  return routes.filter(r => r.type !== 'LOCKER');
}

export function reviewProgress(
  routes: RouteItem[],
  reviews: PlaceReview[],
): { total: number; completed: number; allDone: boolean } {
  const eligible = collectPlanRoutes(routes);
  const completed = eligible.filter(r =>
    reviews.some(rv =>
      reviewMatchesPlaceKey(rv, r.apiPlanPlaceId ?? r.itemId),
    ),
  ).length;
  return {
    total: eligible.length,
    completed,
    allDone: eligible.length > 0 && completed === eligible.length,
  };
}

export function buildDefaultTravelRecordTitle(
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
      return `${destinationLabel} Travel Record`;
  }
}

/** @deprecated Use buildDefaultTravelRecordTitle */
export const buildDefaultTravelogueTitle = buildDefaultTravelRecordTitle;

export function buildDefaultContent(
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
    return reviews[0]?.content ?? '';
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

/** @deprecated Use buildDefaultContent */
export const buildDefaultOverallReview = buildDefaultContent;

export function buildTravelRecordDays(plan: TravelPlan): TravelRecordDay[] {
  return plan.itinerary.map(day => ({
    travelRecordDayId: day.dailyId ?? createId('trd-'),
    originalPlanId: day.apiPlanId ?? null,
    dayNumber: day.dayNumber,
    visitDate: day.date,
    places: sortedRoutes(day.routes)
      .filter(r => r.type !== 'LOCKER')
      .map(
        (r): TravelRecordPlace => ({
          travelRecordPlaceId: r.apiPlanPlaceId ?? r.itemId,
          planPlaceId: r.apiPlanPlaceId ?? r.itemId,
          sequence: r.sequence,
          placeName: r.placeName,
          address: r.placeInfo?.address ?? null,
          latitude: r.location.lat,
          longitude: r.location.lng,
          provider: r.apiProvider ?? 'GOOGLE',
          providerPlaceId: r.placeId,
          durationMinutes: null,
          memo: r.memo ?? null,
          scheduledTime: null,
          visited: r.isVisited,
          routeToNext: null,
          routeItemType: r.type,
        }),
      ),
  }));
}

/** @deprecated Use buildTravelRecordDays */
export const buildItinerarySnapshot = buildTravelRecordDays;

export function flattenTravelRecordPlaces(days: TravelRecordDay[]): TravelRecordPlace[] {
  const places: TravelRecordPlace[] = [];
  days.forEach(day => {
    day.places.forEach(place => {
      places.push(place);
    });
  });
  return places;
}

/** @deprecated Use flattenTravelRecordPlaces */
export function flattenItineraryRoutes(days: TravelRecordDay[]): TravelRecordPlace[] {
  return flattenTravelRecordPlaces(days);
}

export function resolveTravelRecordDays(
  travelRecord: TravelRecord,
  plan: TravelPlan | null,
): TravelRecordDay[] {
  if (travelRecord.days?.length) {
    return travelRecord.days;
  }
  if (plan) {
    return buildTravelRecordDays(plan);
  }
  return [];
}

/** @deprecated Use resolveTravelRecordDays */
export const resolveTravelogueItinerary = resolveTravelRecordDays;

export function snapshotToRouteItems(places: TravelRecordPlace[]): RouteItem[] {
  return places.map((place, index) => ({
    itemId: place.travelRecordPlaceId,
    apiPlanPlaceId: place.planPlaceId ?? undefined,
    apiProvider: place.provider,
    sequence: place.sequence ?? index,
    placeId: place.providerPlaceId,
    placeName: place.placeName,
    type: place.routeItemType ?? 'ATTRACTION',
    location: {
      lat: place.latitude ?? 0,
      lng: place.longitude ?? 0,
    },
    isVisited: place.visited ?? false,
    memo: place.memo ?? undefined,
    placeInfo: {
      description: '',
      hours: '',
      category: 'attraction',
      address: place.address ?? '',
    },
  }));
}

export function isTravelRecordPublic(travelRecord: TravelRecord): boolean {
  return travelRecord.status === 'PUBLISHED';
}

/** @deprecated Use isTravelRecordPublic */
export const isTraveloguePublic = isTravelRecordPublic;

export function travelRecordDestinationLabel(travelRecord: TravelRecord): string {
  const firstPlace = travelRecord.days
    ?.flatMap(day => day.places)
    .find(place => place.placeName);
  return firstPlace?.placeName ?? firstPlace?.address ?? '';
}

export function collectTravelRecordImages(travelRecord: TravelRecord): ReviewMedia[] {
  const images: ReviewMedia[] = [];
  travelRecord.placeReviews.forEach(review => {
    (review.media ?? []).forEach(media => {
      if (media.type === 'image') {
        images.push(media);
      }
    });
  });
  return images;
}

/** @deprecated Use collectTravelRecordImages */
export const collectTravelogueImages = collectTravelRecordImages;

export function getLikeCount(social: TravelRecordSocial | undefined): number {
  if (typeof social?.likeCount === 'number') {
    return social.likeCount;
  }
  return social?.likedUserIds.length ?? 0;
}

/** @deprecated Use getLikeCount */
export const getHelpfulCount = getLikeCount;

export function isLikedByUser(
  social: TravelRecordSocial | undefined,
  userId: string,
): boolean {
  if (typeof social?.likedByMe === 'boolean') {
    return social.likedByMe;
  }
  return social?.likedUserIds.includes(userId) ?? false;
}

/** @deprecated Use isLikedByUser */
export const isHelpfulByUser = isLikedByUser;

export function authorInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
}

export function travelRecordThumbnailIcon(travelRecord: TravelRecord): LucideIconName {
  const top = travelRecord.placeReviews.find(r => r.rating >= 4);
  if (top?.tags.includes('맛집') || top?.tags.includes('food')) {
    return 'utensils';
  }
  if (top?.tags.includes('뷰맛집') || top?.tags.includes('view')) {
    return 'sunset';
  }
  return 'map';
}

/** @deprecated Use travelRecordThumbnailIcon */
export const travelogueThumbnailIcon = travelRecordThumbnailIcon;

/** @deprecated Use travelRecordThumbnailIcon */
export function travelogueThumbnailEmoji(travelRecord: TravelRecord): string {
  const icon = travelRecordThumbnailIcon(travelRecord);
  if (icon === 'utensils') {
    return '🍽️';
  }
  if (icon === 'sunset') {
    return '🌅';
  }
  return '🗺️';
}

export function buildPlanFromTravelRecord(
  travelRecord: TravelRecord,
  linkedPlan: TravelPlan | null,
  member: { userId: string; displayName: string },
  idFactory: (prefix: string) => string,
): TravelPlan | null {
  const days = resolveTravelRecordDays(travelRecord, linkedPlan);
  if (days.length === 0) {
    return null;
  }

  const startDate =
    travelRecord.travelStartDate ??
    days[0]?.visitDate ??
    new Date().toISOString().slice(0, 10);
  const endDate =
    travelRecord.travelEndDate ?? days[days.length - 1]?.visitDate ?? startDate;

  return {
    planId: idFactory('plan-'),
    title: travelRecord.title ?? '',
    startDate,
    endDate,
    status: 'DRAFT',
    constraints: linkedPlan?.constraints ?? {},
    members: [{ userId: member.userId, nickname: member.displayName, role: 'LEADER' }],
    itinerary: days.map(day => ({
      dailyId: idFactory('day-'),
      dayNumber: day.dayNumber,
      date: day.visitDate,
      routes: day.places.map((place, index) => ({
        itemId: idFactory('route-'),
        sequence: index,
        placeId: place.providerPlaceId,
        placeName: place.placeName,
        type: place.routeItemType ?? 'ATTRACTION',
        location: {
          lat: place.latitude ?? 0,
          lng: place.longitude ?? 0,
        },
        isVisited: false,
      })),
    })),
    createdAt: new Date().toISOString(),
    aiPromptContext: linkedPlan?.aiPromptContext,
  };
}

/** @deprecated Use buildPlanFromTravelRecord */
export const buildPlanFromTravelogue = buildPlanFromTravelRecord;
