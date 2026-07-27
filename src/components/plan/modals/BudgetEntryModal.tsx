import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { BudgetCategory, BudgetEntry, PlanMember } from '../../../types/travelPlan';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { cn } from '../../../utils/common/cn';
import { AppIcon } from '../../shared/icons/AppIcon';
import { AppModal, AppModalPrimaryFooter, useAppAlert } from '../../shared/modals';

type Copy = CopyFor<'planDetail'>;

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
  language: _language,
  members,
  defaultDate,
  planId,
  onClose,
  onSave,
}: BudgetEntryModalProps) {
  const { alert } = useAppAlert();
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
    alert({ title: copy.budgetOcrScan, message: copy.budgetOcrSoon });
  };

  const handleSave = () => {
    const amount = parseInt(amountText.replace(/[^0-9]/g, ''), 10);
    const trimmedLabel = category === 'other' ? label.trim() : categoryLabel(category, copy);
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
  const labelOk = category === 'other' ? !!label.trim() : true;
  const canSave = labelOk && !!amount && amount > 0 && !!paidByUserId;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={copy.budgetAdd}
      maxHeight="92%"
      keyboardAware
      footer={
        <AppModalPrimaryFooter
          confirmLabel={copy.budgetSave}
          onConfirm={handleSave}
          confirmDisabled={!canSave}
          cancelLabel={copy.budgetCancel}
          onCancel={onClose}
        />
      }>
      <ScrollView
        className="max-h-[78%] px-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
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
                <View className="flex-row items-center gap-1">
                  {selected ? (
                    <AppIcon name="check" size={12} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
                  ) : null}
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      selected ? 'text-brand-primary' : 'text-brand-muted',
                    )}>
                    {m.nickname}
                  </Text>
                </View>
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
                onPress={() => {
                  setCategory(cat);
                  if (cat !== 'other') {
                    setLabel('');
                  }
                }}
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
        {category === 'other' ? (
          <TextInput
            className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
            value={label}
            onChangeText={setLabel}
            placeholder={copy.budgetCategoryOther}
          />
        ) : null}

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
          <AppIcon name="camera" size={20} color={ICON_COLOR_PRIMARY} />
          <View>
            <Text className="text-sm font-bold text-brand-text">{copy.budgetOcrScan}</Text>
            <Text className="text-xs text-brand-muted">{copy.budgetOcrSoon}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </AppModal>
  );
}

export function budgetCategoryDisplay(category: BudgetCategory, copy: Copy): string {
  return categoryLabel(category, copy);
}

export function memberNickname(members: PlanMember[], userId: string): string {
  return members.find(m => m.userId === userId)?.nickname ?? userId;
}

export function splitSummary(entry: BudgetEntry, members: PlanMember[], copy: Copy): string {
  const names = entry.splitWithUserIds.map(id => memberNickname(members, id)).join(', ');
  if (entry.splitWithUserIds.length === members.length) {
    return copy.budgetSplitAll;
  }
  return names || memberNickname(members, entry.paidByUserId);
}
