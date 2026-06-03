import { Pressable, Text, View } from 'react-native';

import type { PLAN_DETAIL_COPY } from '../../../constants/planDetail';
import type { AppLanguage } from '../../../types/user';
import type { BudgetEntry } from '../../../types/travelPlan';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type PlanBudgetTabProps = {
  copy: Copy;
  budgetEntries: BudgetEntry[];
  budgetTotal: number;
  onAddSample: () => void;
};

export function PlanBudgetTab({
  copy,
  budgetEntries,
  budgetTotal,
  onAddSample,
}: PlanBudgetTabProps) {
  return (
    <View className="px-4 pb-8">
      <Text className="mb-1 text-lg font-bold text-brand-text">{copy.budgetTotal}</Text>
      <Text className="mb-4 text-2xl font-bold text-brand-primary">
        ₩{budgetTotal.toLocaleString()}
      </Text>
      {budgetEntries.length === 0 ? (
        <Text className="mb-4 text-sm text-brand-muted">{copy.budgetEmpty}</Text>
      ) : (
        budgetEntries.map(e => (
          <View
            key={e.entryId}
            className="mb-2 flex-row justify-between rounded-xl border border-brand-border bg-brand-surface px-4 py-3">
            <View>
              <Text className="font-semibold text-brand-text">{e.label}</Text>
              <Text className="text-xs text-brand-muted">{e.date}</Text>
            </View>
            <Text className="font-bold text-brand-text">₩{e.amount.toLocaleString()}</Text>
          </View>
        ))
      )}
      <Pressable
        onPress={onAddSample}
        className="mt-2 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
        <Text className="font-bold text-white">{copy.budgetAdd}</Text>
      </Pressable>
    </View>
  );
}
