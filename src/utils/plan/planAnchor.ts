import {
  ACCOMMODATION_AREAS,
  ACCOMMODATION_SEARCH,
  BUSAN_ATTRACTIONS,
} from '../../constants/plan/planWizard';
import type { PlanWizardAnswers } from '../../types/planWizard';

/** 부산 해운대 기본 좌표 */
const DEFAULT_ANCHOR = { lat: 35.1587, lng: 129.1604 };

const AREA_ANCHORS: Record<string, { lat: number; lng: number }> = {
  haeundae: { lat: 35.1587, lng: 129.1604 },
  seomyeon: { lat: 35.157, lng: 129.059 },
  nampo: { lat: 35.099, lng: 129.034 },
  gwangan: { lat: 35.1532, lng: 129.1186 },
  yeongdo: { lat: 35.09, lng: 129.065 },
};

/**
 * 직접 일정 만들기 — 첫 장소 추천 기준 좌표.
 * 숙소 예약 > 숙소 지역 > 위저드 관광지 선택 > 기본 해운대
 */
export function resolveInitialPlanAnchor(answers: PlanWizardAnswers): { lat: number; lng: number } {
  if (answers.accommodationMode === 'booked' && answers.accommodationPlaceId) {
    const stay = ACCOMMODATION_SEARCH.find(s => s.id === answers.accommodationPlaceId);
    if (stay?.meta) {
      return { lat: stay.meta.lat, lng: stay.meta.lng };
    }
  }

  const areaId = answers.accommodationAreaIds[0];
  if (areaId && AREA_ANCHORS[areaId]) {
    return AREA_ANCHORS[areaId];
  }

  const attractionId = answers.attractionIds[0];
  if (attractionId) {
    const spot = BUSAN_ATTRACTIONS.find(a => a.id === attractionId);
    if (spot?.meta) {
      return { lat: spot.meta.lat, lng: spot.meta.lng };
    }
  }

  if (answers.accommodationAreaIds.length) {
    const area = ACCOMMODATION_AREAS.find(a => a.id === answers.accommodationAreaIds[0]);
    if (area && AREA_ANCHORS[area.id]) {
      return AREA_ANCHORS[area.id];
    }
  }

  return DEFAULT_ANCHOR;
}
