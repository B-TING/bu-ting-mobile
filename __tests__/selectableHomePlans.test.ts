import type { TravelPlan } from '../src/types/travelPlan';
import { getCurrentApiServerOrigin } from '../src/utils/api/apiServerOrigin';
import {
  getSelectableHomePlans,
  mergeFeaturedIntoPickerPlans,
} from '../src/utils/plan/selectableHomePlans';

const origin = getCurrentApiServerOrigin();
const otherOrigin = origin === 'live' ? 'local' : 'live';

function plan(overrides: Partial<TravelPlan>): TravelPlan {
  return {
    planId: 'plan-1',
    title: '부산 여행',
    startDate: '2026-08-20',
    endDate: '2026-08-22',
    status: 'CONFIRMED',
    constraints: {},
    members: [],
    itinerary: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    source: 'api',
    apiTravelId: 'travel-1',
    apiServerOrigin: origin,
    travelStatus: 'PLANNED',
    ...overrides,
  };
}

describe('getSelectableHomePlans', () => {
  it('keeps planned, in-progress, and completed server plans, dropping local drafts', () => {
    const planned = plan({
      planId: 'planned',
      apiTravelId: 't-planned',
      travelStatus: 'PLANNED',
      startDate: '2026-09-01',
    });
    const inProgress = plan({
      planId: 'in-progress',
      apiTravelId: 't-in-progress',
      travelStatus: 'IN_PROGRESS',
      startDate: '2026-08-10',
    });
    const completed = plan({
      planId: 'completed',
      apiTravelId: 't-completed',
      travelStatus: 'COMPLETED',
      status: 'COMPLETED',
      startDate: '2026-07-01',
      endDate: '2026-07-02',
    });
    const localDraft = plan({
      planId: 'local',
      source: 'local',
      apiTravelId: undefined,
      apiServerOrigin: undefined,
      travelStatus: 'PLANNED',
    });

    expect(
      getSelectableHomePlans([planned, inProgress, completed, localDraft]).map(p => p.planId),
    ).toEqual(['in-progress', 'planned', 'completed']);
  });

  it('returns the same array reference when the plans list did not change', () => {
    const list = [plan({ planId: 'same' })];
    expect(getSelectableHomePlans(list)).toBe(getSelectableHomePlans(list));
  });

  it('drops plans synced from a different API server', () => {
    const current = plan({ planId: 'current' });
    const other = plan({
      planId: 'other',
      apiTravelId: 't-other',
      apiServerOrigin: otherOrigin,
    });

    expect(getSelectableHomePlans([current, other]).map(p => p.planId)).toEqual(['current']);
  });
});

describe('mergeFeaturedIntoPickerPlans', () => {
  it('prepends a completed featured plan that is not already in the list', () => {
    const featured = plan({ planId: 'featured', travelStatus: 'COMPLETED' });
    const selectable = [plan({ planId: 'other', apiTravelId: 't-other' })];

    expect(mergeFeaturedIntoPickerPlans(selectable, featured).map(p => p.planId)).toEqual([
      'featured',
      'other',
    ]);
  });

  it('prepends an active featured plan that is not already in the list', () => {
    const featured = plan({ planId: 'featured', travelStatus: 'PLANNED' });
    const selectable = [plan({ planId: 'other', apiTravelId: 't-other' })];

    expect(mergeFeaturedIntoPickerPlans(selectable, featured).map(p => p.planId)).toEqual([
      'featured',
      'other',
    ]);
  });

  it('does not duplicate a featured plan already in the list', () => {
    const featured = plan({ planId: 'same' });
    expect(mergeFeaturedIntoPickerPlans([featured], featured).map(p => p.planId)).toEqual(['same']);
  });
});
