import { Alert, Pressable, Text, View } from 'react-native';

import { MemberList } from '../MemberList';
import { TabPreviewCard } from './TabPreviewCard';
import { TripPeriodCard } from './TripPeriodCard';
import type { PlanDetailTab } from '../../../constants/planDetail';
import type { PLAN_DETAIL_COPY } from '../../../constants/planDetail';
import type { AppLanguage } from '../../../types/user';
import type { BudgetEntry, TravelPlan } from '../../../types/travelPlan';
import {
  representativeRoute,
  sortedRoutes,
  totalPlaceCount,
} from '../../../utils/planItinerary';
import { formatWeekdayDate } from '../../../utils/geo';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type PlanOverviewTabProps = {
  plan: TravelPlan;
  language: AppLanguage;
  copy: Copy;
  roleLabels: Record<'OWNER' | 'EDITOR' | 'VIEWER', string>;
  budgetEntries: BudgetEntry[];
  budgetTotal: number;
  onNavigateToTab: (tab: PlanDetailTab) => void;
  recordsProgress?: { completed: number; total: number; allDone: boolean };
  isTraveloguePublished?: boolean;
};

export function PlanOverviewTab({
  plan,
  language,
  copy,
  roleLabels,
  budgetEntries,
  budgetTotal,
  onNavigateToTab,
  recordsProgress,
  isTraveloguePublished,
}: PlanOverviewTabProps) {
  const placeCount = totalPlaceCount(plan.itinerary);

  const handleInvite = () => {
    Alert.alert(
      copy.inviteMembers,
      language === 'ko'
        ? '초대 링크 공유 기능은 곧 제공됩니다.'
        : 'Invite link sharing is coming soon.',
    );
  };

  return (
    <View className="px-4 pb-8">
      <TripPeriodCard
        startDate={plan.startDate}
        endDate={plan.endDate}
        language={language}
        periodLabel={copy.tripPeriod}
        nightsLabel={copy.nights}
      />

      <MemberList
        members={plan.members}
        title={copy.membersTitle}
        roleLabels={roleLabels}
        inviteLabel={copy.inviteMembers}
        onInvite={handleInvite}
      />

      <Text className="mb-3 text-base font-bold text-brand-text">
        {copy.dailyHighlights}
      </Text>
      {plan.itinerary.map(day => {
        const routes = sortedRoutes(day.routes);
        const rep = representativeRoute(day.routes);
        const extra = routes.length > 1 ? routes.length - 1 : 0;

        return (
          <Pressable
            key={day.dailyId}
            onPress={() => onNavigateToTab('schedule')}
            className="mb-2 flex-row items-center rounded-xl border border-brand-border bg-brand-surface px-3 py-3 active:opacity-90">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-primary">
              <Text className="text-sm font-bold text-white">{day.dayNumber}</Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xs text-brand-muted">
                {copy.dayLabel(day.dayNumber)} · {formatWeekdayDate(day.date, language)}
              </Text>
              <Text className="mt-0.5 text-base font-semibold text-brand-text" numberOfLines={1}>
                {rep?.placeName ?? copy.noRouteThatDay}
              </Text>
              {extra > 0 && rep && (
                <Text className="mt-0.5 text-xs text-brand-muted">{copy.morePlaces(extra)}</Text>
              )}
            </View>
            <Text className="text-xs font-semibold text-brand-primary">{copy.viewTab}</Text>
          </Pressable>
        );
      })}

      <View className="mt-4">
        <TabPreviewCard
          title={copy.schedulePreview}
          hint={copy.viewTab}
          onPress={() => onNavigateToTab('schedule')}>
          <Text className="text-sm text-brand-text">{copy.placesCount(placeCount)}</Text>
          <Text className="mt-1 text-xs text-brand-muted">
            {plan.itinerary.length}
            {language === 'ko' ? '일차 일정 · 탭하여 전체 보기' : ' · Tap for full schedule'}
          </Text>
        </TabPreviewCard>

        <TabPreviewCard
          title={copy.budgetPreview}
          hint={copy.viewTab}
          onPress={() => onNavigateToTab('budget')}>
          <Text className="text-xl font-bold text-brand-primary">
            ₩{budgetTotal.toLocaleString()}
          </Text>
          {budgetEntries.length === 0 ? (
            <Text className="mt-1 text-xs text-brand-muted">{copy.budgetEmpty}</Text>
          ) : (
            budgetEntries.slice(0, 2).map(e => (
              <View key={e.entryId} className="mt-2 flex-row justify-between">
                <Text className="text-sm text-brand-text">{e.label}</Text>
                <Text className="text-sm font-semibold text-brand-text">
                  ₩{e.amount.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </TabPreviewCard>

        <TabPreviewCard
          title={copy.recordsPreview}
          hint={copy.viewTab}
          onPress={() => onNavigateToTab('records')}>
          {isTraveloguePublished ? (
            <Text className="text-sm font-semibold text-brand-primary">
              {copy.recordsPublished}
            </Text>
          ) : recordsProgress && recordsProgress.total > 0 ? (
            <>
              <Text className="text-sm text-brand-text">
                {copy.recordsProgress(recordsProgress.completed, recordsProgress.total)}
              </Text>
              <Text className="mt-1 text-xs font-semibold text-brand-primary">
                {copy.recordsReady}
              </Text>
            </>
          ) : (
            <Text className="text-sm text-brand-muted" numberOfLines={2}>
              {copy.recordsHint}
            </Text>
          )}
        </TabPreviewCard>
      </View>
    </View>
  );
}
