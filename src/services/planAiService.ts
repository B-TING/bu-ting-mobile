import { enrichPlaceInfo } from '../constants/placeCatalog';
import {
  ACCOMMODATION_SEARCH,
  BUSAN_ATTRACTIONS,
  dayCountBetween,
} from '../constants/planWizard';
import type { PlanWizardAnswers } from '../types/planWizard';
import type {
  DailyItinerary,
  PlanConstraints,
  RouteItem,
  TravelPlan,
} from '../types/travelPlan';
import type { OnboardingProfile } from '../types/user';
import { createId } from '../utils/id';
import { buildPlanRequestPrompt } from './planPromptBuilder';

const LOCKER_SPOT: RouteItem = {
  itemId: createId('r'),
  sequence: 0,
  placeId: 'tour_busan_station_locker',
  placeName: '부산역 물품보관함',
  type: 'LOCKER',
  location: { lat: 35.1152, lng: 129.0422 },
  isVisited: false,
};

function attractionToRoute(attractionId: string, sequence: number): RouteItem | null {
  const spot = BUSAN_ATTRACTIONS.find(a => a.id === attractionId);
  if (!spot?.meta) {
    return null;
  }
  const placeId = spot.meta.placeId ?? `tour_${spot.id}`;
  return {
    itemId: createId('r'),
    sequence,
    placeId,
    placeName: spot.label.ko,
    type: 'ATTRACTION',
    location: { lat: spot.meta.lat, lng: spot.meta.lng },
    isVisited: false,
    placeInfo: enrichPlaceInfo(placeId, spot.label.ko, 'ATTRACTION', 'ko'),
  };
}

function resolvePace(onboarding: OnboardingProfile | null): PlanConstraints['pace'] {
  if (onboarding?.schedulePace === 'packed') {
    return 'active';
  }
  if (onboarding?.schedulePace === 'relaxed') {
    return 'relaxed';
  }
  return 'moderate';
}

function placesPerDay(
  pace: PlanConstraints['pace'],
  attractionCount: number,
  dayCount: number,
): number {
  const base = Math.max(2, Math.ceil(attractionCount / dayCount));
  if (pace === 'relaxed') {
    return Math.max(2, base - 1);
  }
  if (pace === 'active') {
    return base + 1;
  }
  return base;
}

function buildItinerary(
  wizard: PlanWizardAnswers,
  dayCount: number,
  variant: number,
  pace: PlanConstraints['pace'],
): DailyItinerary[] {
  const attractionIds = [...wizard.attractionIds];
  if (attractionIds.length === 0) {
    attractionIds.push('gamcheon', 'haeundae', 'gwangan');
  }
  const rotated = attractionIds.slice(variant).concat(attractionIds.slice(0, variant));

  const days: DailyItinerary[] = [];
  let cursor = 0;
  const start = new Date(wizard.startDate);

  for (let d = 0; d < dayCount; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const routes: RouteItem[] = [];

    if (wizard.hasHeavyBaggage && d === 0) {
      routes.push({
        ...LOCKER_SPOT,
        itemId: createId('r'),
        placeInfo: enrichPlaceInfo(
          LOCKER_SPOT.placeId,
          LOCKER_SPOT.placeName,
          'LOCKER',
          'ko',
        ),
      });
    }

    const perDay = placesPerDay(pace, rotated.length, dayCount);
    for (let i = 0; i < perDay && cursor < rotated.length; i++) {
      const route = attractionToRoute(rotated[cursor], routes.length);
      if (route) {
        routes.push(route);
      }
      cursor++;
    }

    if (wizard.accommodationMode === 'booked' && wizard.accommodationPlaceId && d === dayCount - 1) {
      const stay = ACCOMMODATION_SEARCH.find(s => s.id === wizard.accommodationPlaceId);
      if (stay?.meta) {
        const placeId = stay.meta.placeId ?? stay.id;
        routes.push({
          itemId: createId('r'),
          sequence: routes.length,
          placeId,
          placeName: stay.label.ko,
          type: 'ACCOMMODATION',
          location: { lat: stay.meta.lat, lng: stay.meta.lng },
          isVisited: false,
          placeInfo: enrichPlaceInfo(placeId, stay.label.ko, 'ACCOMMODATION', 'ko'),
        });
      }
    }

    days.push({
      dailyId: createId('d'),
      dayNumber: d + 1,
      date: date.toISOString().slice(0, 10),
      routes,
    });
  }

  return days;
}

function buildConstraints(
  wizard: PlanWizardAnswers,
  onboarding: OnboardingProfile | null,
): PlanConstraints {
  const otherIds = wizard.otherConstraintIds.filter(
    id => id !== 'heavy_luggage' && id !== 'light_luggage' && id !== 'pets',
  );
  return {
    hasHeavyBaggage: wizard.hasHeavyBaggage,
    hasPets: wizard.hasPets,
    travelStyleIds: wizard.travelStyleIds,
    otherConstraintIds: otherIds,
    preferFlatTerrain:
      wizard.hasHeavyBaggage ||
      wizard.otherConstraintIds.includes('wheelchair') ||
      wizard.otherConstraintIds.includes('stroller'),
    pace: resolvePace(onboarding),
    companionCount: wizard.companionCount,
    companionTypes: wizard.companionTypes,
    preferredFoods: wizard.foodIds,
    accommodationArea:
      wizard.accommodationAreaIds[0] ??
      (wizard.accommodationMode === 'booked' ? 'booked' : undefined),
    accommodationName: wizard.accommodationName ?? undefined,
  };
}

function buildPlan(
  wizard: PlanWizardAnswers,
  onboarding: OnboardingProfile | null,
  variant: number,
  status: TravelPlan['status'],
): TravelPlan {
  const dayCount = dayCountBetween(wizard.startDate, wizard.endDate);
  const titles = [
    'B-Side of Busan',
    '부산 로컬 코스',
    'Bag-friendly Busan trip',
  ];
  const userId = onboarding ? 'local-user' : 'guest';
  const displayName =
    onboarding?.language === 'ko' ? '여행자' : 'Traveler';
  const members: TravelPlan['members'] = [
    { userId, nickname: displayName, role: 'OWNER' },
  ];
  const extra = Math.min(4, Math.max(0, wizard.companionCount - 1));
  for (let i = 0; i < extra; i++) {
    members.push({
      userId: `member-${i + 1}`,
      nickname: onboarding?.language === 'ko' ? `일행 ${i + 1}` : `Guest ${i + 1}`,
      role: i === 0 ? 'EDITOR' : 'VIEWER',
    });
  }

  const pace = resolvePace(onboarding);

  return {
    planId: createId('plan-'),
    title: titles[variant % titles.length],
    startDate: wizard.startDate,
    endDate: wizard.endDate,
    status,
    constraints: buildConstraints(wizard, onboarding),
    members,
    itinerary: buildItinerary(wizard, dayCount, variant, pace),
    createdAt: new Date().toISOString(),
    aiPromptContext: buildPlanRequestPrompt(wizard, onboarding),
  };
}

/** 실제 API 연동 전 목 응답 */
export async function requestAutoPlan(
  wizard: PlanWizardAnswers,
  onboarding: OnboardingProfile | null,
): Promise<TravelPlan> {
  await delay(800);
  return buildPlan(wizard, onboarding, 0, 'DRAFT');
}

export async function requestPlanCandidates(
  wizard: PlanWizardAnswers,
  onboarding: OnboardingProfile | null,
): Promise<TravelPlan[]> {
  await delay(900);
  return [0, 1, 2].map(v => buildPlan(wizard, onboarding, v, 'DRAFT'));
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
