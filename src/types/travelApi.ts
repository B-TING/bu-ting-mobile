import type { PlanWizardAnswers } from './planWizard';

/** 백엔드 Travel API DTO (OpenAPI 0.0.1) */

export type TravelStatusDto = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export type TravelStyleDto = 'TOURISM' | 'REST' | 'FOOD' | 'ACTIVITY' | 'SHOPPING';

export type TravelPaceDto = 'RELAXED' | 'BALANCED' | 'TIGHT';

export type CompanionTypeDto = 'SOLO' | 'FRIEND' | 'COUPLE' | 'FAMILY' | 'GROUP';

export type PlaceProviderDto = 'KAKAO' | 'NAVER' | 'GOOGLE';

export type TravelCreateRequest = {
  title?: string | null;
  startDate: string;
  endDate: string;
  hasHeavyBaggage?: boolean | null;
  hasPets?: boolean | null;
  travelStyle?: TravelStyleDto | null;
  preferFlatTerrain?: boolean | null;
  pace?: TravelPaceDto | null;
  companionCount?: number | null;
  preferredFoods?: string | null;
  companionTypes?: CompanionTypeDto | null;
  accommodationArea?: string | null;
};

export type TravelResponse = TravelCreateRequest & {
  id: string;
  status: TravelStatusDto;
  createdAt?: string | null;
};

export type TravelStatusUpdateRequest = {
  status: TravelStatusDto;
};

export type TravelTeamRoleDto = 'LEADER' | 'MEMBER';

export type MyTravelResponse = {
  travelId: string;
  title?: string | null;
  startDate: string;
  endDate: string;
  status: TravelStatusDto;
  role: TravelTeamRoleDto;
  createdAt?: string | null;
};

export type TravelMemberResponse = {
  memberId: string;
  userId: string;
  email?: string | null;
  nickname: string;
  profileImageUrl?: string | null;
  role: TravelTeamRoleDto;
};

export type TravelInviteLinkResponse = {
  inviteLink: string;
};

export type TravelInviteLinkInfoResponse = {
  inviteLink: string;
  expiredAt?: string | null;
};

export type PlanCreateRequest = {
  dayNumber: number;
  visitDate: string;
};

export type PlanResponse = {
  planId: string;
  travelId: string;
  dayNumber: number;
  visitDate: string;
};

export type PlanPlaceCreateRequest = {
  sequence?: number | null;
  placeName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  provider: PlaceProviderDto;
  providerPlaceId: string;
  durationMinutes?: number | null;
  memo?: string | null;
  scheduledTime?: string | null;
  visited?: boolean | null;
};

export type PlanPlaceResponse = PlanPlaceCreateRequest & {
  planPlaceId: string;
  planId: string;
  sequence: number;
};

export type TravelPlansResponse = {
  travelId: string;
  title?: string | null;
  days: TravelPlanDayDto[];
};

export type TravelPlanDayDto = {
  planId: string;
  dayNumber: number;
  visitDate: string;
  places: TravelPlanPlaceDto[];
};

export type PlanPlaceUpdateRequest = {
  memo?: string | null;
  durationMinutes?: number | null;
  scheduledTime?: string | null;
  visited?: boolean | null;
};

export type PlanPlaceUpdatePlaceRequest = {
  placeName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  provider: PlaceProviderDto;
  providerPlaceId: string;
};

export type TravelPlanPlaceDto = {
  planPlaceId: string;
  sequence: number;
  placeName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  provider: PlaceProviderDto;
  providerPlaceId: string;
  durationMinutes?: number | null;
  memo?: string | null;
  visited?: boolean | null;
  routeToNext?: {
    transportType?: string;
    durationMinutes?: number | null;
    distanceMeters?: number | null;
  } | null;
};

export type PlanPlaceSequenceUpdateRequest = {
  planPlaceIds: string[];
};

/** 위저드 답변에서 API 요청으로 변환할 때 사용 */
export type ManualTravelInput = Pick<
  PlanWizardAnswers,
  | 'startDate'
  | 'endDate'
  | 'companionCount'
  | 'companionTypes'
  | 'hasHeavyBaggage'
  | 'hasPets'
  | 'travelStyleIds'
  | 'foodIds'
  | 'accommodationAreaIds'
  | 'accommodationName'
>;

/** 여행 가계부 (TravelExpense) API DTO */

export type ExpenseCategoryDto =
  | 'FOOD'
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'ACTIVITY'
  | 'SHOPPING'
  | 'ETC';

export type ExpenseSplitTypeDto = 'EQUAL' | 'CUSTOM';

export type TravelExpenseCreateRequest = {
  title: string;
  amount: number;
  currency?: string;
  category: ExpenseCategoryDto;
  payerId: string;
  participantIds: string[];
  spentAt: string;
  memo?: string | null;
};

export type TravelExpenseUpdateRequest = TravelExpenseCreateRequest;

export type TravelExpenseShareResponse = {
  participantId: string;
  shareAmount: number;
};

export type TravelExpenseUserSummary = {
  userId: string;
  nickname: string;
};

export type TravelExpenseShareDetail = {
  participantId: string;
  nickname: string;
  shareAmount: number;
};

export type TravelExpenseCreateResponse = {
  expenseId: string;
  travelId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryDto;
  payerId: string;
  creatorId: string;
  splitType: ExpenseSplitTypeDto;
  spentAt: string;
  memo?: string | null;
  shares: TravelExpenseShareResponse[];
};

export type TravelExpenseListItem = {
  expenseId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryDto;
  payer: TravelExpenseUserSummary;
  participantCount: number;
  spentAt: string;
  createdAt?: string;
};

export type TravelExpenseListResponse = {
  content: TravelExpenseListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type TravelExpenseDetailResponse = {
  expenseId: string;
  travelId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryDto;
  payer: TravelExpenseUserSummary;
  createdBy: TravelExpenseUserSummary;
  splitType: ExpenseSplitTypeDto;
  spentAt: string;
  memo?: string | null;
  shares: TravelExpenseShareDetail[];
  editable: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TravelExpenseCategorySummary = {
  category: ExpenseCategoryDto;
  amount: number;
  expenseCount: number;
  ratio: number;
};

export type TravelExpenseMemberSummary = {
  memberId: string;
  nickname: string;
  paidAmount: number;
  shareAmount: number;
  balance: number;
};

export type TravelExpenseCurrencySummary = {
  currency: string;
  totalAmount: number;
  categorySummaries: TravelExpenseCategorySummary[];
  memberSummaries: TravelExpenseMemberSummary[];
};

export type TravelExpenseSummaryResponse = {
  travelId: string;
  expenseCount: number;
  currencySummaries: TravelExpenseCurrencySummary[];
  from?: string | null;
  to?: string | null;
};

export type TravelSettlementTransfer = {
  currency: string;
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  amount: number;
};

export type TravelSettlementResponse = {
  travelId: string;
  confirmed: boolean;
  confirmedById?: string | null;
  confirmedAt?: string | null;
  transfers: TravelSettlementTransfer[];
};

export type TravelExpenseListQuery = {
  category?: ExpenseCategoryDto;
  from?: string;
  to?: string;
  payerId?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type TravelExpenseSummaryQuery = {
  from?: string;
  to?: string;
};
