import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PLAN_DETAIL_COPY } from '../../constants/planDetail';
import type { AppLanguage } from '../../types/user';
import type { BudgetCategory, BudgetEntry, PlanMember } from '../../types/travelPlan';
import { cn } from '../../utils/cn';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

export type BudgetEntryDraft = Omit<BudgetEntry, 'entryId'>;

type BudgetEntryModalProps = {
  visible: boolean;
  copy: Copy;
  language: AppLanguage;
  members: PlanMember[];
  defaultDate: string;
  planId: string;
  onClose: () => void;
  onSave: (entry: BudgetEntryDraft) => void;
};

function categoryLabel(category: BudgetCategory, copy: Copy): string {
  switch (category) {
    case 'food':
      return copy.budgetCategoryFood;
    case 'shopping':
      return copy.budgetCategoryShopping;
    case 'accommodation':
      return copy.budgetCategoryAccommodation;
    case 'transport':
      return copy.budgetCategoryTransport;
    case 'entertainment':
      return copy.budgetCategoryEntertainment;
    default:
      return copy.budgetCategoryOther;
  }
}

const CATEGORIES: BudgetCategory[] = [
  'food',
  'shopping',
  'accommodation',
  'transport',
  'entertainment',
  'other',
];

export function BudgetEntryModal({
  visible,
  copy,
  language,
  members,
  defaultDate,
  planId,
  onClose,
  onSave,
}: BudgetEntryModalProps) {
  const insets = useSafeAreaInsets();
  const [paidByUserId, setPaidByUserId] = useState(members[0]?.userId ?? '');
  const [splitWithUserIds, setSplitWithUserIds] = useState<string[]>([]);
  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('food');
  const [amountText, setAmountText] = useState('');
  const [memo, setMemo] = useState('');

  const memberIds = useMemo(() => members.map(m => m.userId), [members]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setPaidByUserId(members[0]?.userId ?? '');
    setSplitWithUserIds(memberIds);
    setDate(defaultDate);
    setLabel('');
    setCategory('food');
    setAmountText('');
    setMemo('');
  }, [visible, members, defaultDate, memberIds]);

  const toggleSplit = (userId: string) => {
    setSplitWithUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId],
    );
  };

  const handleOcr = () => {
    Alert.alert(copy.budgetOcrScan, copy.budgetOcrSoon);
  };

  const handleSave = () => {
    const amount = parseInt(amountText.replace(/[^0-9]/g, ''), 10);
    const trimmedLabel = label.trim();
    if (!trimmedLabel || !amount || amount <= 0 || !paidByUserId) {
      return;
    }
    onSave({
      planId,
      label: trimmedLabel,
      category,
      amount,
      currency: 'KRW',
      date,
      paidByUserId,
      splitWithUserIds: splitWithUserIds.length > 0 ? splitWithUserIds : [paidByUserId],
      memo: memo.trim() || undefined,
    });
    onClose();
  };

  const amount = parseInt(amountText.replace(/[^0-9]/g, ''), 10);
  const canSave = !!label.trim() && !!amount && amount > 0 && !!paidByUserId;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          className="rounded-t-3xl bg-brand-background">
          <View className="my-2 h-1 w-10 self-center rounded-full bg-brand-border" />
          <ScrollView
            className="max-h-[78%] px-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text className="mb-4 text-xl font-bold text-brand-text">{copy.budgetAdd}</Text>

            <Text className="mb-2 text-sm font-semibold text-brand-muted">{copy.budgetPayer}</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {members.map(m => (
                <Pressable
                  key={m.userId}
                  onPress={() => setPaidByUserId(m.userId)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 active:opacity-90',
                    paidByUserId === m.userId
                      ? 'border-brand-primary bg-brand-selected'
                      : 'border-brand-border bg-brand-surface',
                  )}>
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      paidByUserId === m.userId ? 'text-brand-primary' : 'text-brand-text',
                    )}>
                    {m.nickname}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-2 text-sm font-semibold text-brand-muted">{copy.budgetSplit}</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => setSplitWithUserIds(memberIds)}
                className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 active:opacity-90">
                <Text className="text-sm font-semibold text-brand-muted">{copy.budgetSplitAll}</Text>
              </Pressable>
              {members.map(m => {
                const selected = splitWithUserIds.includes(m.userId);
                return (
                  <Pressable
                    key={m.userId}
                    onPress={() => toggleSplit(m.userId)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 active:opacity-90',
                      selected
                        ? 'border-brand-primary bg-brand-selected'
                        : 'border-brand-border bg-brand-surface',
                    )}>
                    <Text
                      className={cn(
                        'text-sm font-semibold',
                        selected ? 'text-brand-primary' : 'text-brand-muted',
                      )}>
                      {selected ? '✓ ' : ''}
                      {m.nickname}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mb-2 text-sm font-semibold text-brand-muted">{copy.budgetDate}</Text>
            <TextInput
              className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
              value={date}
              onChangeText={setDate}
              placeholder="2026-06-15"
              autoCapitalize="none"
            />

            <Text className="mb-2 text-sm font-semibold text-brand-muted">{copy.budgetItem}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {CATEGORIES.map(cat => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 active:opacity-90',
                      category === cat
                        ? 'border-brand-primary bg-brand-selected'
                        : 'border-brand-border bg-brand-surface',
                    )}>
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        category === cat ? 'text-brand-primary' : 'text-brand-muted',
                      )}>
                      {categoryLabel(cat, copy)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <TextInput
              className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
              value={label}
              onChangeText={setLabel}
              placeholder={categoryLabel(category, copy)}
            />

            <Text className="mb-2 text-sm font-semibold text-brand-muted">{copy.budgetAmount}</Text>
            <TextInput
              className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
              value={amountText}
              onChangeText={setAmountText}
              placeholder="28000"
              keyboardType="number-pad"
            />

            <Text className="mb-2 text-sm font-semibold text-brand-muted">{copy.budgetMemo}</Text>
            <TextInput
              className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
              value={memo}
              onChangeText={setMemo}
              placeholder={copy.budgetMemoPlaceholder}
              multiline
            />

            <Pressable
              onPress={handleOcr}
              className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-border bg-brand-surface py-3 active:opacity-90">
              <Text className="text-base">📷</Text>
              <View>
                <Text className="text-sm font-bold text-brand-text">{copy.budgetOcrScan}</Text>
                <Text className="text-xs text-brand-muted">{copy.budgetOcrSoon}</Text>
              </View>
            </Pressable>
          </ScrollView>

          <View className="px-5 pt-2">
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className={cn(
                'mb-2 items-center rounded-2xl py-3.5 active:opacity-90',
                canSave ? 'bg-brand-primary' : 'bg-brand-border',
              )}>
              <Text
                className={cn(
                  'text-[15px] font-bold',
                  canSave ? 'text-white' : 'text-brand-muted',
                )}>
                {copy.budgetSave}
              </Text>
            </Pressable>
            <Pressable onPress={onClose} className="items-center py-2 active:opacity-80">
              <Text className="text-sm font-semibold text-brand-muted">{copy.budgetCancel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '92%',
  },
});

export function budgetCategoryDisplay(
  category: BudgetCategory,
  copy: Copy,
): string {
  return categoryLabel(category, copy);
}

export function memberNickname(members: PlanMember[], userId: string): string {
  return members.find(m => m.userId === userId)?.nickname ?? userId;
}

export function splitSummary(
  entry: BudgetEntry,
  members: PlanMember[],
  copy: Copy,
): string {
  const names = entry.splitWithUserIds
    .map(id => memberNickname(members, id))
    .join(', ');
  if (entry.splitWithUserIds.length === members.length) {
    return copy.budgetSplitAll;
  }
  return names || memberNickname(members, entry.paidByUserId);
}
