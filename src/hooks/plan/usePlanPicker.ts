import { useCallback, useMemo, useState } from 'react';

import { useAppStore, selectHomeFeaturedPlan, usePlanStore } from '../../stores';
import type { TravelPlan } from '../../types/travelPlan';
import { listOfflineViewablePlans } from '../../utils/plan/selectLatestLocalPlan';
import {
  getSelectableHomePlans,
  mergeFeaturedIntoPickerPlans,
} from '../../utils/plan/selectableHomePlans';

/** 홈·일정 화면에서 서버 연동 여행을 고를 때 공통으로 사용합니다. */
export function usePlanPicker(viewedPlan?: TravelPlan | null) {
  const offlineMode = useAppStore(s => s.offlineMode);
  const plans = usePlanStore(s => s.plans);
  const featuredPlan = usePlanStore(selectHomeFeaturedPlan);
  const setActivePlan = usePlanStore(s => s.setActivePlan);
  const selectablePlans = useMemo(() => {
    if (offlineMode) {
      return listOfflineViewablePlans({ plans });
    }
    return getSelectableHomePlans(plans);
  }, [offlineMode, plans]);
  const currentPlan = viewedPlan ?? featuredPlan;
  const pickerPlans = useMemo(() => {
    if (offlineMode) {
      if (!currentPlan) {
        return selectablePlans;
      }
      if (selectablePlans.some(plan => plan.planId === currentPlan.planId)) {
        return selectablePlans;
      }
      return [currentPlan, ...selectablePlans];
    }
    return mergeFeaturedIntoPickerPlans(selectablePlans, currentPlan ?? null);
  }, [currentPlan, offlineMode, selectablePlans]);
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
