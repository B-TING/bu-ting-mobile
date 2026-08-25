import {
  dayCountBetween,
  TRAVEL_STYLE_OPTIONS,
  TRAVEL_TITLE_MAX_LENGTH,
} from '../../constants/plan/planWizard';
import type { CompanionGroupType, PlanWizardAnswers, WizardPickedPlace } from '../../types/planWizard';
import type {
  AiSchedulePaceDto,
  AiTravelPlanGenerateRequest,
  AiWizardPickedPlaceRequest,
  CompanionTypeDto,
  ManualTravelInput,
  PlanPlaceResponse,
  PlanResponse,
  PlaceProviderDto,
  TravelCreateRequest,
  TravelPlansResponse,
  TravelResponse,
  TravelStyleDto,
  MyTravelResponse,
  TravelMemberResponse,
  TravelTeamRoleDto,
} from '../../types/travelApi';
import type { SchedulePace } from '../../types/user';
import type {
  DailyItinerary,
  PlanConstraints,
  PlanMember,
  RouteItem,
  TravelPlan,
} from '../../types/travelPlan';
import { getCurrentApiServerOrigin } from '../../utils/api/apiServerOrigin';
import { createId } from '../../utils/common/id';

export const AI_PLACE_PROVIDER: PlaceProviderDto = 'GOOGLE';
export const AI_ATTRACTION_PLACE_TYPE = 'TOURIST_SPOT';

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

const DEFAULT_TRAVEL_TITLE = '부산 여행';
export const DEFAULT_TRAVEL_DESTINATION = '부산';
export { TRAVEL_TITLE_MAX_LENGTH };

function normalizeTitlePart(value: string | null | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function clipTravelTitle(value: string): string {
  if (value.length <= TRAVEL_TITLE_MAX_LENGTH) {
    return value;
  }
  return value.slice(0, TRAVEL_TITLE_MAX_LENGTH);
}

export function buildTravelTitle(placeName?: string | null): string {
  const name = normalizeTitlePart(placeName);
  if (!name) {
    return DEFAULT_TRAVEL_TITLE;
  }
  const withSuffix = `${name} 여행`;
  if (withSuffix.length <= TRAVEL_TITLE_MAX_LENGTH) {
    return withSuffix;
  }
  if (name.length <= TRAVEL_TITLE_MAX_LENGTH) {
    return name;
  }
  return name.slice(0, TRAVEL_TITLE_MAX_LENGTH);
}

export function toTravelCreateRequest(input: ManualTravelInput): TravelCreateRequest {
  const primaryCompanion = input.companionTypes[0];
  const primaryStyle = input.travelStyleIds[0];
  const customTitle = clipTravelTitle(normalizeTitlePart(input.title));
  return {
    title: customTitle || null,
    startDate: input.startDate,
    endDate: input.endDate,
    destination: DEFAULT_TRAVEL_DESTINATION,
    companionCount: input.companionCount,
    hasHeavyBaggage: input.hasHeavyBaggage,
    hasPets: input.hasPets,
    companionType: primaryCompanion ? COMPANION_MAP[primaryCompanion] : null,
    travelStyle: primaryStyle ? STYLE_MAP[primaryStyle] ?? 'TOURISM' : null,
    preferredFoods: input.foodIds.length ? input.foodIds.join(',') : null,
    accommodationArea: input.accommodationAreaIds[0] ?? null,
  };
}

export function wizardPlaceToAiSelectedPlace(
  place: WizardPickedPlace,
): AiWizardPickedPlaceRequest {
  const address = place.address?.trim() || place.placeName;
  return {
    provider: AI_PLACE_PROVIDER,
    providerPlaceId: place.placeId,
    placeName: place.placeName,
    address,
    latitude: place.location.lat,
    longitude: place.location.lng,
    type: AI_ATTRACTION_PLACE_TYPE,
  };
}

export function toAiSchedulePace(pace?: SchedulePace | null): AiSchedulePaceDto {
  if (pace === 'relaxed') {
    return 'RELAXED';
  }
  if (pace === 'packed') {
    return 'TIGHT';
  }
  return 'BALANCED';
}

export function toAiTravelPlanGenerateRequest(
  answers: PlanWizardAnswers,
  options?: { schedulePace?: SchedulePace | null },
): AiTravelPlanGenerateRequest {
  const selectedPlaces = answers.selectedAttractions.map(wizardPlaceToAiSelectedPlace);
  const request: AiTravelPlanGenerateRequest = {
    selectedPlaces,
    schedulePace: toAiSchedulePace(options?.schedulePace),
  };

  if (answers.foodIds.length) {
    request.foodIds = answers.foodIds;
  }

  const purposes = answers.travelStyleIds
    .map(id => TRAVEL_STYLE_OPTIONS.find(opt => opt.id === id)?.label.ko)
    .filter((label): label is string => Boolean(label));
  if (purposes.length) {
    request.purposes = purposes;
  }

  if (answers.accommodationMode === 'booked') {
    const name =
      answers.bookedAccommodation?.placeName?.trim() ||
      answers.accommodationName?.trim() ||
      null;
    request.bookedAccommodation = name;
  } else if (answers.accommodationAreaIds.length) {
    request.accommodationAreaIds = answers.accommodationAreaIds;
  }

  return request;
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

function mapApiTravelStatus(status: TravelResponse['status']): TravelPlan['travelStatus'] {
  return status;
}

export function travelTeamMemberRole(role: TravelTeamRoleDto): PlanMember['role'] {
  return role;
}

/** @deprecated use travelTeamMemberRole */
export const myTravelMemberRole = travelTeamMemberRole;

export function travelMembersToPlanMembers(members: TravelMemberResponse[]): PlanMember[] {
  return members.map(member => ({
    userId: member.userId,
    nickname: member.nickname,
    role: travelTeamMemberRole(member.role),
  }));
}

export function myTravelResponseToPlanShell(
  travel: MyTravelResponse,
  member: PlanMember,
  existing?: TravelPlan | null,
): TravelPlan {
  const visitDates = enumerateVisitDates(travel.startDate, travel.endDate);
  return {
    planId: existing?.planId ?? travel.travelId,
    apiTravelId: travel.travelId,
    title: travel.title?.trim() || existing?.title || '부산 여행',
    startDate: travel.startDate,
    endDate: travel.endDate,
    status: mapTravelStatus(travel.status),
    travelStatus: mapApiTravelStatus(travel.status),
    constraints: existing?.constraints ?? {},
    members: existing?.members?.length ? existing.members : [member],
    itinerary: visitDates.map((date, index) => {
      const existingDay = existing?.itinerary.find(d => d.dayNumber === index + 1);
      return {
        dailyId: existingDay?.dailyId ?? createId('day'),
        apiPlanId: existingDay?.apiPlanId,
        dayNumber: index + 1,
        date,
        routes: existingDay?.routes ?? [],
      };
    }),
    createdAt: travel.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    source: 'api',
    apiServerOrigin: getCurrentApiServerOrigin(),
    aiPromptContext: existing?.aiPromptContext,
  };
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
    planId: travel.travelId,
    title: travel.title?.trim() || '부산 여행',
    startDate: travel.startDate,
    endDate: travel.endDate,
    status: mapTravelStatus(travel.status),
    travelStatus: mapApiTravelStatus(travel.status),
    constraints: {
      ...constraints,
      companionCount: travel.companionCount ?? constraints.companionCount,
    },
    members,
    itinerary: emptyDailyItineraryFromPlans(dayPlans, travel.startDate, travel.endDate),
    createdAt: travel.createdAt ?? new Date().toISOString(),
    source: 'api',
    apiTravelId: travel.travelId,
    apiServerOrigin: getCurrentApiServerOrigin(),
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
          scheduledTime: p.scheduledTime,
          visited: p.visited,
        }),
      ),
  }));

  if (!itinerary.length) {
    return travelResponseToPlan(
      {
        travelId: response.travelId,
        title: response.title,
        startDate,
        endDate,
        destination: DEFAULT_TRAVEL_DESTINATION,
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
    apiServerOrigin: getCurrentApiServerOrigin(),
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
    travelStatus: local.travelStatus ?? synced.travelStatus,
    createdAt: local.createdAt,
    aiPromptContext: local.aiPromptContext,
    constraints: local.constraints,
    apiServerOrigin: getCurrentApiServerOrigin(),
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
