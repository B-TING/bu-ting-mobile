import type { RebootPlaceCandidate } from '../../utils/places/rebootPlaces';
import type { PlanPlaceCreateRequest, PlanPlaceResponse, PlanPlaceUpdatePlaceRequest, PlaceProviderDto } from '../../types/travelApi';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import { sortedRoutes } from '../../utils/plan/planItinerary';
import {
  createPlanPlace,
  deletePlanPlace,
  fetchPlanPlaces,
  updatePlanPlace,
  updatePlanPlacePlace,
  updatePlanPlaceSequence,
} from './travelService';
import { planPlaceToRouteItem } from './travelMapper';

export function getDayRoutesFromPlan(
  plan: TravelPlan | null | undefined,
  dayNumber: number,
): RouteItem[] {
  const day = plan?.itinerary.find(d => d.dayNumber === dayNumber);
  return day ? sortedRoutes(day.routes) : [];
}

export function routesInItemOrder(
  routes: RouteItem[],
  orderedItemIds: string[],
): RouteItem[] {
  const byId = Object.fromEntries(routes.map(r => [r.itemId, r]));
  return orderedItemIds
    .map(id => byId[id])
    .filter((r): r is RouteItem => r != null);
}

export function findDayRoute(
  plan: TravelPlan | null | undefined,
  dayNumber: number,
  routeRef: Pick<RouteItem, 'itemId' | 'apiPlanPlaceId'>,
): RouteItem | null {
  const routes = getDayRoutesFromPlan(plan, dayNumber);
  return (
    routes.find(
      route =>
        route.itemId === routeRef.itemId ||
        (routeRef.apiPlanPlaceId != null &&
          route.apiPlanPlaceId === routeRef.apiPlanPlaceId),
    ) ?? null
  );
}

export function resolveApiPlanPlaceId(route: RouteItem): string {
  return route.apiPlanPlaceId ?? route.itemId;
}

function resolveServerPlanPlaceId(
  route: RouteItem,
  serverPlaces: PlanPlaceResponse[],
): string {
  const directId = resolveApiPlanPlaceId(route);
  if (serverPlaces.some(place => place.planPlaceId === directId)) {
    return directId;
  }

  const byProvider = serverPlaces.find(
    place => place.providerPlaceId === route.placeId,
  );
  if (byProvider) {
    return byProvider.planPlaceId;
  }

  throw new Error(`서버에서 장소를 찾을 수 없습니다: ${route.placeName}`);
}

function buildValidatedPlanPlaceIds(
  orderedRoutes: RouteItem[],
  serverPlaces: PlanPlaceResponse[],
): string[] {
  const planPlaceIds = orderedRoutes.map(route =>
    resolveServerPlanPlaceId(route, serverPlaces),
  );
  const uniqueIds = new Set(planPlaceIds);

  if (uniqueIds.size !== planPlaceIds.length) {
    throw new Error('순서 변경 요청에 중복된 장소가 있습니다.');
  }

  if (planPlaceIds.length !== serverPlaces.length) {
    throw new Error(
      `서버 일정(${serverPlaces.length}곳)과 요청 순서(${planPlaceIds.length}곳)가 일치하지 않습니다. 잠시 후 다시 시도해 주세요.`,
    );
  }

  const serverIdSet = new Set(serverPlaces.map(place => place.planPlaceId));
  for (const id of planPlaceIds) {
    if (!serverIdSet.has(id)) {
      throw new Error('일정이 변경되어 순서를 바꿀 수 없습니다.');
    }
  }

  return planPlaceIds;
}

function inferPlaceProvider(placeId: string): PlaceProviderDto {
  if (/^ChIJ/i.test(placeId)) {
    return 'GOOGLE';
  }
  return 'GOOGLE';
}

/** POST·PATCH /place 공통 — 후보 장소를 API 요청 본문으로 변환 */
export function rebootCandidateToPlanPlaceRequest(
  candidate: RebootPlaceCandidate,
): PlanPlaceCreateRequest {
  return {
    placeName: candidate.placeName,
    address: candidate.address?.trim() || candidate.placeName,
    latitude: candidate.location.lat,
    longitude: candidate.location.lng,
    provider: inferPlaceProvider(candidate.placeId),
    providerPlaceId: candidate.placeId,
    visited: false,
  };
}

export function rebootCandidateToPlanPlaceUpdatePlaceRequest(
  candidate: RebootPlaceCandidate,
): PlanPlaceUpdatePlaceRequest {
  const { placeName, address, latitude, longitude, provider, providerPlaceId } =
    rebootCandidateToPlanPlaceRequest(candidate);
  return { placeName, address, latitude, longitude, provider, providerPlaceId };
}

export async function addPlanPlaceFromCandidate(
  accessToken: string,
  apiPlanId: string,
  candidate: RebootPlaceCandidate,
): Promise<RouteItem> {
  const body = rebootCandidateToPlanPlaceRequest(candidate);
  const created = await createPlanPlace(accessToken, apiPlanId, body);
  return planPlaceToRouteItem(created);
}

export async function removePlanPlaceFromApi(
  accessToken: string,
  route: RouteItem,
): Promise<void> {
  await deletePlanPlace(accessToken, resolveApiPlanPlaceId(route));
}

export async function updatePlanPlaceOrderOnApi(
  accessToken: string,
  apiPlanId: string,
  orderedRoutes: RouteItem[],
): Promise<void> {
  if (orderedRoutes.length === 0) {
    return;
  }

  const serverPlaces = await fetchPlanPlaces(accessToken, apiPlanId);
  const planPlaceIds = buildValidatedPlanPlaceIds(orderedRoutes, serverPlaces);
  await updatePlanPlaceSequence(accessToken, apiPlanId, { planPlaceIds });
}

export async function updatePlanPlaceMemoOnApi(
  accessToken: string,
  route: RouteItem,
  memo: string | null,
): Promise<void> {
  const normalized = memo?.trim() || null;
  await updatePlanPlace(accessToken, resolveApiPlanPlaceId(route), { memo: normalized });
}

/**
 * 인근 장소로 대체(reboot) — PATCH /api/v1/plans/places/{planPlaceId}/place
 */
export async function replacePlanPlaceFromCandidate(
  accessToken: string,
  route: RouteItem,
  candidate: RebootPlaceCandidate,
): Promise<RouteItem> {
  const body = rebootCandidateToPlanPlaceUpdatePlaceRequest(candidate);
  const updated = await updatePlanPlacePlace(
    accessToken,
    resolveApiPlanPlaceId(route),
    body,
  );
  const replaced = planPlaceToRouteItem(updated);
  return {
    ...replaced,
    itemId: route.itemId,
    legMode: route.legMode,
    memo: route.memo,
    placeInfo: route.placeInfo,
    type: route.type,
  };
}
