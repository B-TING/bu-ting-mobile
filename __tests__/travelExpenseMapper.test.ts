import {
  budgetCategoryToExpenseDto,
  budgetDateToSpentAt,
  budgetEntryToCreateRequest,
  expenseCreateResponseToBudgetEntry,
  expenseDetailToBudgetEntry,
  expenseDtoToBudgetCategory,
  expenseListItemToBudgetEntry,
  spentAtToBudgetDate,
} from '../src/services/travel/travelExpenseMapper';
import type {
  TravelExpenseCreateResponse,
  TravelExpenseDetailResponse,
  TravelExpenseListItem,
} from '../src/types/travelApi';
import {
  buildBudgetDateTabs,
  getCategoryBreakdownRows,
  sumBudgetByCategory,
  sumBudgetForDate,
} from '../src/utils/plan/budgetTotals';
import type { BudgetEntry } from '../src/types/travelPlan';

describe('travelExpenseMapper', () => {
  describe('category mapping', () => {
    it('maps UI categories to API DTOs', () => {
      expect(budgetCategoryToExpenseDto('food')).toBe('FOOD');
      expect(budgetCategoryToExpenseDto('transport')).toBe('TRANSPORT');
      expect(budgetCategoryToExpenseDto('accommodation')).toBe('ACCOMMODATION');
      expect(budgetCategoryToExpenseDto('entertainment')).toBe('ACTIVITY');
      expect(budgetCategoryToExpenseDto('shopping')).toBe('SHOPPING');
      expect(budgetCategoryToExpenseDto('other')).toBe('ETC');
    });

    it('maps API DTOs back to UI categories', () => {
      expect(expenseDtoToBudgetCategory('FOOD')).toBe('food');
      expect(expenseDtoToBudgetCategory('ACTIVITY')).toBe('entertainment');
      expect(expenseDtoToBudgetCategory('ETC')).toBe('other');
    });
  });

  describe('date conversion', () => {
    it('converts YYYY-MM-DD to spentAt noon', () => {
      expect(budgetDateToSpentAt('2026-08-01')).toBe('2026-08-01T12:00:00');
    });

    it('keeps existing date-time spentAt', () => {
      expect(budgetDateToSpentAt('2026-08-01T19:30:00')).toBe('2026-08-01T19:30:00');
    });

    it('extracts date from spentAt', () => {
      expect(spentAtToBudgetDate('2026-08-01T19:30:00')).toBe('2026-08-01');
      expect(spentAtToBudgetDate('')).toBe('');
    });
  });

  describe('budgetEntryToCreateRequest', () => {
    it('builds equal-split create payload', () => {
      const request = budgetEntryToCreateRequest({
        label: '광안리 저녁 식사',
        amount: 60000,
        category: 'food',
        paidByUserId: 'payer-1',
        splitWithUserIds: ['payer-1', 'member-2', 'member-3'],
        date: '2026-08-01',
        memo: ' 회비로 결제 ',
      });

      expect(request).toEqual({
        title: '광안리 저녁 식사',
        amount: 60000,
        currency: 'KRW',
        category: 'FOOD',
        payerId: 'payer-1',
        participantIds: ['payer-1', 'member-2', 'member-3'],
        spentAt: '2026-08-01T12:00:00',
        memo: '회비로 결제',
      });
    });

    it('falls back participant to payer when split list is empty', () => {
      const request = budgetEntryToCreateRequest({
        label: '택시',
        amount: 12000.6,
        category: 'transport',
        paidByUserId: 'payer-1',
        splitWithUserIds: [],
        date: '2026-08-02',
      });

      expect(request.amount).toBe(12001);
      expect(request.participantIds).toEqual(['payer-1']);
      expect(request.memo).toBeNull();
    });

    it('truncates title to 50 characters', () => {
      const longLabel = '가'.repeat(60);
      const request = budgetEntryToCreateRequest({
        label: longLabel,
        amount: 1000,
        category: 'other',
        paidByUserId: 'payer-1',
        splitWithUserIds: ['payer-1'],
        date: '2026-08-01',
      });

      expect(request.title).toHaveLength(50);
    });
  });

  describe('response → BudgetEntry', () => {
    const planId = 'plan-1';

    it('maps list item with payer fallback split', () => {
      const item: TravelExpenseListItem = {
        expenseId: 'exp-1',
        title: '카페',
        amount: 9000,
        currency: 'KRW',
        category: 'FOOD',
        payer: { userId: 'u-1', nickname: '민지' },
        participantCount: 2,
        spentAt: '2026-08-01T10:00:00',
      };

      expect(expenseListItemToBudgetEntry(item, planId)).toEqual({
        entryId: 'exp-1',
        planId,
        label: '카페',
        category: 'food',
        amount: 9000,
        currency: 'KRW',
        date: '2026-08-01',
        paidByUserId: 'u-1',
        splitWithUserIds: ['u-1'],
      });
    });

    it('maps detail with share participants and memo', () => {
      const detail: TravelExpenseDetailResponse = {
        expenseId: 'exp-2',
        travelId: 'travel-1',
        title: '숙소',
        amount: 120000,
        currency: 'KRW',
        category: 'ACCOMMODATION',
        payer: { userId: 'u-1', nickname: '방장' },
        createdBy: { userId: 'u-1', nickname: '방장' },
        splitType: 'EQUAL',
        spentAt: '2026-08-02T15:00:00',
        memo: ' 에어비앤비 ',
        shares: [
          { participantId: 'u-1', nickname: '방장', shareAmount: 60000 },
          { participantId: 'u-2', nickname: '민지', shareAmount: 60000 },
        ],
        editable: true,
      };

      expect(expenseDetailToBudgetEntry(detail, planId)).toEqual({
        entryId: 'exp-2',
        planId,
        label: '숙소',
        category: 'accommodation',
        amount: 120000,
        currency: 'KRW',
        date: '2026-08-02',
        paidByUserId: 'u-1',
        splitWithUserIds: ['u-1', 'u-2'],
        memo: '에어비앤비',
      });
    });

    it('maps create response using shares or fallback participants', () => {
      const response: TravelExpenseCreateResponse = {
        expenseId: 'exp-3',
        travelId: 'travel-1',
        title: '공연',
        amount: 45000,
        currency: 'KRW',
        category: 'ACTIVITY',
        payerId: 'u-2',
        creatorId: 'u-2',
        splitType: 'EQUAL',
        spentAt: '2026-08-03T20:00:00',
        memo: null,
        shares: [],
      };

      expect(
        expenseCreateResponseToBudgetEntry(response, planId, ['u-1', 'u-2']),
      ).toEqual({
        entryId: 'exp-3',
        planId,
        label: '공연',
        category: 'entertainment',
        amount: 45000,
        currency: 'KRW',
        date: '2026-08-03',
        paidByUserId: 'u-2',
        splitWithUserIds: ['u-1', 'u-2'],
        memo: undefined,
      });
    });
  });
});

describe('budgetTotals', () => {
  const entries: BudgetEntry[] = [
    {
      entryId: '1',
      planId: 'p',
      label: '식사',
      category: 'food',
      amount: 10000,
      currency: 'KRW',
      date: '2026-08-01',
      paidByUserId: 'u1',
      splitWithUserIds: ['u1'],
    },
    {
      entryId: '2',
      planId: 'p',
      label: '택시',
      category: 'transport',
      amount: 5000,
      currency: 'KRW',
      date: '2026-08-01',
      paidByUserId: 'u1',
      splitWithUserIds: ['u1'],
    },
    {
      entryId: '3',
      planId: 'p',
      label: '기념품',
      category: 'other',
      amount: 3000,
      currency: 'KRW',
      date: '2026-08-05',
      paidByUserId: 'u1',
      splitWithUserIds: ['u1'],
    },
  ];

  it('sums amounts by category', () => {
    expect(sumBudgetByCategory(entries)).toEqual({
      food: 10000,
      shopping: 0,
      accommodation: 0,
      transport: 5000,
      entertainment: 0,
      other: 3000,
    });
  });

  it('includes other only when amount exists', () => {
    expect(getCategoryBreakdownRows(sumBudgetByCategory(entries))).toContain('other');
    expect(
      getCategoryBreakdownRows(
        sumBudgetByCategory(entries.filter(entry => entry.category !== 'other')),
      ),
    ).not.toContain('other');
  });

  it('builds date tabs with extras outside trip dates', () => {
    expect(buildBudgetDateTabs(['2026-08-01', '2026-08-02'], entries)).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-05',
    ]);
  });

  it('sums amount for a selected date', () => {
    expect(sumBudgetForDate(entries, '2026-08-01')).toBe(15000);
    expect(sumBudgetForDate(entries, '2026-08-02')).toBe(0);
  });
});
