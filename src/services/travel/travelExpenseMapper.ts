import type {
  ExpenseCategoryDto,
  TravelExpenseCreateRequest,
  TravelExpenseCreateResponse,
  TravelExpenseDetailResponse,
  TravelExpenseListItem,
} from '../../types/travelApi';
import type { BudgetCategory, BudgetEntry } from '../../types/travelPlan';

const CATEGORY_TO_DTO: Record<BudgetCategory, ExpenseCategoryDto> = {
  food: 'FOOD',
  transport: 'TRANSPORT',
  accommodation: 'ACCOMMODATION',
  entertainment: 'ACTIVITY',
  shopping: 'SHOPPING',
  other: 'ETC',
};

const DTO_TO_CATEGORY: Record<ExpenseCategoryDto, BudgetCategory> = {
  FOOD: 'food',
  TRANSPORT: 'transport',
  ACCOMMODATION: 'accommodation',
  ACTIVITY: 'entertainment',
  SHOPPING: 'shopping',
  ETC: 'other',
};

export function budgetCategoryToExpenseDto(category: BudgetCategory): ExpenseCategoryDto {
  return CATEGORY_TO_DTO[category] ?? 'ETC';
}

export function expenseDtoToBudgetCategory(category: ExpenseCategoryDto): BudgetCategory {
  return DTO_TO_CATEGORY[category] ?? 'other';
}

/** UI 날짜(YYYY-MM-DD) → API spentAt */
export function budgetDateToSpentAt(date: string): string {
  const trimmed = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T12:00:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}T12:00:00`;
}

/** API spentAt → UI 날짜(YYYY-MM-DD) */
export function spentAtToBudgetDate(spentAt: string): string {
  if (!spentAt) {
    return '';
  }
  return spentAt.length >= 10 ? spentAt.slice(0, 10) : spentAt;
}

export function budgetEntryToCreateRequest(
  entry: Pick<
    BudgetEntry,
    'label' | 'amount' | 'category' | 'paidByUserId' | 'splitWithUserIds' | 'date' | 'memo'
  >,
): TravelExpenseCreateRequest {
  const participantIds =
    entry.splitWithUserIds.length > 0 ? entry.splitWithUserIds : [entry.paidByUserId];

  return {
    title: entry.label.slice(0, 50),
    amount: Math.max(1, Math.round(entry.amount)),
    currency: 'KRW',
    category: budgetCategoryToExpenseDto(entry.category),
    payerId: entry.paidByUserId,
    participantIds,
    spentAt: budgetDateToSpentAt(entry.date),
    memo: entry.memo?.trim() || null,
  };
}

function mapCurrency(currency: string | undefined): BudgetEntry['currency'] {
  return currency === 'KRW' || !currency ? 'KRW' : 'KRW';
}

export function expenseListItemToBudgetEntry(
  item: TravelExpenseListItem,
  planId: string,
): BudgetEntry {
  return {
    entryId: item.expenseId,
    planId,
    label: item.title,
    category: expenseDtoToBudgetCategory(item.category),
    amount: item.amount,
    currency: mapCurrency(item.currency),
    date: spentAtToBudgetDate(item.spentAt),
    paidByUserId: item.payer?.userId ?? '',
    splitWithUserIds: item.payer?.userId ? [item.payer.userId] : [],
  };
}

export function expenseDetailToBudgetEntry(
  detail: TravelExpenseDetailResponse,
  planId: string,
): BudgetEntry {
  const shareIds = (detail.shares ?? []).map(share => share.participantId).filter(Boolean);
  return {
    entryId: detail.expenseId,
    planId,
    label: detail.title,
    category: expenseDtoToBudgetCategory(detail.category),
    amount: detail.amount,
    currency: mapCurrency(detail.currency),
    date: spentAtToBudgetDate(detail.spentAt),
    paidByUserId: detail.payer?.userId ?? '',
    splitWithUserIds:
      shareIds.length > 0
        ? shareIds
        : detail.payer?.userId
          ? [detail.payer.userId]
          : [],
    memo: detail.memo?.trim() || undefined,
  };
}

export function expenseCreateResponseToBudgetEntry(
  response: TravelExpenseCreateResponse,
  planId: string,
  fallbackParticipantIds: string[],
): BudgetEntry {
  const shareIds = (response.shares ?? []).map(share => share.participantId).filter(Boolean);
  return {
    entryId: response.expenseId,
    planId,
    label: response.title,
    category: expenseDtoToBudgetCategory(response.category),
    amount: response.amount,
    currency: mapCurrency(response.currency),
    date: spentAtToBudgetDate(response.spentAt),
    paidByUserId: response.payerId,
    splitWithUserIds:
      shareIds.length > 0
        ? shareIds
        : fallbackParticipantIds.length > 0
          ? fallbackParticipantIds
          : [response.payerId],
    memo: response.memo?.trim() || undefined,
  };
}
