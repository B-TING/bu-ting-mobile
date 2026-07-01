import { Text, View } from 'react-native';

import { getBudgetCategoryStyle } from '../../../constants/plan/budgetCategoryStyle';
import type { BudgetCategory } from '../../../types/travelPlan';

type BudgetCategoryBadgeProps = {
  label: string;
  category: BudgetCategory;
};

export function BudgetCategoryBadge({ label, category }: BudgetCategoryBadgeProps) {
  const style = getBudgetCategoryStyle(category);

  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: style.light }}>
      <Text className="text-[11px] font-semibold" style={{ color: style.text }}>
        {label}
      </Text>
    </View>
  );
}
