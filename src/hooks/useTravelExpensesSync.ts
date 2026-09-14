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
  onListReady?: (entries: BudgetEntry[]) => void,
): Promise<BudgetEntry[]> {
  const listItems = await fetchAllTravelExpenses(accessToken, travelId);
  const listEntries = listItems.map(item => expenseListItemToBudgetEntry(item, planId));
  onListReady?.(listEntries);

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
  /** 캐시 없을 때만 전체 로딩 UI */
  const [settlementLoading, setSettlementLoading] = useState(false);
  /** 기존 데이터 유지한 채 백그라운드 갱신 */
  const [settlementRefreshing, setSettlementRefreshing] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  /** 오래된 in-flight 동기화가 최신 정산을 덮어쓰지 않도록 */
  const syncGenerationRef = useRef(0);
  const settlementRef = useRef(settlement);
  const summaryRef = useRef(summary);
  settlementRef.current = settlement;
  summaryRef.current = summary;

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

  const beginSyncIndicators = useCallback(
    (targetPlanId: string) => {
      const existingEntries =
        usePlanStore.getState().budgetByPlan?.[targetPlanId] ?? [];
      const hasExisting =
        existingEntries.length > 0 ||
        settlementRef.current != null ||
        summaryRef.current != null;
      if (hasExisting) {
        setSettlementRefreshing(true);
        setSettlementLoading(false);
      } else {
        setSettlementLoading(true);
        setSettlementRefreshing(false);
      }
      setSettlementError(null);
    },
    [],
  );

  const endSyncIndicators = useCallback(() => {
    setSettlementLoading(false);
    setSettlementRefreshing(false);
  }, []);

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
    beginSyncIndicators(planId);

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
        endSyncIndicators();
      }
    }
  }, [
    accessToken,
    beginSyncIndicators,
    enabled,
    endSyncIndicators,
    fetchSettlementPreview,
    planId,
    travelId,
  ]);

  const syncExpenses = useCallback(async () => {
    if (!enabled || !accessToken || !travelId || !planId) {
      return;
    }

    const plan = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!plan || !isPlanForCurrentApiServer(plan)) {
      return;
    }

    const generation = ++syncGenerationRef.current;
    beginSyncIndicators(planId);

    try {
      // 목록 먼저 반영(SWR) → N+1 상세는 후속. 정산 미리보기는 목록 직후 병렬.
      const previewPromise = fetchSettlementPreview(accessToken, travelId);
      const entries = await loadBudgetEntriesFromApi(
        accessToken,
        travelId,
        planId,
        listEntries => {
          if (generation !== syncGenerationRef.current) {
            return;
          }
          setBudgetEntries(planId, listEntries);
        },
      );
      if (generation !== syncGenerationRef.current) {
        return;
      }
      setBudgetEntries(planId, entries);

      const { settlementData, summaryData } = await previewPromise;
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
        endSyncIndicators();
      }
    }
  }, [
    accessToken,
    beginSyncIndicators,
    enabled,
    endSyncIndicators,
    fetchSettlementPreview,
    planId,
    setBudgetEntries,
    travelId,
  ]);

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
    settlementRefreshing,
    settlementError,
    confirming,
    confirmSettlement,
  };
}
