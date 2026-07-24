import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  expenseDetailToBudgetEntry,
  expenseListItemToBudgetEntry,
} from '../services/travel/travelExpenseMapper';
import {
  fetchAllTravelExpenses,
  fetchTravelExpense,
} from '../services/travel/travelExpenseService';
import { isPlanForCurrentApiServer } from '../utils/api/apiServerOrigin';
import { logTravelPlanApi } from '../utils/travel/travelPlanApiLogger';
import { usePlanStore } from '../stores/usePlanStore';
import type { BudgetEntry } from '../types/travelPlan';

type UseTravelExpensesSyncOptions = {
  planId: string;
  travelId: string | null | undefined;
  accessToken: string | null;
  enabled: boolean;
};

async function loadBudgetEntriesFromApi(
  accessToken: string,
  travelId: string,
  planId: string,
): Promise<BudgetEntry[]> {
  const listItems = await fetchAllTravelExpenses(accessToken, travelId);
  if (listItems.length === 0) {
    return [];
  }

  const details = await Promise.all(
    listItems.map(async item => {
      try {
        return await fetchTravelExpense(accessToken, travelId, item.expenseId);
      } catch {
        return null;
      }
    }),
  );

  return listItems.map((item, index) => {
    const detail = details[index];
    if (detail) {
      return expenseDetailToBudgetEntry(detail, planId);
    }
    return expenseListItemToBudgetEntry(item, planId);
  });
}

/** API 연동 여행 — 화면 포커스 시 서버 가계부로 갱신 */
export function useTravelExpensesSync({
  planId,
  travelId,
  accessToken,
  enabled,
}: UseTravelExpensesSyncOptions) {
  const setBudgetEntries = usePlanStore(s => s.setBudgetEntries);

  const syncExpenses = useCallback(async () => {
    if (!enabled || !accessToken || !travelId || !planId) {
      return;
    }

    const plan = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!plan || !isPlanForCurrentApiServer(plan)) {
      return;
    }

    try {
      const entries = await loadBudgetEntriesFromApi(accessToken, travelId, planId);
      setBudgetEntries(planId, entries);
    } catch (error) {
      logTravelPlanApi('expenses.sync.error', '여행 가계부 동기화 실패', {
        level: 'warn',
        detail: error,
      });
    }
  }, [accessToken, enabled, planId, setBudgetEntries, travelId]);

  useFocusEffect(
    useCallback(() => {
      void syncExpenses();
    }, [syncExpenses]),
  );

  return { syncExpenses };
}
