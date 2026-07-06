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
    sequence: place.sequence,
    placeId: place.providerPlaceId,
    placeName: place.placeName,
    type: 'ATTRACTION',
    location: {
      lat: place.latitude ?? 0,
      lng: place.longitude ?? 0,
    },
    isVisited: Boolean(place.visited),
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
  const itinerary: DailyItinerary[] = response.days.map(day => ({
    dailyId: day.planId,
    apiPlanId: day.planId,
    dayNumber: day.dayNumber,
    date: day.visitDate,
    routes: day.places
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
