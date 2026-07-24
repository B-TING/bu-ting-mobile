import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ICON_COLOR_PRIMARY, ICON_COLOR_WHITE } from '../../../constants/icons';
import type { CopyFor } from '../../../i18n';
import type {
  TravelExpenseMemberSummary,
  TravelSettlementResponse,
  TravelSettlementTransfer,
} from '../../../types/travelApi';
import { AppIcon } from '../../shared/icons/AppIcon';

type Copy = CopyFor<'planDetail'>;

type BudgetSettlementSectionProps = {
  copy: Copy;
  settlement: TravelSettlementResponse | null;
  memberSummaries: TravelExpenseMemberSummary[];
  loading?: boolean;
  error?: string | null;
  canConfirm?: boolean;
  confirming?: boolean;
  onConfirm?: () => void;
  onRetry?: () => void;
};

function formatConfirmedAt(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.length >= 16 ? value.slice(0, 16).replace('T', ' ') : value;
}

function balanceLabel(balance: number, copy: Copy): string {
  if (balance > 0) {
    return copy.budgetSettlementReceive;
  }
  if (balance < 0) {
    return copy.budgetSettlementOwe;
  }
  return copy.budgetSettlementEven;
}

function balanceAmountClass(balance: number): string {
  if (balance > 0) {
    return 'text-brand-primary';
  }
  if (balance < 0) {
    return 'text-red-600';
  }
  return 'text-brand-muted';
}

function MemberBalanceRow({
  member,
  copy,
}: {
  member: TravelExpenseMemberSummary;
  copy: Copy;
}) {
  return (
    <View className="border-b border-brand-border/50 py-2.5 last:border-b-0">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-brand-text">{member.nickname}</Text>
        <Text className={`text-sm font-bold ${balanceAmountClass(member.balance)}`}>
          {member.balance === 0
            ? '₩0'
            : `${member.balance > 0 ? '+' : '-'}₩${Math.abs(member.balance).toLocaleString()}`}
        </Text>
      </View>
      <View className="mt-1 flex-row flex-wrap gap-x-3 gap-y-0.5">
        <Text className="text-[11px] text-brand-muted">
          {copy.budgetSettlementPaid} ₩{member.paidAmount.toLocaleString()}
        </Text>
        <Text className="text-[11px] text-brand-muted">
          {copy.budgetSettlementShare} ₩{member.shareAmount.toLocaleString()}
        </Text>
        <Text className="text-[11px] text-brand-muted">{balanceLabel(member.balance, copy)}</Text>
      </View>
    </View>
  );
}

function TransferRow({
  transfer,
  copy,
}: {
  transfer: TravelSettlementTransfer;
  copy: Copy;
}) {
  return (
    <View className="flex-row items-center border-b border-brand-border/50 py-2.5 last:border-b-0">
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-brand-text">
          {copy.budgetSettlementTransfer(transfer.senderNickname, transfer.receiverNickname)}
        </Text>
        {transfer.currency && transfer.currency !== 'KRW' ? (
          <Text className="mt-0.5 text-[11px] text-brand-muted">{transfer.currency}</Text>
        ) : null}
      </View>
      <Text className="ml-2 text-sm font-bold text-brand-text">
        ₩{transfer.amount.toLocaleString()}
      </Text>
    </View>
  );
}

export function BudgetSettlementSection({
  copy,
  settlement,
  memberSummaries,
  loading = false,
  error = null,
  canConfirm = false,
  confirming = false,
  onConfirm,
  onRetry,
}: BudgetSettlementSectionProps) {
  const confirmed = settlement?.confirmed === true;
  const transfers = settlement?.transfers ?? [];
  const hasBalances = memberSummaries.length > 0;
  const hasTransfers = transfers.length > 0;
  const empty = !loading && !error && !hasBalances && !hasTransfers;
  const showInitialLoading = loading && !hasBalances && !hasTransfers && !settlement;

  return (
    <View className="mt-4 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
      <View className="flex-row items-start justify-between border-b border-brand-border px-4 py-3">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-bold text-brand-text">{copy.budgetSettlementTitle}</Text>
          <Text className="mt-0.5 text-xs text-brand-muted">
            {confirmed
              ? copy.budgetSettlementConfirmedAt(formatConfirmedAt(settlement?.confirmedAt))
              : copy.budgetSettlementPreview}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {loading && !showInitialLoading ? (
            <ActivityIndicator color={ICON_COLOR_PRIMARY} size="small" />
          ) : null}
          <View
            className={`rounded-full px-2.5 py-1 ${
              confirmed ? 'bg-brand-selected' : 'bg-brand-background'
            }`}>
            <Text
              className={`text-[10px] font-bold ${
                confirmed ? 'text-brand-primary' : 'text-brand-muted'
              }`}>
              {confirmed ? copy.budgetSettlementConfirmed : copy.budgetSettlementPreviewBadge}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 py-3">
        {showInitialLoading ? (
          <View className="items-center py-4">
            <ActivityIndicator color={ICON_COLOR_PRIMARY} />
            <Text className="mt-2 text-xs text-brand-muted">{copy.budgetSettlementLoading}</Text>
          </View>
        ) : null}

        {!showInitialLoading && error && !hasBalances && !hasTransfers ? (
          <View className="items-center py-3">
            <Text className="text-center text-sm text-brand-muted">{copy.budgetSettlementError}</Text>
            {onRetry ? (
              <Pressable
                onPress={onRetry}
                className="mt-3 rounded-xl border border-brand-border bg-brand-background px-3 py-2 active:opacity-90">
                <Text className="text-xs font-bold text-brand-primary">{copy.inviteRetry}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!showInitialLoading && empty ? (
          <Text className="py-2 text-center text-sm text-brand-muted">
            {copy.budgetSettlementEmpty}
          </Text>
        ) : null}

        {!showInitialLoading && hasBalances ? (
          <View className="mb-3">
            <Text className="mb-1 text-[10px] font-bold uppercase text-brand-muted">
              {copy.budgetSettlementBalances}
            </Text>
            {memberSummaries.map(member => (
              <MemberBalanceRow key={member.memberId} member={member} copy={copy} />
            ))}
          </View>
        ) : null}

        {!showInitialLoading && hasTransfers ? (
          <View>
            <Text className="mb-1 text-[10px] font-bold uppercase text-brand-muted">
              {copy.budgetSettlementTransfers}
            </Text>
            {transfers.map((transfer, index) => (
              <TransferRow
                key={`${transfer.senderId}-${transfer.receiverId}-${transfer.currency}-${index}`}
                transfer={transfer}
                copy={copy}
              />
            ))}
          </View>
        ) : null}

        {!showInitialLoading && !hasTransfers && hasBalances ? (
          <Text className="mt-1 text-center text-xs text-brand-muted">
            {copy.budgetSettlementNoTransfers}
          </Text>
        ) : null}

        {confirmed ? (
          <View className="mt-3 flex-row items-center gap-1.5 rounded-xl bg-brand-selected/60 px-3 py-2">
            <AppIcon name="checkCircle" size={14} color={ICON_COLOR_PRIMARY} />
            <Text className="flex-1 text-xs font-semibold text-brand-primary">
              {copy.budgetSettlementLocked}
            </Text>
          </View>
        ) : null}

        {!confirmed && canConfirm && onConfirm ? (
          <Pressable
            onPress={onConfirm}
            disabled={confirming || empty || loading}
            className={`mt-3 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90 ${
              confirming || empty || loading ? 'opacity-50' : ''
            }`}>
            <View className="flex-row items-center gap-1.5">
              {confirming ? (
                <ActivityIndicator color={ICON_COLOR_WHITE} size="small" />
              ) : (
                <AppIcon name="check" size={14} color={ICON_COLOR_WHITE} strokeWidth={2.5} />
              )}
              <Text className="font-bold text-white">{copy.budgetSettlementConfirm}</Text>
            </View>
          </Pressable>
        ) : null}

        {!confirmed && !canConfirm && settlement ? (
          <Text className="mt-3 text-center text-[11px] text-brand-muted">
            {copy.budgetSettlementLeaderOnly}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
