import { useTravelRecordStore } from '../../stores/useTravelRecordStore';
import type { TravelPlan } from '../../types/travelPlan';
import type { PlaceReview } from '../../types/travelReview';
import {
  mediaFromApiUrls,
  resolveReviewMediaList,
} from '../../utils/media/resolveMediaUrl';
import { fetchPlaceReview } from './travelRecordService';

function travelIdOf(plan: TravelPlan): string {
  return plan.apiTravelId ?? plan.planId;
}

/**
 * 일정의 각 PlanPlace 후기를 불러 세션 스토어에 반영.
 * 초안 없이 travelId + planPlaceId GET.
 */
export async function loadPlanPlaceReviewsForTravel(options: {
  accessToken: string | null | undefined;
  plan: TravelPlan;
}): Promise<PlaceReview[]> {
  const { accessToken, plan } = options;
  if (!accessToken?.trim() || plan.source !== 'api') {
    return [];
  }

  const travelId = travelIdOf(plan);
  const store = useTravelRecordStore.getState();
  const routes = plan.itinerary.flatMap(day => day.routes);
  const planPlaceIds = [
    ...new Set(
      routes
        .map(r => r.apiPlanPlaceId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (planPlaceIds.length === 0) {
    return [];
  }

  const results = await Promise.all(
    planPlaceIds.map(async planPlaceId => {
      const route = routes.find(r => r.apiPlanPlaceId === planPlaceId);
      try {
        const dto = await fetchPlaceReview(accessToken, travelId, planPlaceId);
        const media = await resolveReviewMediaList(
          mediaFromApiUrls(dto.placeReviewId, dto.mediaUrls),
          accessToken,
        );
        return store.upsertPlaceReview(travelId, {
          placeReviewId: dto.placeReviewId,
          planPlaceId: dto.planPlaceId ?? planPlaceId,
          travelRecordPlaceId: dto.travelRecordPlaceId ?? null,
          rating: dto.rating,
          stayMinutes: dto.stayMinutes ?? null,
          content: dto.content,
          tags: dto.tags ?? [],
          placeName: route?.placeName ?? '',
          media,
          matchPlaceKeys: [planPlaceId],
        });
      } catch {
        return null;
      }
    }),
  );

  return results.filter((r): r is PlaceReview => r != null);
}
