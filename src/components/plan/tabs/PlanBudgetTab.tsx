import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  budgetCategoryDisplay,
  memberNickname,
  splitSummary,
} from '../modals/BudgetEntryModal';
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

const ROW = 'flex-row items-center justify-between gap-2 px-3 py-2.5';

function TableHeader({ copy }: { copy: Copy }) {
  return (
    <View className={`${ROW} border-b border-brand-border bg-brand-selected`}>
      <Text className="min-w-0 flex-1 text-[11px] font-bold text-brand-text">
        {copy.budgetColCategory}
      </Text>
      <Text className="min-w-0 flex-1 text-right text-[11px] font-bold text-brand-text">
        {copy.budgetAmount}
      </Text>
      <Text className="min-w-0 flex-1 text-right text-[11px] font-bold text-brand-text">
        {copy.budgetDate}
      </Text>
    </View>
  );
}

function TableRow({
  entry,
  members,
  copy,
  zebra,
  expanded,
  onToggle,
}: {
  entry: BudgetEntry;
  members: PlanMember[];
  copy: Copy;
  zebra: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const category = entry.category ?? 'other';
  const splitIds = entry.splitWithUserIds?.length
    ? entry.splitWithUserIds
    : [entry.paidByUserId];
  const entryForSplit = { ...entry, category, splitWithUserIds: splitIds };

  return (
    <View className="border-b border-brand-border/60">
      <Pressable
        onPress={onToggle}
        className={`${ROW} active:opacity-90 ${
          expanded ? 'bg-brand-selected/40' : zebra ? 'bg-brand-background' : 'bg-brand-surface'
        }`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <Text className="min-w-0 flex-1 text-[11px] text-brand-primary" numberOfLines={1}>
          {budgetCategoryDisplay(category, copy)}
        </Text>
        <Text className="min-w-0 flex-1 text-right text-xs font-bold text-brand-text" numberOfLines={1}>
          ₩{entry.amount.toLocaleString()}
        </Text>
        <Text className="min-w-0 flex-1 text-right text-[11px] text-brand-muted" numberOfLines={1}>
          {entry.date.slice(5)}
        </Text>
      </Pressable>

      {expanded ? (
        <View
          className={`gap-2 border-t border-brand-border/50 px-3 py-2.5 ${
            zebra ? 'bg-brand-background' : 'bg-brand-surface'
          }`}>
          <View>
            <Text className="text-[10px] font-bold uppercase text-brand-muted">
              {copy.budgetItem}
            </Text>
            <Text className="mt-0.5 text-sm font-semibold text-brand-text">{entry.label}</Text>
            {entry.memo ? (
              <Text className="mt-0.5 text-xs text-brand-muted">{entry.memo}</Text>
            ) : null}
          </View>

          <View>
            <Text className="text-[10px] font-bold uppercase text-brand-muted">
              {copy.budgetPayer}
            </Text>
            <Text className="mt-0.5 text-sm text-brand-text">
              {memberNickname(members, entry.paidByUserId)}
            </Text>
          </View>

          <View>
            <Text className="text-[10px] font-bold uppercase text-brand-muted">
              {copy.budgetSplit}
            </Text>
            <Text className="mt-0.5 text-sm text-brand-text">
              {splitSummary(entryForSplit, members, copy)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function PlanBudgetTab({
  copy,
  budgetEntries,
  budgetTotal,
  members,
  onAddExpense,
}: PlanBudgetTabProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const toggleEntry = (entryId: string) => {
    setExpandedEntryId(prev => (prev === entryId ? null : entryId));
  };

  return (
    <View className="px-4 py-4">
      <View className="mb-3 flex-row items-end justify-between">
        <View>
          <Text className="text-sm font-bold text-brand-text">{copy.budgetTotal}</Text>
          <Text className="text-xl font-bold text-brand-primary">
            ₩{budgetTotal.toLocaleString()}
          </Text>
        </View>
        <Pressable
          onPress={onAddExpense}
          className="rounded-xl bg-brand-primary px-4 py-2 active:opacity-90">
          <Text className="text-xs font-bold text-white">{copy.budgetAdd}</Text>
        </Pressable>
      </View>

      {budgetEntries.length === 0 ? (
        <Text className="mb-4 text-sm text-brand-muted">{copy.budgetEmpty}</Text>
      ) : (
        <View className="mb-4 overflow-hidden rounded-xl border border-brand-border">
          <TableHeader copy={copy} />
          {budgetEntries.map((entry, index) => (
            <TableRow
              key={entry.entryId}
              entry={entry}
              members={members}
              copy={copy}
              zebra={index % 2 === 1}
              expanded={expandedEntryId === entry.entryId}
              onToggle={() => toggleEntry(entry.entryId)}
            />
          ))}
        </View>
      )}

      {budgetEntries.length === 0 ? (
        <Pressable
          onPress={onAddExpense}
          className="items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
          <Text className="font-bold text-white">{copy.budgetAdd}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
