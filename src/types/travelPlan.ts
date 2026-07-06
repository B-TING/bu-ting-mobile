export type PlanStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED';

export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export type RouteItemType =
  | 'ATTRACTION'
  | 'RESTAURANT'
  | 'ACCOMMODATION'
  | 'LOCKER';

export type TravelLegMode = 'walk' | 'drive' | 'transit';

export type BudgetCategory =
  | 'food'
  | 'shopping'
  | 'accommodation'
  | 'transport'
  | 'entertainment'
  | 'other';

export type PlanConstraints = {
  hasHeavyBaggage?: boolean;
  hasPets?: boolean;
  travelStyleIds?: string[];
  otherConstraintIds?: string[];
  preferFlatTerrain?: boolean;
  pace?: 'relaxed' | 'moderate' | 'active';
  companionCount?: number;
  companionTypes?: string[];
  preferredFoods?: string[];
  accommodationArea?: string;
  accommodationName?: string;
  /** 직접 일정 만들기 — 첫 장소 추천 기준 좌표 */
  initialAnchor?: { lat: number; lng: number };
};

export type PlanMember = {
  userId: string;
  nickname: string;
  role: MemberRole;
};

export type PlaceInfo = {
  description: string;
  hours: string;
  category: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  dwellMinutes?: number;
  imageUrl?: string;
};

export type RouteItem = {
  itemId: string;
  /** 백엔드 plan_place UUID */
  apiPlanPlaceId?: string;
  sequence: number;
  placeId: string;
  placeName: string;
  type: RouteItemType;
  location: { lat: number; lng: number };
  isVisited: boolean;
  /** 이전 장소에서 이동할 때 사용하는 교통수단 */
  legMode?: TravelLegMode;
  placeInfo?: PlaceInfo;
};

export type BudgetEntry = {
  entryId: string;
  planId: string;
  label: string;
  category: BudgetCategory;
  amount: number;
  currency: 'KRW';
  date: string;
  paidByUserId: string;
  /** 비용을 나눌 참여자 userId 목록 (미지정 시 지불자 1인) */
  splitWithUserIds: string[];
  memo?: string;
  routeItemId?: string;
};

export type TravelLeg = {
  mode: 'walk' | 'drive' | 'transit';
  durationMinutes: number;
  distanceKm: number;
};

export type DailyItinerary = {
  dailyId: string;
  dayNumber: number;
  date: string;
  /** 백엔드 plan UUID (API 연동 플랜) */
  apiPlanId?: string;
  routes: RouteItem[];
};

export type TravelPlan = {
  planId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  constraints: PlanConstraints;
  members: PlanMember[];
  itinerary: DailyItinerary[];
  createdAt: string;
  aiPromptContext?: string;
  /** local = 목 AI·로컬 only, api = 백엔드 Travel API 연동 */
  source?: 'local' | 'api';
  /** 백엔드 travel UUID (`planId`와 동일할 수 있음) */
  apiTravelId?: string;
};

/** API 응답 형태와 동일한 직렬화 뷰 */
export type TravelPlanResponse = {
  planId: string;
  title: string;
  dates: { start: string; end: string };
  constraints: PlanConstraints;
  members: PlanMember[];
  itinerary: {
    dayNumber: number;
    date: string;
    routes: {
      itemId: string;
      sequence: number;
      placeId: string;
      placeName: string;
      type: RouteItemType;
      location: { lat: number; lng: number };
      isVisited: boolean;
    }[];
  }[];
};

export function toTravelPlanResponse(plan: TravelPlan): TravelPlanResponse {
  return {
    planId: plan.planId,
    title: plan.title,
    dates: { start: plan.startDate, end: plan.endDate },
    constraints: plan.constraints,
    members: plan.members,
    itinerary: plan.itinerary.map(day => ({
      dayNumber: day.dayNumber,
      date: day.date,
      routes: day.routes.map(r => ({
        itemId: r.itemId,
        sequence: r.sequence,
        placeId: r.placeId,
        placeName: r.placeName,
        type: r.type,
        location: r.location,
        isVisited: r.isVisited,
      })),
    })),
  };
}
