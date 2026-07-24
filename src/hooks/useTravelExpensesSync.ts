import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  expenseDetailToBudgetEntry,
  expenseListItemToBudgetEntry,
} from '../services/travel/travelExpenseMapper';
import {
  confirmTravelSettlement,
  fetchAllTravelExpenses,
  fetchTravelExpense,
  fetchTravelExpenseSummary,
  fetchTravelSettlements,
} from '../services/travel/travelExpenseService';
import { isPlanForCurrentApiServer } from '../utils/api/apiServerOrigin';
import { logTravelPlanApi } from '../utils/travel/travelPlanApiLogger';
import { usePlanStore } from '../stores/usePlanStore';
import type {
  TravelExpenseSummaryResponse,
  TravelSettlementResponse,
} from '../types/travelApi';
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

/** API 연동 여행 — 화면 포커스 시 서버 가계부·정산 갱신 */
export function useTravelExpensesSync({
  planId,
  travelId,
  accessToken,
  enabled,
}: UseTravelExpensesSyncOptions) {
  const setBudgetEntries = usePlanStore(s => s.setBudgetEntries);
  const [settlement, setSettlement] = useState<TravelSettlementResponse | null>(null);
  const [summary, setSummary] = useState<TravelExpenseSummaryResponse | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const syncExpenses = useCallback(async () => {
    if (!enabled || !accessToken || !travelId || !planId) {
      return;
    }

    const plan = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!plan || !isPlanForCurrentApiServer(plan)) {
      return;
    }

    setSettlementLoading(true);
    setSettlementError(null);

    try {
      const [entries, settlementData, summaryData] = await Promise.all([
        loadBudgetEntriesFromApi(accessToken, travelId, planId),
        fetchTravelSettlements(accessToken, travelId).catch(error => {
          logTravelPlanApi('expenses.settlement.sync.error', '정산 조회 실패', {
            level: 'warn',
            detail: error,
          });
          return null;
        }),
        fetchTravelExpenseSummary(accessToken, travelId).catch(error => {
          logTravelPlanApi('expenses.summary.sync.error', '가계부 요약 조회 실패', {
            level: 'warn',
            detail: error,
          });
          return null;
        }),
      ]);

      setBudgetEntries(planId, entries);
      if (settlementData) {
        setSettlement(settlementData);
      }
      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (error) {
      logTravelPlanApi('expenses.sync.error', '여행 가계부 동기화 실패', {
        level: 'warn',
        detail: error,
      });
      setSettlementError(error instanceof Error ? error.message : 'sync failed');
    } finally {
      setSettlementLoading(false);
    }
  }, [accessToken, enabled, planId, setBudgetEntries, travelId]);

  const confirmSettlement = useCallback(async (): Promise<TravelSettlementResponse | null> => {
    if (!enabled || !accessToken || !travelId) {
      return null;
    }

    setConfirming(true);
    try {
      const result = await confirmTravelSettlement(accessToken, travelId);
      setSettlement(result);
      return result;
    } catch (error) {
      logTravelPlanApi('expenses.settlement.confirm.error', '정산 확정 실패', {
        level: 'warn',
        detail: error,
      });
      throw error;
    } finally {
      setConfirming(false);
    }
  }, [accessToken, enabled, travelId]);

  useFocusEffect(
    useCallback(() => {
      void syncExpenses();
    }, [syncExpenses]),
  );

  return {
    syncExpenses,
    settlement,
    summary,
    settlementLoading,
    settlementError,
    confirming,
    confirmSettlement,
  };
}
