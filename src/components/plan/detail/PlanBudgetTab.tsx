import { Pressable, Text, View } from 'react-native';

import {
  budgetCategoryDisplay,
  memberNickname,
  splitSummary,
} from '../BudgetEntryModal';
import type { PLAN_DETAIL_COPY } from '../../../constants/planDetail';
import type { AppLanguage } from '../../../types/user';
import type { BudgetEntry, PlanMember } from '../../../types/travelPlan';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type PlanBudgetTabProps = {
  copy: Copy;
  budgetEntries: BudgetEntry[];
  budgetTotal: number;
  members: PlanMember[];
  onAddExpense: () => void;
};

export function PlanBudgetTab({
  copy,
  budgetEntries,
  budgetTotal,
  members,
  onAddExpense,
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
        budgetEntries.map(e => {
          const category = e.category ?? 'other';
          const splitIds = e.splitWithUserIds?.length
            ? e.splitWithUserIds
            : [e.paidByUserId];
          const entryForDisplay = { ...e, category, splitWithUserIds: splitIds };
          return (
            <View
              key={e.entryId}
              className="mb-2 rounded-xl border border-brand-border bg-brand-surface px-4 py-3">
              <View className="flex-row items-start justify-between">
                <View className="min-w-0 flex-1 pr-3">
                  <Text className="font-semibold text-brand-text">{e.label}</Text>
                  <Text className="mt-0.5 text-xs text-brand-primary">
                    {budgetCategoryDisplay(category, copy)}
                  </Text>
                </View>
                <Text className="font-bold text-brand-text">₩{e.amount.toLocaleString()}</Text>
              </View>
              <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-1">
                <Text className="text-[11px] text-brand-muted">
                  {copy.budgetPayer}: {memberNickname(members, e.paidByUserId)}
                </Text>
                <Text className="text-[11px] text-brand-muted">
                  {copy.budgetSplit}: {splitSummary(entryForDisplay, members, copy)}
                </Text>
                <Text className="text-[11px] text-brand-muted">
                  {copy.budgetDate}: {e.date}
                </Text>
              </View>
              {e.memo ? (
                <Text className="mt-1 text-xs text-brand-muted">{e.memo}</Text>
              ) : null}
            </View>
          );
        })
      )}
      <Pressable
        onPress={onAddExpense}
        className="mt-2 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
        <Text className="font-bold text-white">{copy.budgetAdd}</Text>
      </Pressable>
    </View>
  );
}
