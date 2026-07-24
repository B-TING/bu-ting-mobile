import type {
  TravelExpenseMemberSummary,
  TravelSettlementTransfer,
} from '../../types/travelApi';
import type { BudgetEntry, PlanMember } from '../../types/travelPlan';

/** 서버 균등 분할과 같이 나머지를 앞 참여자부터 +1 */
function equalShareAmounts(total: number, participantCount: number): number[] {
  if (participantCount <= 0) {
    return [];
  }
  const base = Math.floor(total / participantCount);
  const remainder = total - base * participantCount;
  return Array.from({ length: participantCount }, (_, index) =>
    index < remainder ? base + 1 : base,
  );
}

/**
 * 등록된 경비로 멤버별 결제/부담/잔액을 계산합니다.
 * 요약 API가 비어 있거나 실패했을 때 정산 미리보기 fallback으로 사용합니다.
 */
export function buildMemberSummariesFromBudgetEntries(
  entries: BudgetEntry[],
  members: PlanMember[],
): TravelExpenseMemberSummary[] {
  if (entries.length === 0) {
    return [];
  }

  const byId = new Map<
    string,
    { memberId: string; nickname: string; paidAmount: number; shareAmount: number }
  >();

  const ensure = (userId: string, nickname?: string) => {
    const existing = byId.get(userId);
    if (existing) {
      if (nickname && existing.nickname === userId) {
        existing.nickname = nickname;
      }
      return existing;
    }
    const created = {
      memberId: userId,
      nickname: nickname ?? members.find(m => m.userId === userId)?.nickname ?? userId,
      paidAmount: 0,
      shareAmount: 0,
    };
    byId.set(userId, created);
    return created;
  };

  for (const member of members) {
    ensure(member.userId, member.nickname);
  }

  for (const entry of entries) {
    const payer = ensure(entry.paidByUserId);
    payer.paidAmount += entry.amount;

    const participantIds =
      entry.splitWithUserIds.length > 0 ? entry.splitWithUserIds : [entry.paidByUserId];
    const shares = equalShareAmounts(entry.amount, participantIds.length);
    participantIds.forEach((userId, index) => {
      const row = ensure(userId);
      row.shareAmount += shares[index] ?? 0;
    });
  }

  return [...byId.values()]
    .filter(row => row.paidAmount > 0 || row.shareAmount > 0)
    .map(row => ({
      memberId: row.memberId,
      nickname: row.nickname,
      paidAmount: row.paidAmount,
      shareAmount: row.shareAmount,
      balance: row.paidAmount - row.shareAmount,
    }))
    .sort((a, b) => b.balance - a.balance || a.nickname.localeCompare(b.nickname));
}

/** 잔액에서 간단한 송금 목록을 만듭니다 (미리보기용). */
export function buildTransfersFromMemberSummaries(
  members: TravelExpenseMemberSummary[],
  currency = 'KRW',
): TravelSettlementTransfer[] {
  const debtors = members
    .filter(member => member.balance < 0)
    .map(member => ({
      id: member.memberId,
      nickname: member.nickname,
      amount: -member.balance,
    }));
  const creditors = members
    .filter(member => member.balance > 0)
    .map(member => ({
      id: member.memberId,
      nickname: member.nickname,
      amount: member.balance,
    }));

  const transfers: TravelSettlementTransfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0) {
      transfers.push({
        currency,
        senderId: debtors[i].id,
        senderNickname: debtors[i].nickname,
        receiverId: creditors[j].id,
        receiverNickname: creditors[j].nickname,
        amount: pay,
      });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount === 0) {
      i += 1;
    }
    if (creditors[j].amount === 0) {
      j += 1;
    }
  }

  return transfers;
}

export function pickCurrencyMemberSummaries(
  currencySummaries:
    | {
        currency?: string;
        memberSummaries?: TravelExpenseMemberSummary[] | null;
      }[]
    | null
    | undefined,
): TravelExpenseMemberSummary[] {
  if (!currencySummaries?.length) {
    return [];
  }
  const preferred =
    currencySummaries.find(item => (item.currency ?? '').toUpperCase() === 'KRW') ??
    currencySummaries[0];
  return preferred.memberSummaries ?? [];
}
