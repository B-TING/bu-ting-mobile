import type { BudgetCategory } from '../../types/travelPlan';

export type BudgetCategoryStyle = {
  main: string;
  light: string;
  text: string;
};

export const BUDGET_CATEGORY_STYLE: Record<BudgetCategory, BudgetCategoryStyle> = {
  food: { main: '#E85D04', light: '#FFF4ED', text: '#C2410C' },
  shopping: { main: '#DB2777', light: '#FDF2F8', text: '#BE185D' },
  accommodation: { main: '#7B2CBF', light: '#F5EEFF', text: '#6B21A8' },
  transport: { main: '#0077B6', light: '#E8F6FC', text: '#0369A1' },
  entertainment: { main: '#2D6A4F', light: '#EDF7F1', text: '#166534' },
  other: { main: '#64748B', light: '#F1F5F9', text: '#475569' },
};

export function getBudgetCategoryStyle(category: BudgetCategory): BudgetCategoryStyle {
  return BUDGET_CATEGORY_STYLE[category];
}
