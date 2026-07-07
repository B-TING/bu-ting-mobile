import type { RebootPlaceCandidate } from '../../utils/places/rebootPlaces';
import type { PlanPlaceCreateRequest, PlanPlaceResponse, PlaceProviderDto } from '../../types/travelApi';
import type { RouteItem, TravelPlan } from '../../types/travelPlan';
import { sortedRoutes } from '../../utils/plan/planItinerary';
import {
  createPlanPlace,
  deletePlanPlace,
  fetchPlanPlaces,
  updatePlanPlace,
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

/** POST 시 sequence는 보내지 않음 — 서버가 맨 뒤에 배정, 순서 변경은 PATCH로만 */
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
 *
 * 백엔드에 plan place의 장소 자체를 바꾸는 API가 없다.
 * `PATCH /api/v1/plans/places/{planPlaceId}`는 메모·예정 시간·소요 시간만 수정한다.
 *
 * 장소 변경 API가 추가되기 전까지 아래 방식으로 우회한다:
 * 1. 새 장소 POST (sequence 미지정 → 서버가 맨 뒤에 추가)
 * 2. PATCH .../places/sequence — 새 장소와 교체 대상의 순서를 맞바꿈 (교체 대상은 맨 뒤로)
 * 3. 교체 대상 DELETE
 *
 * TODO: 장소 변경(교체) 전용 API 연동 후 이 함수를 교체할 것
 */
export async function replacePlanPlaceFromCandidate(
  accessToken: string,
  apiPlanId: string,
  route: RouteItem,
  candidate: RebootPlaceCandidate,
  allDayRoutes: RouteItem[],
): Promise<RouteItem> {
  const sorted = sortedRoutes(allDayRoutes);
  const replaceIndex = sorted.findIndex(
    r => resolveApiPlanPlaceId(r) === resolveApiPlanPlaceId(route),
  );
  if (replaceIndex < 0) {
    throw new Error('교체할 일정을 찾을 수 없습니다.');
  }

  const oldRoute = sorted[replaceIndex];
  const prefix = sorted.slice(0, replaceIndex);
  const suffix = sorted.slice(replaceIndex + 1);

  const created = await addPlanPlaceFromCandidate(accessToken, apiPlanId, candidate);

  const orderedRoutes = [...prefix, created, ...suffix, oldRoute];
  await updatePlanPlaceOrderOnApi(accessToken, apiPlanId, orderedRoutes);
  await deletePlanPlace(accessToken, resolveApiPlanPlaceId(oldRoute));

  return created;
}
