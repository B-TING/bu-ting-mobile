import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';

import { BudgetDateChips } from '../budget/BudgetDateChips';
import { BudgetCategoryBadge } from '../budget/BudgetCategoryBadge';
import { BudgetSummarySection } from '../budget/BudgetSummarySection';
import {
  budgetCategoryDisplay,
  memberNickname,
  splitSummary,
} from '../modals/BudgetEntryModal';
import type { PLAN_DETAIL_COPY } from '../../../constants/plan/planDetail';
import type { AppLanguage } from '../../../types/user';
import type { BudgetEntry, PlanMember } from '../../../types/travelPlan';
import {
  buildBudgetDateTabs,
  sumBudgetByCategory,
} from '../../../utils/plan/budgetTotals';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type PlanBudgetTabProps = {
  copy: Copy;
  language: AppLanguage;
  tripDates: string[];
  budgetEntries: BudgetEntry[];
  budgetTotal: number;
  members: PlanMember[];
  onAddExpense: () => void;
};

const ROW = 'flex-row items-center px-4 py-3.5';
const DETAIL_ANIM_MS = 200;

function ExpenseDetailPanel({
  expanded,
  children,
}: {
  expanded: boolean;
  children: ReactNode;
}) {
  const opacity = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(expanded ? 0 : -6)).current;
  const [mounted, setMounted] = useState(expanded);

  useEffect(() => {
    if (expanded) {
      setMounted(true);
      opacity.setValue(0);
      translateY.setValue(-6);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: DETAIL_ANIM_MS,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: DETAIL_ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: DETAIL_ANIM_MS - 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -6,
        duration: DETAIL_ANIM_MS - 40,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [expanded, mounted, opacity, translateY]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
      className="overflow-hidden border-t border-brand-border/50 bg-brand-background">
      {children}
    </Animated.View>
  );
}

function formatExpenseDate(date: string): string {
  return date.length >= 10 ? date.slice(5) : date;
}

function ExpenseTableHeader({ copy }: { copy: Copy }) {
  return (
    <View className={`${ROW} border-b border-brand-border bg-brand-background`}>
      <Text className="min-w-0 flex-1 text-center text-xs font-bold text-brand-text">
        {copy.budgetColCategory}
      </Text>
      <Text className="min-w-0 flex-1 text-center text-xs font-bold text-brand-text">
        {copy.budgetAmount}
      </Text>
      <Text className="min-w-0 flex-1 text-center text-xs font-bold text-brand-text">
        {copy.budgetDate}
      </Text>
    </View>
  );
}

function ExpenseTableRow({
  entry,
  members,
  copy,
  expanded,
  onToggle,
}: {
  entry: BudgetEntry;
  members: PlanMember[];
  copy: Copy;
  expanded: boolean;
  onToggle: () => void;
}) {
  const category = entry.category ?? 'other';
  const splitIds = entry.splitWithUserIds?.length
    ? entry.splitWithUserIds
    : [entry.paidByUserId];
  const entryForSplit = { ...entry, category, splitWithUserIds: splitIds };

  return (
    <View className="border-b border-brand-border/70 last:border-b-0">
      <Pressable
        onPress={onToggle}
        className={`${ROW} active:opacity-90 ${expanded ? 'bg-brand-selected/30' : 'bg-brand-surface'}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <View className="min-w-0 flex-1 items-center">
          <BudgetCategoryBadge
            label={budgetCategoryDisplay(category, copy)}
            category={category}
          />
        </View>
        <Text className="min-w-0 flex-1 text-center text-sm font-bold text-brand-text">
          ₩{entry.amount.toLocaleString()}
        </Text>
        <View className="min-w-0 flex-1 flex-row items-center justify-center">
          <Text className="text-sm text-brand-muted">{formatExpenseDate(entry.date)}</Text>
          <Text className="ml-1 text-[10px] text-brand-muted">{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      <ExpenseDetailPanel expanded={expanded}>
        <View className="gap-2 px-4 py-3">
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
      </ExpenseDetailPanel>
    </View>
  );
}

export function PlanBudgetTab({
  copy,
  language,
  tripDates,
  budgetEntries,
  budgetTotal,
  members,
  onAddExpense,
}: PlanBudgetTabProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const categoryTotals = useMemo(
    () => sumBudgetByCategory(budgetEntries),
    [budgetEntries],
  );

  const dateTabs = useMemo(
    () => buildBudgetDateTabs(tripDates, budgetEntries),
    [tripDates, budgetEntries],
  );

  useEffect(() => {
    if (dateTabs.length === 0) {
      setSelectedDate(null);
      return;
    }
    if (!selectedDate || !dateTabs.includes(selectedDate)) {
      setSelectedDate(dateTabs[0]);
    }
  }, [dateTabs, selectedDate]);

  const selectedEntries = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    return budgetEntries.filter(entry => entry.date === selectedDate);
  }, [budgetEntries, selectedDate]);

  const toggleEntry = (entryId: string) => {
    setExpandedEntryId(prev => (prev === entryId ? null : entryId));
  };

  return (
    <View className="flex-1 bg-brand-background">
      <View className="shrink border-b border-brand-border px-4 py-2">
        <BudgetSummarySection
          copy={copy}
          budgetTotal={budgetTotal}
          expenseCount={budgetEntries.length}
          totals={categoryTotals}
          onAddExpense={onAddExpense}
        />
      </View>

      <View className="mt-2 min-h-0 flex-1 px-4 pt-1.5">
        <View className="gap-1">
          <Text className="text-sm font-bold text-brand-text mb-2">{copy.budgetExpenseList}</Text>

          {dateTabs.length > 0 && selectedDate ? (
            <BudgetDateChips
              dates={dateTabs}
              tripDates={tripDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              language={language}
            />
          ) : null}
        </View>

        <ScrollView
          className="mt-3 flex-1"
          contentContainerStyle={
            dateTabs.length === 0
              ? { paddingBottom: 24, flexGrow: 1 }
              : { paddingBottom: 24 }
          }
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>
          {dateTabs.length === 0 ? (
            <View className="justify-center">
              <Text className="text-center text-sm text-brand-muted">{copy.budgetEmpty}</Text>
              <Pressable
                onPress={onAddExpense}
                className="mt-4 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
                <Text className="font-bold text-white">+ {copy.budgetAdd}</Text>
              </Pressable>
            </View>
          ) : selectedEntries.length === 0 ? (
            <View className="py-6">
              <Text className="text-center text-sm text-brand-muted">{copy.budgetDayEmpty}</Text>
            </View>
          ) : (
            <View className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
              <ExpenseTableHeader copy={copy} />
              {selectedEntries.map(entry => (
                <ExpenseTableRow
                  key={entry.entryId}
                  entry={entry}
                  members={members}
                  copy={copy}
                  expanded={expandedEntryId === entry.entryId}
                  onToggle={() => toggleEntry(entry.entryId)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
