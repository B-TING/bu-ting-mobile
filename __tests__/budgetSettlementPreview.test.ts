import {
  buildMemberSummariesFromBudgetEntries,
  buildTransfersFromMemberSummaries,
  pickCurrencyMemberSummaries,
} from '../src/utils/plan/budgetSettlementPreview';
import type { BudgetEntry, PlanMember } from '../src/types/travelPlan';

const members: PlanMember[] = [
  { userId: 'u1', nickname: '방장', role: 'LEADER' },
  { userId: 'u2', nickname: '민지', role: 'MEMBER' },
];

function entry(
  partial: Partial<BudgetEntry> &
    Pick<BudgetEntry, 'entryId' | 'label' | 'category' | 'amount' | 'paidByUserId'>,
): BudgetEntry {
  return {
    planId: 'plan-1',
    currency: 'KRW',
    date: '2026-08-01',
    splitWithUserIds: ['u1', 'u2'],
    ...partial,
  };
}

describe('budgetSettlementPreview', () => {
  it('builds member balances from equal-split expenses', () => {
    const entries = [
      entry({
        entryId: '1',
        label: '쇼핑',
        category: 'shopping',
        amount: 50000,
        paidByUserId: 'u1',
      }),
      entry({
        entryId: '2',
        label: '교통',
        category: 'transport',
        amount: 20000,
        paidByUserId: 'u1',
      }),
      entry({
        entryId: '3',
        label: '체험',
        category: 'entertainment',
        amount: 10000,
        paidByUserId: 'u1',
      }),
    ];

    const summaries = buildMemberSummariesFromBudgetEntries(entries, members);
    const leader = summaries.find(row => row.memberId === 'u1');
    const mate = summaries.find(row => row.memberId === 'u2');

    expect(leader?.paidAmount).toBe(80000);
    expect(leader?.shareAmount).toBe(40000);
    expect(leader?.balance).toBe(40000);
    expect(mate?.paidAmount).toBe(0);
    expect(mate?.shareAmount).toBe(40000);
    expect(mate?.balance).toBe(-40000);
  });

  it('builds transfers from balances', () => {
    const transfers = buildTransfersFromMemberSummaries([
      {
        memberId: 'u1',
        nickname: '방장',
        paidAmount: 80000,
        shareAmount: 40000,
        balance: 40000,
      },
      {
        memberId: 'u2',
        nickname: '민지',
        paidAmount: 0,
        shareAmount: 40000,
        balance: -40000,
      },
    ]);

    expect(transfers).toEqual([
      {
        currency: 'KRW',
        senderId: 'u2',
        senderNickname: '민지',
        receiverId: 'u1',
        receiverNickname: '방장',
        amount: 40000,
      },
    ]);
  });

  it('prefers KRW member summaries', () => {
    const rows = pickCurrencyMemberSummaries([
      {
        currency: 'USD',
        memberSummaries: [
          {
            memberId: 'u1',
            nickname: 'A',
            paidAmount: 1,
            shareAmount: 1,
            balance: 0,
          },
        ],
      },
      {
        currency: 'KRW',
        memberSummaries: [
          {
            memberId: 'u2',
            nickname: 'B',
            paidAmount: 2,
            shareAmount: 2,
            balance: 0,
          },
        ],
      },
    ]);

    expect(rows[0].memberId).toBe('u2');
  });
});
