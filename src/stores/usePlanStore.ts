import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PlanWizardAnswers } from '../types/planWizard';
import type { TravelPlan } from '../types/travelPlan';

type PlanState = {
  plans: TravelPlan[];
  activePlanId: string | null;
  planCandidates: TravelPlan[] | null;
  addPlan: (plan: TravelPlan) => void;
  setActivePlan: (planId: string) => void;
  confirmPlan: (planId: string) => void;
  setPlanCandidates: (candidates: TravelPlan[] | null) => void;
  clearCandidates: () => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    set => ({
      plans: [],
      activePlanId: null,
      planCandidates: null,
      addPlan: plan =>
        set(state => ({
          plans: [...state.plans.filter(p => p.planId !== plan.planId), plan],
          activePlanId: plan.planId,
        })),
      setActivePlan: planId => set({ activePlanId: planId }),
      confirmPlan: planId =>
        set(state => ({
          plans: state.plans.map(p =>
            p.planId === planId ? { ...p, status: 'CONFIRMED' } : p,
          ),
          activePlanId: planId,
        })),
      setPlanCandidates: candidates => set({ planCandidates: candidates }),
      clearCandidates: () => set({ planCandidates: null }),
    }),
    {
      name: '@buting/plans',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        plans: state.plans,
        activePlanId: state.activePlanId,
      }),
    },
  ),
);

export function selectActivePlan(state: PlanState): TravelPlan | null {
  if (!state.activePlanId) {
    return (
      state.plans.find(p => p.status === 'DRAFT' || p.status === 'CONFIRMED') ??
      null
    );
  }
  return state.plans.find(p => p.planId === state.activePlanId) ?? null;
}

export const emptyWizardAnswers = (): PlanWizardAnswers => ({
  startDate: '',
  endDate: '',
  companionCount: 1,
  companionTypes: [],
  hasHeavyBaggage: false,
  attractionIds: [],
  foodIds: [],
  accommodationMode: 'area_only',
  accommodationPlaceId: null,
  accommodationName: null,
  accommodationAreaIds: [],
  generationMode: 'auto',
});
