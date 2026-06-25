import { Pressable, Text, View } from 'react-native';

import type { PLAN_DETAIL_COPY } from '../../../constants/plan/planDetail';
import type { AppLanguage } from '../../../types/user';
import type { BudgetEntry } from '../../../types/travelPlan';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type OverviewMiniWidgetsProps = {
  copy: Copy;
  budgetTotal: number;
  budgetEntries: BudgetEntry[];
  recordsProgress?: { completed: number; total: number; allDone: boolean };
  isTraveloguePublished?: boolean;
  onBudgetPress: () => void;
  onRecordsPress: () => void;
};

export function OverviewMiniWidgets({
  copy,
  budgetTotal,
  budgetEntries,
  recordsProgress,
  isTraveloguePublished,
  onBudgetPress,
  onRecordsPress,
}: OverviewMiniWidgetsProps) {
  return (
    <View className="mb-2 flex-row gap-2">
      <Pressable
        onPress={onBudgetPress}
        className="flex-1 rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 active:opacity-90">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-xs font-bold text-brand-text">{copy.budgetPreview}</Text>
          <Text className="text-[10px] font-semibold text-brand-primary">{copy.viewTab}</Text>
        </View>
        <Text className="text-base font-bold text-brand-primary">
          ₩{budgetTotal.toLocaleString()}
        </Text>
        {budgetEntries.length === 0 ? (
          <Text className="mt-0.5 text-[10px] text-brand-muted" numberOfLines={1}>
            {copy.budgetEmpty}
          </Text>
        ) : (
          <Text className="mt-0.5 text-[10px] text-brand-muted" numberOfLines={1}>
            {budgetEntries[0].label}
            {budgetEntries.length > 1
              ? ` +${budgetEntries.length - 1}`
              : ''}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={onRecordsPress}
        className="flex-1 rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 active:opacity-90">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-xs font-bold text-brand-text">{copy.recordsPreview}</Text>
          <Text className="text-[10px] font-semibold text-brand-primary">{copy.viewTab}</Text>
        </View>
        {isTraveloguePublished ? (
          <Text className="text-xs font-semibold text-brand-primary" numberOfLines={2}>
            {copy.recordsPublished}
          </Text>
        ) : recordsProgress && recordsProgress.total > 0 ? (
          <>
            <Text className="text-base font-bold text-brand-text">
              {recordsProgress.completed}/{recordsProgress.total}
            </Text>
            <Text className="mt-0.5 text-[10px] text-brand-primary" numberOfLines={1}>
              {copy.recordsReady}
            </Text>
          </>
        ) : (
          <Text className="text-[10px] leading-4 text-brand-muted" numberOfLines={2}>
            {copy.recordsHint}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
