import { Pressable, Text, View } from 'react-native';

import { MemberList } from '../overview/MemberList';
import { OverviewMiniWidgets } from '../overview/OverviewMiniWidgets';
import { ScheduleOverviewSection } from '../overview/ScheduleOverviewSection';
import { TripPeriodCard } from '../overview/TripPeriodCard';
import type { PlanDetailTab } from '../../../constants/plan/planDetail';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { BudgetEntry, MemberRole, TravelPlan } from '../../../types/travelPlan';

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
  showTransferLeader?: boolean;
  onTransferLeader?: () => void;
  showLeave?: boolean;
  leaveDisabled?: boolean;
  onLeave?: () => void;
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
  showTransferLeader = false,
  onTransferLeader,
  showLeave = false,
  leaveDisabled = false,
  onLeave,
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
      />

      {showTransferLeader && onTransferLeader ? (
        <Pressable
          onPress={onTransferLeader}
          accessibilityRole="button"
          accessibilityLabel={copy.transferLeader}
          className="mb-3 items-center rounded-2xl border border-brand-border bg-brand-surface py-3.5 active:opacity-80">
          <Text className="text-sm font-bold text-brand-text">{copy.transferLeader}</Text>
        </Pressable>
      ) : null}

      {showLeave && onLeave ? (
        <Pressable
          disabled={leaveDisabled}
          onPress={onLeave}
          accessibilityRole="button"
          accessibilityLabel={copy.leaveTrip}
          className={`mb-3 items-center rounded-2xl border border-red-200 bg-red-50 py-3.5 active:opacity-80 ${
            leaveDisabled ? 'opacity-50' : ''
          }`}>
          <Text className="text-sm font-bold text-red-600">{copy.leaveTrip}</Text>
        </Pressable>
      ) : null}

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
