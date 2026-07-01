import type { BudgetCategory, BudgetEntry } from '../../types/travelPlan';

/** 가계부 유형별 합계에 항상 표시하는 분류 (기타 제외) */
export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  'food',
  'shopping',
  'accommodation',
  'transport',
  'entertainment',
];

export const BUDGET_CATEGORIES: BudgetCategory[] = [...DEFAULT_BUDGET_CATEGORIES, 'other'];

export function sumBudgetByCategory(
  entries: BudgetEntry[],
): Record<BudgetCategory, number> {
  const totals: Record<BudgetCategory, number> = {
    food: 0,
    shopping: 0,
    accommodation: 0,
    transport: 0,
    entertainment: 0,
    other: 0,
  };

  for (const entry of entries) {
    const category = entry.category ?? 'other';
    totals[category] += entry.amount;
  }

  return totals;
}

/** 기본 5개 유형은 항상, 기타는 지출이 있을 때만 */
export function getCategoryBreakdownRows(
  totals: Record<BudgetCategory, number>,
): BudgetCategory[] {
  if (totals.other > 0) {
    return [...DEFAULT_BUDGET_CATEGORIES, 'other'];
  }
  return [...DEFAULT_BUDGET_CATEGORIES];
}

export function buildBudgetDateTabs(tripDates: string[], entries: BudgetEntry[]): string[] {
  const result = [...tripDates];
  const known = new Set(tripDates);

  const extras = [...new Set(entries.map(entry => entry.date).filter(date => !known.has(date)))].sort(
    (a, b) => a.localeCompare(b),
  );

  return [...result, ...extras];
}

export function sumBudgetForDate(entries: BudgetEntry[], date: string): number {
  return entries.filter(entry => entry.date === date).reduce((sum, entry) => sum + entry.amount, 0);
}
