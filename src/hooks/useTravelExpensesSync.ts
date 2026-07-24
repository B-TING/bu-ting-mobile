import { useCallback, useRef, useState } from 'react';
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
  /** 오래된 in-flight 동기화가 최신 정산을 덮어쓰지 않도록 */
  const syncGenerationRef = useRef(0);

  const fetchSettlementPreview = useCallback(
    async (token: string, id: string) => {
      const [settlementData, summaryData] = await Promise.all([
        fetchTravelSettlements(token, id).catch(error => {
          logTravelPlanApi('expenses.settlement.sync.error', '정산 조회 실패', {
            level: 'warn',
            detail: error,
          });
          return null;
        }),
        fetchTravelExpenseSummary(token, id).catch(error => {
          logTravelPlanApi('expenses.summary.sync.error', '가계부 요약 조회 실패', {
            level: 'warn',
            detail: error,
          });
          return null;
        }),
      ]);
      return { settlementData, summaryData };
    },
    [],
  );

  /** 지출 추가/수정 직후 — 정산·요약만 빠르게 재조회 */
  const refreshSettlementPreview = useCallback(async () => {
    if (!enabled || !accessToken || !travelId || !planId) {
      return;
    }

    const plan = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!plan || !isPlanForCurrentApiServer(plan)) {
      return;
    }

    const generation = ++syncGenerationRef.current;
    setSettlementLoading(true);
    setSettlementError(null);

    try {
      const { settlementData, summaryData } = await fetchSettlementPreview(
        accessToken,
        travelId,
      );
      if (generation !== syncGenerationRef.current) {
        return;
      }
      if (settlementData) {
        setSettlement(settlementData);
      }
      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (error) {
      if (generation !== syncGenerationRef.current) {
        return;
      }
      logTravelPlanApi('expenses.settlement.refresh.error', '정산 미리보기 갱신 실패', {
        level: 'warn',
        detail: error,
      });
      setSettlementError(error instanceof Error ? error.message : 'sync failed');
    } finally {
      if (generation === syncGenerationRef.current) {
        setSettlementLoading(false);
      }
    }
  }, [accessToken, enabled, fetchSettlementPreview, planId, travelId]);

  const syncExpenses = useCallback(async () => {
    if (!enabled || !accessToken || !travelId || !planId) {
      return;
    }

    const plan = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!plan || !isPlanForCurrentApiServer(plan)) {
      return;
    }

    const generation = ++syncGenerationRef.current;
    setSettlementLoading(true);
    setSettlementError(null);

    try {
      // 경비 목록을 먼저 맞춘 뒤 정산/요약을 조회해, 느린 상세 로딩 중 추가된 지출과 미리보기가 어긋나지 않게 함
      const entries = await loadBudgetEntriesFromApi(accessToken, travelId, planId);
      if (generation !== syncGenerationRef.current) {
        return;
      }
      setBudgetEntries(planId, entries);

      const { settlementData, summaryData } = await fetchSettlementPreview(
        accessToken,
        travelId,
      );
      if (generation !== syncGenerationRef.current) {
        return;
      }
      if (settlementData) {
        setSettlement(settlementData);
      }
      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (error) {
      if (generation !== syncGenerationRef.current) {
        return;
      }
      logTravelPlanApi('expenses.sync.error', '여행 가계부 동기화 실패', {
        level: 'warn',
        detail: error,
      });
      setSettlementError(error instanceof Error ? error.message : 'sync failed');
    } finally {
      if (generation === syncGenerationRef.current) {
        setSettlementLoading(false);
      }
    }
  }, [accessToken, enabled, fetchSettlementPreview, planId, setBudgetEntries, travelId]);

  const confirmSettlement = useCallback(async (): Promise<TravelSettlementResponse | null> => {
    if (!enabled || !accessToken || !travelId) {
      return null;
    }

    setConfirming(true);
    try {
      const result = await confirmTravelSettlement(accessToken, travelId);
      syncGenerationRef.current += 1;
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
    refreshSettlementPreview,
    settlement,
    summary,
    settlementLoading,
    settlementError,
    confirming,
    confirmSettlement,
  };
}
