import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { dayCountBetween } from '../../../constants/plan/planWizard';
import { ICON_COLOR_PRIMARY, ICON_COLOR_WHITE } from '../../../constants/icons';
import type { CopyFor } from '../../../i18n';
import type { TravelStatusDto } from '../../../types/travelApi';
import type { TravelPlan } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';
import { cn } from '../../../utils/common/cn';
import { resolvePlanTravelStatus } from '../../../utils/plan/planTravelStatus';
import { AppIcon } from '../../shared/icons/AppIcon';
import { AppModal } from '../../shared/modals';

type Copy = CopyFor<'mainHome'>;

type HomePlanPickerModalProps = {
  visible: boolean;
  plans: TravelPlan[];
  selectedPlanId: string | null;
  language: AppLanguage;
  copy: Copy;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSelect: (planId: string) => void;
  onCreatePress?: () => void;
};

const STATUS_ORDER: TravelStatusDto[] = ['IN_PROGRESS', 'PLANNED', 'COMPLETED'];

function statusTabLabel(status: TravelStatusDto, copy: Copy): string {
  if (status === 'PLANNED') {
    return copy.pickStatusPlanned;
  }
  if (status === 'COMPLETED') {
    return copy.pickStatusCompleted;
  }
  return copy.pickStatusInProgress;
}

function planMeta(plan: TravelPlan, language: AppLanguage): string {
  const dayCount = dayCountBetween(plan.startDate, plan.endDate);
  const daySuffix = language === 'ko' ? '일' : ' days';
  return `${plan.startDate} → ${plan.endDate} · ${dayCount}${daySuffix}`;
}

function countByStatus(plans: TravelPlan[]): Record<TravelStatusDto, number> {
  const counts: Record<TravelStatusDto, number> = {
    IN_PROGRESS: 0,
    PLANNED: 0,
    COMPLETED: 0,
  };
  for (const plan of plans) {
    counts[resolvePlanTravelStatus(plan)] += 1;
  }
  return counts;
}

function defaultStatus(
  plans: TravelPlan[],
  selectedPlanId: string | null,
): TravelStatusDto {
  const selected = plans.find(plan => plan.planId === selectedPlanId);
  if (selected) {
    return resolvePlanTravelStatus(selected);
  }
  const counts = countByStatus(plans);
  return STATUS_ORDER.find(status => counts[status] > 0) ?? 'IN_PROGRESS';
}

export function HomePlanPickerModal({
  visible,
  plans,
  selectedPlanId,
  language,
  copy,
  title,
  subtitle,
  onClose,
  onSelect,
  onCreatePress,
}: HomePlanPickerModalProps) {
  const [activeStatus, setActiveStatus] = useState<TravelStatusDto>(() =>
    defaultStatus(plans, selectedPlanId),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    setActiveStatus(defaultStatus(plans, selectedPlanId));
  }, [visible, plans, selectedPlanId]);

  const statusCounts = useMemo(() => countByStatus(plans), [plans]);
  const visiblePlans = useMemo(
    () => plans.filter(plan => resolvePlanTravelStatus(plan) === activeStatus),
    [plans, activeStatus],
  );

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={title ?? copy.pickPlanTitle}
      subtitle={subtitle ?? copy.pickPlanSubtitle}
      maxHeight="75%"
      showHandle
      closeAccessibilityLabel={copy.pickPlanClose}>
      <View className="mb-3 px-5">
        <View className="flex-row rounded-2xl bg-brand-background p-1">
          {STATUS_ORDER.map(status => {
            const selected = activeStatus === status;
            const count = statusCounts[status];
            return (
              <Pressable
                key={status}
                onPress={() => setActiveStatus(status)}
                className={cn(
                  'min-h-10 flex-1 items-center justify-center rounded-xl px-1 py-2 active:opacity-90',
                  selected ? 'bg-brand-surface' : undefined,
                )}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${statusTabLabel(status, copy)} ${count}`}>
                <Text
                  className={cn(
                    'text-sm font-bold',
                    selected ? 'text-brand-primary' : 'text-brand-muted',
                  )}>
                  {statusTabLabel(status, copy)}
                  {count > 0 ? ` ${count}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}>
        {visiblePlans.length === 0 ? (
          <View className="mb-3 items-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-4 py-8">
            <Text className="text-sm text-brand-muted">{copy.pickStatusEmpty}</Text>
          </View>
        ) : (
          visiblePlans.map(plan => {
            const selected = plan.planId === selectedPlanId;
            return (
              <Pressable
                key={plan.planId}
                onPress={() => onSelect(plan.planId)}
                className={cn(
                  'mb-2 flex-row items-center rounded-2xl border p-3.5 active:opacity-90',
                  selected
                    ? 'border-brand-primary bg-brand-selected'
                    : 'border-brand-border bg-brand-surface',
                )}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={
                  selected
                    ? `${plan.title}, ${copy.pickPlanSelected}`
                    : plan.title
                }>
                <View className="flex-1 pr-2">
                  <Text className="text-base font-bold text-brand-text" numberOfLines={2}>
                    {plan.title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-brand-muted">
                    {planMeta(plan, language)}
                  </Text>
                </View>
                {selected ? (
                  <AppIcon name="check" size={20} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
                ) : null}
              </Pressable>
            );
          })
        )}
        {onCreatePress ? (
          <Pressable
            onPress={onCreatePress}
            className="mb-2 flex-row items-center rounded-2xl border border-dashed border-brand-primary bg-brand-selected p-3.5 active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel={copy.createNewPlanA11y}>
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-brand-primary">
              <AppIcon name="plus" size={18} color={ICON_COLOR_WHITE} strokeWidth={2.5} />
            </View>
            <Text className="flex-1 text-base font-bold text-brand-primary">
              {copy.createNewPlan}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </AppModal>
  );
}
