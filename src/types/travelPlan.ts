export type PlanStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED';

export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export type RouteItemType =
  | 'ATTRACTION'
  | 'RESTAURANT'
  | 'ACCOMMODATION'
  | 'LOCKER';

export type PlanConstraints = {
  hasHeavyBaggage?: boolean;
  preferFlatTerrain?: boolean;
  pace?: 'relaxed' | 'moderate' | 'active';
  companionCount?: number;
  companionTypes?: string[];
  preferredFoods?: string[];
  accommodationArea?: string;
  accommodationName?: string;
};

export type PlanMember = {
  userId: string;
  nickname: string;
  role: MemberRole;
};

export type RouteItem = {
  itemId: string;
  sequence: number;
  placeId: string;
  placeName: string;
  type: RouteItemType;
  location: { lat: number; lng: number };
  isVisited: boolean;
};

export type DailyItinerary = {
  dailyId: string;
  dayNumber: number;
  date: string;
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
