import { useCallback, useMemo, useState } from 'react';

import { selectHomeFeaturedPlan, usePlanStore } from '../../stores';
import type { TravelPlan } from '../../types/travelPlan';
import {
  getSelectableHomePlans,
  mergeFeaturedIntoPickerPlans,
} from '../../utils/plan/selectableHomePlans';

/** 홈·일정 화면에서 서버 연동 여행을 고를 때 공통으로 사용합니다. */
export function usePlanPicker(viewedPlan?: TravelPlan | null) {
  const plans = usePlanStore(s => s.plans);
  const featuredPlan = usePlanStore(selectHomeFeaturedPlan);
  const setActivePlan = usePlanStore(s => s.setActivePlan);
  const selectablePlans = useMemo(() => getSelectableHomePlans(plans), [plans]);
  const currentPlan = viewedPlan ?? featuredPlan;
  const pickerPlans = useMemo(
    () => mergeFeaturedIntoPickerPlans(selectablePlans, currentPlan ?? null),
    [currentPlan, selectablePlans],
  );
  const canSwitchPlans = pickerPlans.some(plan => plan.planId !== currentPlan?.planId);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);

  const openPlanPicker = useCallback(() => {
    setPlanPickerOpen(true);
  }, []);

  const closePlanPicker = useCallback(() => {
    setPlanPickerOpen(false);
  }, []);

  const selectPlan = useCallback(
    (planId: string) => {
      setActivePlan(planId);
      setPlanPickerOpen(false);
    },
    [setActivePlan],
  );

  return {
    pickerPlans,
    canSwitchPlans,
    planPickerOpen,
    selectedPlanId: currentPlan?.planId ?? null,
    openPlanPicker,
    closePlanPicker,
    selectPlan,
  };
}
