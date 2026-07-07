import type { CompanionGroupType, PlanWizardAnswers } from '../../types/planWizard';
import type {
  CompanionTypeDto,
  ManualTravelInput,
  PlanPlaceResponse,
  PlanResponse,
  TravelCreateRequest,
  TravelPlansResponse,
  TravelResponse,
  TravelStyleDto,
} from '../../types/travelApi';
import type {
  DailyItinerary,
  PlanConstraints,
  PlanMember,
  RouteItem,
  TravelPlan,
} from '../../types/travelPlan';
import { createId } from '../../utils/common/id';
import { dayCountBetween } from '../../constants/plan/planWizard';

const COMPANION_MAP: Record<CompanionGroupType, CompanionTypeDto> = {
  solo: 'SOLO',
  family: 'FAMILY',
  couple: 'COUPLE',
  friends: 'FRIEND',
  coworkers: 'GROUP',
};

const STYLE_MAP: Record<string, TravelStyleDto> = {
  culture: 'TOURISM',
  nature: 'REST',
  food: 'FOOD',
  adventure: 'ACTIVITY',
  shopping: 'SHOPPING',
  photo: 'TOURISM',
  nightlife: 'ACTIVITY',
};

export function enumerateVisitDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function toTravelCreateRequest(input: ManualTravelInput): TravelCreateRequest {
  const primaryCompanion = input.companionTypes[0];
  const primaryStyle = input.travelStyleIds[0];
  return {
    title: input.accommodationName?.trim() || '부산 여행',
    startDate: input.startDate,
    endDate: input.endDate,
    companionCount: input.companionCount,
    hasHeavyBaggage: input.hasHeavyBaggage,
    hasPets: input.hasPets,
    companionTypes: primaryCompanion ? COMPANION_MAP[primaryCompanion] : 'SOLO',
    travelStyle: primaryStyle ? STYLE_MAP[primaryStyle] ?? 'TOURISM' : null,
    preferredFoods: input.foodIds.length ? input.foodIds.join(',') : null,
    accommodationArea: input.accommodationAreaIds[0] ?? null,
  };
}

export function toPlanCreateRequests(startDate: string, endDate: string) {
  return enumerateVisitDates(startDate, endDate).map((visitDate, index) => ({
    dayNumber: index + 1,
    visitDate,
  }));
}

function mapTravelStatus(status: TravelResponse['status']): TravelPlan['status'] {
  if (status === 'COMPLETED') {
    return 'COMPLETED';
  }
  return 'CONFIRMED';
}

export function emptyDailyItineraryFromPlans(
  plans: PlanResponse[],
  startDate: string,
  endDate: string,
): DailyItinerary[] {
  const visitDates = enumerateVisitDates(startDate, endDate);
  return visitDates.map((date, index) => {
    const plan = plans.find(p => p.dayNumber === index + 1);
    return {
      dailyId: plan?.planId ?? createId('day'),
      dayNumber: index + 1,
      date,
      apiPlanId: plan?.planId,
      routes: [],
    };
  });
}

export function travelResponseToPlan(
  travel: TravelResponse,
  dayPlans: PlanResponse[],
  members: PlanMember[],
  constraints: PlanConstraints,
): TravelPlan {
  return {
    planId: travel.id,
    title: travel.title?.trim() || '부산 여행',
    startDate: travel.startDate,
    endDate: travel.endDate,
    status: mapTravelStatus(travel.status),
    constraints: {
      ...constraints,
      companionCount: travel.companionCount ?? constraints.companionCount,
    },
    members,
    itinerary: emptyDailyItineraryFromPlans(dayPlans, travel.startDate, travel.endDate),
    createdAt: travel.createdAt ?? new Date().toISOString(),
    source: 'api',
    apiTravelId: travel.id,
  };
}

export function planPlaceToRouteItem(place: PlanPlaceResponse): RouteItem {
  return {
    itemId: place.planPlaceId,
    apiPlanPlaceId: place.planPlaceId,
    apiProvider: place.provider,
    sequence: place.sequence,
    placeId: place.providerPlaceId,
    placeName: place.placeName,
    type: 'ATTRACTION',
    location: {
      lat: place.latitude ?? 0,
      lng: place.longitude ?? 0,
    },
    isVisited: Boolean(place.visited),
    memo: place.memo ?? undefined,
    placeInfo: {
      description: '',
      hours: '',
      category: 'attraction',
      address: place.address,
      dwellMinutes: place.durationMinutes ?? undefined,
    },
  };
}

export function travelPlansResponseToPlan(
  response: TravelPlansResponse,
  members: PlanMember[],
  constraints: PlanConstraints,
  startDate: string,
  endDate: string,
): TravelPlan {
  const itinerary: DailyItinerary[] = (response.days ?? []).map(day => ({
    dailyId: day.planId,
    apiPlanId: day.planId,
    dayNumber: day.dayNumber,
    date: day.visitDate,
    routes: (day.places ?? [])
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map(p =>
        planPlaceToRouteItem({
          planPlaceId: p.planPlaceId,
          planId: day.planId,
          sequence: p.sequence,
          placeName: p.placeName,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          provider: p.provider,
          providerPlaceId: p.providerPlaceId,
          durationMinutes: p.durationMinutes,
          memo: p.memo,
          visited: p.visited,
        }),
      ),
  }));

  if (!itinerary.length) {
    return travelResponseToPlan(
      {
        id: response.travelId,
        title: response.title,
        startDate,
        endDate,
        status: 'PLANNED',
      },
      [],
      members,
      constraints,
    );
  }

  return {
    planId: response.travelId,
    apiTravelId: response.travelId,
    title: response.title?.trim() || '부산 여행',
    startDate,
    endDate,
    status: 'CONFIRMED',
    constraints,
    members,
    itinerary,
    createdAt: new Date().toISOString(),
    source: 'api',
  };
}

/** 서버 일정을 기준으로 덮되, 로컬 UI 메타(legMode·placeInfo 등)는 유지 */
export function mergeApiTravelPlanWithLocal(
  local: TravelPlan,
  response: TravelPlansResponse,
): TravelPlan {
  const synced = travelPlansResponseToPlan(
    response,
    local.members,
    local.constraints,
    local.startDate,
    local.endDate,
  );

  const localDayByNumber = Object.fromEntries(
    local.itinerary.map(day => [day.dayNumber, day]),
  );
  const localRouteByKey = new Map<string, RouteItem>();
  for (const day of local.itinerary) {
    for (const route of day.routes) {
      if (route.apiPlanPlaceId) {
        localRouteByKey.set(route.apiPlanPlaceId, route);
      }
      localRouteByKey.set(route.itemId, route);
    }
  }

  return {
    ...synced,
    planId: local.planId,
    apiTravelId: local.apiTravelId ?? synced.apiTravelId,
    title: local.title || synced.title,
    status: local.status,
    createdAt: local.createdAt,
    aiPromptContext: local.aiPromptContext,
    constraints: local.constraints,
    itinerary: synced.itinerary.map(day => {
      const localDay = localDayByNumber[day.dayNumber];
      return {
        ...day,
        dailyId: localDay?.dailyId ?? day.dailyId,
        date: localDay?.date ?? day.date,
        routes: day.routes.map(route => {
          const prev =
            localRouteByKey.get(route.apiPlanPlaceId ?? route.itemId) ??
            localRouteByKey.get(route.itemId);
          if (!prev) {
            return route;
          }
          return {
            ...route,
            legMode: prev.legMode,
            placeInfo: prev.placeInfo ?? route.placeInfo,
            type: prev.type,
          };
        }),
      };
    }),
  };
}

export function wizardAnswersToConstraints(answers: PlanWizardAnswers): PlanConstraints {
  return {
    hasHeavyBaggage: answers.hasHeavyBaggage,
    hasPets: answers.hasPets,
    travelStyleIds: answers.travelStyleIds,
    otherConstraintIds: answers.otherConstraintIds,
    companionCount: answers.companionCount,
    companionTypes: answers.companionTypes,
    preferredFoods: answers.foodIds,
    accommodationArea: answers.accommodationAreaIds[0],
    accommodationName: answers.accommodationName ?? undefined,
  };
}

export function dayCountFromAnswers(answers: PlanWizardAnswers): number {
  return dayCountBetween(answers.startDate, answers.endDate);
}
