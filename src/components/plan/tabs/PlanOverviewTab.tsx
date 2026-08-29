import { View } from 'react-native';

import { MemberList } from '../overview/MemberList';
import { OverviewMiniWidgets } from '../overview/OverviewMiniWidgets';
import { ScheduleOverviewSection } from '../overview/ScheduleOverviewSection';
import { TripPeriodCard } from '../overview/TripPeriodCard';
import type { PlanDetailTab } from '../../../constants/plan/planDetail';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { BudgetEntry, MemberRole, PlanMember, TravelPlan } from '../../../types/travelPlan';

type Copy = CopyFor<'planDetail'>;

type PlanOverviewTabProps = {
  plan: TravelPlan;
  language: AppLanguage;
  copy: Copy;
  roleLabels: Record<MemberRole, string>;
  budgetEntries: BudgetEntry[];
  budgetTotal: number;
  onNavigateToTab: (tab: PlanDetailTab) => void;
  recordsProgress?: { completed: number; total: number; allDone: boolean };
  isTravelRecordPublished?: boolean;
  showInvite?: boolean;
  onInvite?: () => void;
  showLeave?: boolean;
  leaveDisabled?: boolean;
  onLeave?: () => void;
  onSelectMember?: (member: PlanMember) => void;
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
  isTravelRecordPublished,
  showInvite = false,
  onInvite,
  showLeave = false,
  leaveDisabled = false,
  onLeave,
  onSelectMember,
}: PlanOverviewTabProps) {
  return (
    <View className="px-4 py-4">
      <TripPeriodCard
        compact
        startDate={plan.startDate}
        endDate={plan.endDate}
        language={language}
        periodLabel={copy.tripPeriod}
        nightsLabel={copy.nights}
      />

      <ScheduleOverviewSection
        plan={plan}
        language={language}
        copy={copy}
        onPress={() => onNavigateToTab('schedule')}
      />

      <MemberList
        members={plan.members}
        title={copy.membersTitle}
        roleLabels={roleLabels}
        inviteLabel={showInvite ? copy.inviteMembers : undefined}
        onInvite={showInvite ? onInvite : undefined}
        leaveLabel={showLeave ? copy.leaveTrip : undefined}
        leaveDisabled={leaveDisabled}
        onLeave={showLeave ? onLeave : undefined}
        onSelectMember={onSelectMember}
      />

      <OverviewMiniWidgets
        copy={copy}
        budgetTotal={budgetTotal}
        budgetEntries={budgetEntries}
        recordsProgress={recordsProgress}
        isTravelRecordPublished={isTravelRecordPublished}
        onBudgetPress={() => onNavigateToTab('budget')}
        onRecordsPress={() => onNavigateToTab('records')}
      />
    </View>
  );
}
