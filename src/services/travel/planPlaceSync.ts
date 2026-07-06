import type { RebootPlaceCandidate } from '../../utils/places/rebootPlaces';
import type { PlanPlaceCreateRequest } from '../../types/travelApi';
import type { RouteItem } from '../../types/travelPlan';
import { createPlanPlace, deletePlanPlace } from './travelService';
import { planPlaceToRouteItem } from './travelMapper';

/** API plan place sequence는 1부터 (첫 장소 = 1) */
export function nextPlanPlaceSequence(routes: RouteItem[]): number {
  if (routes.length === 0) {
    return 1;
  }
  const maxSeq = Math.max(...routes.map(route => route.sequence));
  return maxSeq + 1;
}

export function rebootCandidateToPlanPlaceRequest(
  candidate: RebootPlaceCandidate,
  sequence: number,
): PlanPlaceCreateRequest {
  return {
    sequence: Math.max(1, sequence),
    placeName: candidate.placeName,
    address: candidate.address?.trim() || candidate.placeName,
    latitude: candidate.location.lat,
    longitude: candidate.location.lng,
    provider: 'GOOGLE',
    providerPlaceId: candidate.placeId,
    visited: false,
  };
}

export async function addPlanPlaceFromCandidate(
  accessToken: string,
  apiPlanId: string,
  candidate: RebootPlaceCandidate,
  sequence: number,
): Promise<RouteItem> {
  const body = rebootCandidateToPlanPlaceRequest(candidate, sequence);
  const created = await createPlanPlace(accessToken, apiPlanId, body);
  return planPlaceToRouteItem(created);
}

export async function removePlanPlaceFromApi(
  accessToken: string,
  route: RouteItem,
): Promise<void> {
  const planPlaceId = route.apiPlanPlaceId ?? route.itemId;
  await deletePlanPlace(accessToken, planPlaceId);
}
