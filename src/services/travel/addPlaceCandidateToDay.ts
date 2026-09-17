import { usePlaceDetailCacheStore } from '../../stores/usePlaceDetailCacheStore';
import { usePlanStore } from '../../stores/usePlanStore';
import type { TravelLegMode, TravelPlan } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';
import { isPlanForCurrentApiServer } from '../../utils/api/apiServerOrigin';
import { isServerBackedPlan } from '../../utils/plan/serverBackedPlan';
import {
  candidateToRouteItem,
  type RebootPlaceCandidate,
} from '../../utils/places/rebootPlaces';
import { contentTypeIdToRouteType } from '../../utils/places/routePlaceDetail';
import {
  addPlanPlaceFromCandidate,
  getDayRoutesFromPlan,
} from './planPlaceSync';
import { trySyncTravelPlanFromApi } from './trySyncTravelPlanFromApi';

function seedCandidateRouteImage(candidate: RebootPlaceCandidate): void {
  usePlaceDetailCacheStore.getState().seedImageUrl(candidate.placeId, candidate.imageUrl, {
    name: candidate.placeName,
    address: candidate.address,
  });
}

async function syncAndUpsert(
  accessToken: string,
  plan: TravelPlan,
): Promise<TravelPlan> {
  const { plan: synced, scheduleLocked } = await trySyncTravelPlanFromApi(
    accessToken,
    plan,
  );
  if (!scheduleLocked) {
    const latest = usePlanStore.getState().plans.find(p => p.planId === plan.planId);
    usePlanStore.getState().upsertPlan({
      ...synced,
      members: latest?.members ?? synced.members,
    });
  }
  return usePlanStore.getState().plans.find(p => p.planId === plan.planId) ?? synced;
}

/**
 * 검색·상세에서 고른 장소를 플랜의 특정 일자에 추가한다.
 * API 연동 플랜이면 서버 day planId로 POST 후 sync, 아니면 로컬에만 추가.
 */
export async function addPlaceCandidateToDay(options: {
  plan: TravelPlan;
  dayNumber: number;
  candidate: RebootPlaceCandidate;
  language: AppLanguage;
  accessToken?: string | null;
  legMode?: TravelLegMode;
}): Promise<TravelPlan> {
  const { plan, dayNumber, candidate, language, accessToken, legMode = 'walk' } = options;
  const day = plan.itinerary.find(d => d.dayNumber === dayNumber);
  if (!day) {
    throw new Error('선택한 날짜를 찾을 수 없습니다.');
  }

  seedCandidateRouteImage(candidate);
  const routeType = contentTypeIdToRouteType(candidate.contentTypeId);
  const isApiPlan =
    isServerBackedPlan(plan) &&
    isPlanForCurrentApiServer(plan) &&
    Boolean(day.apiPlanId);

  if (isApiPlan && accessToken && day.apiPlanId) {
    await syncAndUpsert(accessToken, plan);
    await addPlanPlaceFromCandidate(accessToken, day.apiPlanId, candidate);
    const afterAdd = await syncAndUpsert(accessToken, plan);
    const dayRoutes = getDayRoutesFromPlan(afterAdd, dayNumber);
    const added = dayRoutes.find(r => r.placeId === candidate.placeId);
    if (added) {
      const nextLeg = legMode !== 'walk' ? legMode : added.legMode;
      if (routeType !== added.type || nextLeg !== added.legMode) {
        usePlanStore.getState().replaceRouteInPlan(plan.planId, added.itemId, {
          ...added,
          type: routeType,
          legMode: nextLeg,
        });
      }
    }
    return (
      usePlanStore.getState().plans.find(p => p.planId === plan.planId) ?? afterAdd
    );
  }

  const sequence = day.routes.length + 1;
  const newRoute = candidateToRouteItem(
    candidate,
    sequence,
    language,
    routeType,
    legMode,
  );
  usePlanStore.getState().addRouteToPlan(plan.planId, dayNumber, newRoute);
  return (
    usePlanStore.getState().plans.find(p => p.planId === plan.planId) ?? plan
  );
}
