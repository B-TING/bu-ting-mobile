import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { enrichPlaceInfo } from '../constants/placeCatalog';
import type { PlanWizardAnswers } from '../types/planWizard';
import type { BudgetEntry, RouteItem, TravelPlan } from '../types/travelPlan';
import { createId } from '../utils/id';

type PlanState = {
  plans: TravelPlan[];
  activePlanId: string | null;
  planCandidates: TravelPlan[] | null;
  budgetByPlan: Record<string, BudgetEntry[]>;
  addPlan: (plan: TravelPlan) => void;
  setActivePlan: (planId: string) => void;
  confirmPlan: (planId: string) => void;
  setPlanCandidates: (candidates: TravelPlan[] | null) => void;
  clearCandidates: () => void;
  toggleRouteVisited: (planId: string, itemId: string) => void;
  removeRouteFromPlan: (planId: string, itemId: string) => void;
  replaceRouteInPlan: (planId: string, itemId: string, replacement: RouteItem) => void;
  addRouteToPlan: (planId: string, dayNumber: number, route: RouteItem) => void;
  reorderRoutesInPlan: (planId: string, dayNumber: number, orderedItemIds: string[]) => void;
  addBudgetEntry: (entry: Omit<BudgetEntry, 'entryId'>) => void;
  getBudgetForPlan: (planId: string) => BudgetEntry[];
  completePlan: (planId: string) => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      activePlanId: null,
      planCandidates: null,
      budgetByPlan: {},
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
      toggleRouteVisited: (planId, itemId) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => ({
                ...day,
                routes: day.routes.map(r =>
                  r.itemId === itemId ? { ...r, isVisited: !r.isVisited } : r,
                ),
              })),
            };
          }),
        })),
      removeRouteFromPlan: (planId, itemId) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => {
                const filtered = day.routes.filter(r => r.itemId !== itemId);
                return {
                  ...day,
                  routes: filtered.map((r, i) => ({ ...r, sequence: i })),
                };
              }),
            };
          }),
        })),
      replaceRouteInPlan: (planId, itemId, replacement) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => ({
                ...day,
                routes: day.routes.map(r =>
                  r.itemId === itemId
                    ? {
                        ...replacement,
                        itemId: r.itemId,
                        sequence: r.sequence,
                        isVisited: false,
                      }
                    : r,
                ),
              })),
            };
          }),
        })),
      addRouteToPlan: (planId, dayNumber, route) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => {
                if (day.dayNumber !== dayNumber) {
                  return day;
                }
                const sequence = day.routes.length;
                return {
                  ...day,
                  routes: [...day.routes, { ...route, sequence }],
                };
              }),
            };
          }),
        })),
      reorderRoutesInPlan: (planId, dayNumber, orderedItemIds) =>
        set(state => ({
          plans: state.plans.map(plan => {
            if (plan.planId !== planId) {
              return plan;
            }
            return {
              ...plan,
              itinerary: plan.itinerary.map(day => {
                if (day.dayNumber !== dayNumber) {
                  return day;
                }
                const byId = Object.fromEntries(day.routes.map(r => [r.itemId, r]));
                const routes = orderedItemIds
                  .map((id, i) => {
                    const r = byId[id];
                    return r ? { ...r, sequence: i } : null;
                  })
                  .filter((r): r is RouteItem => r != null);
                return { ...day, routes };
              }),
            };
          }),
        })),
      addBudgetEntry: entry => {
        const full: BudgetEntry = { ...entry, entryId: createId('exp-') };
        set(state => ({
          budgetByPlan: {
            ...state.budgetByPlan,
            [entry.planId]: [...(state.budgetByPlan[entry.planId] ?? []), full],
          },
        }));
      },
      getBudgetForPlan: planId => get().budgetByPlan[planId] ?? [],
      completePlan: planId =>
        set(state => ({
          plans: state.plans.map(p =>
            p.planId === planId ? { ...p, status: 'COMPLETED' } : p,
          ),
          activePlanId:
            state.activePlanId === planId ? null : state.activePlanId,
        })),
    }),
    {
      name: '@buting/plans',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        plans: state.plans,
        activePlanId: state.activePlanId,
        budgetByPlan: state.budgetByPlan,
      }),
    },
  ),
);

export function selectActivePlan(state: PlanState): TravelPlan | null {
  if (state.activePlanId) {
    const active = state.plans.find(p => p.planId === state.activePlanId);
    if (active && active.status !== 'COMPLETED') {
      return active;
    }
  }
  return (
    state.plans.find(p => p.status === 'DRAFT' || p.status === 'CONFIRMED') ??
    null
  );
}

export function selectPlanById(planId: string) {
  return (state: PlanState) =>
    state.plans.find(p => p.planId === planId) ?? null;
}

/** 기존 플랜에 placeInfo가 없을 때 런타임 보강 */
export function hydrateRoutePlaceInfo(
  route: RouteItem,
  lang: 'ko' | 'en' | 'ja' | 'zh',
): RouteItem {
  if (route.placeInfo) {
    return route;
  }
  return {
    ...route,
    placeInfo: enrichPlaceInfo(route.placeId, route.placeName, route.type, lang),
  };
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
