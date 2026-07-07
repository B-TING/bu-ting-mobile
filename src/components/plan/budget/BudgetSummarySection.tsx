import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { getBudgetCategoryStyle } from '../../../constants/plan/budgetCategoryStyle';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { BudgetCategory } from '../../../types/travelPlan';
import { getCategoryBreakdownRows } from '../../../utils/plan/budgetTotals';
import { budgetCategoryDisplay } from '../modals/BudgetEntryModal';
import { BudgetCategoryBadge } from './BudgetCategoryBadge';

type Copy = CopyFor<'planDetail'>;
type CategoryTotals = Record<BudgetCategory, number>;

type BudgetSummarySectionProps = {
  copy: Copy;
  budgetTotal: number;
  expenseCount: number;
  totals: CategoryTotals;
  onAddExpense: () => void;
};

function formatPercent(amount: number, total: number): string {
  if (total <= 0 || amount <= 0) {
    return '0%';
  }
  return `${Math.round((amount / total) * 100)}%`;
}

function GaugeBar({
  segments,
}: {
  segments: { category: BudgetCategory; amount: number; ratio: number }[];
}) {
  if (segments.length === 0) {
    return <View className="h-2 rounded-full bg-brand-border/50" />;
  }

  return (
    <View className="h-2 flex-row overflow-hidden rounded-full bg-brand-border/40">
      {segments.map(segment => (
        <View
          key={segment.category}
          style={{
            flex: segment.ratio,
            backgroundColor: getBudgetCategoryStyle(segment.category).main,
            minWidth: segment.ratio > 0 ? 4 : 0,
          }}
        />
      ))}
    </View>
  );
}

const BREAKDOWN_ANIM_MS = 200;

function CollapsibleBreakdown({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  const opacity = useRef(new Animated.Value(open ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(open ? 0 : -6)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      opacity.setValue(0);
      translateY.setValue(-6);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: BREAKDOWN_ANIM_MS,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: BREAKDOWN_ANIM_MS,
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
        duration: BREAKDOWN_ANIM_MS - 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -6,
        duration: BREAKDOWN_ANIM_MS - 40,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [mounted, open, opacity, translateY]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
  );
}

function CategoryBreakdownRow({
  category,
  amount,
  total,
  copy,
}: {
  category: BudgetCategory;
  amount: number;
  total: number;
  copy: Copy;
}) {
  const percent = total > 0 && amount > 0 ? (amount / total) * 100 : 0;
  const style = getBudgetCategoryStyle(category);
  const label = budgetCategoryDisplay(category, copy);

  return (
    <View className="flex-row items-center border-b border-brand-border/40 py-1.5 last:border-b-0">
      <View className="w-20 shrink-0">
        <BudgetCategoryBadge label={label} category={category} />
      </View>
      <View className="mx-2 h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-brand-border/50">
        <View
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: style.main }}
        />
      </View>
      <Text className="w-[4.5rem] shrink-0 text-right text-sm font-bold text-brand-text">
        ₩{amount.toLocaleString()}
      </Text>
      <Text className="w-9 shrink-0 text-right text-xs text-brand-muted">
        {formatPercent(amount, total)}
      </Text>
    </View>
  );
}

export function BudgetSummarySection({
  copy,
  budgetTotal,
  expenseCount,
  totals,
  onAddExpense,
}: BudgetSummarySectionProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const rows = getCategoryBreakdownRows(totals);
  const activeSegments = rows
    .filter(category => totals[category] > 0)
    .map(category => ({
      category,
      amount: totals[category],
      ratio: totals[category] / budgetTotal,
    }));

  return (
    <View className="rounded-2xl border border-brand-border bg-brand-surface p-3">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-bold text-brand-text">{copy.budgetTotal}</Text>
          <Text className="mt-0.5 text-xl font-bold text-brand-primary">
            ₩{budgetTotal.toLocaleString()}
          </Text>
          <Text className="mt-0.5 text-xs text-brand-muted">
            {copy.budgetExpenseCount(expenseCount)}
          </Text>
        </View>
        <Pressable
          onPress={onAddExpense}
          className="rounded-xl bg-brand-primary px-3 py-2 active:opacity-90">
          <Text className="text-xs font-bold text-white">+ {copy.budgetAdd}</Text>
        </Pressable>
      </View>

      <GaugeBar segments={activeSegments} />

      {activeSegments.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-0.5">
          {activeSegments.map(segment => (
            <View key={segment.category} className="flex-row items-center">
              <View
                className="mr-1 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: getBudgetCategoryStyle(segment.category).main }}
              />
              <Text className="text-[10px] text-brand-muted">
                {budgetCategoryDisplay(segment.category, copy)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => setBreakdownOpen(prev => !prev)}
        className="mt-3 flex-row items-center justify-between active:opacity-90"
        accessibilityRole="button"
        accessibilityState={{ expanded: breakdownOpen }}>
        <Text className="text-sm font-bold text-brand-text">{copy.budgetCategoryBreakdown}</Text>
        <Text className="text-xs text-brand-muted">{breakdownOpen ? '▲' : '▼'}</Text>
      </Pressable>

      <CollapsibleBreakdown open={breakdownOpen}>
        <View className="pt-1">
          {rows.map(category => (
            <CategoryBreakdownRow
              key={category}
              category={category}
              amount={totals[category]}
              total={budgetTotal}
              copy={copy}
            />
          ))}
        </View>
      </CollapsibleBreakdown>
    </View>
  );
}
