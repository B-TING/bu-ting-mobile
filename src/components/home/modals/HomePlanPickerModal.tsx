import { Pressable, ScrollView, Text, View } from 'react-native';

import { dayCountBetween } from '../../../constants/plan/planWizard';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
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
  onClose: () => void;
  onSelect: (planId: string) => void;
};

const STATUS_BADGE_CLASS: Record<TravelStatusDto, string> = {
  PLANNED: 'bg-sky-100',
  IN_PROGRESS: 'bg-sky-100',
  COMPLETED: 'bg-slate-100',
};

const STATUS_BADGE_TEXT_CLASS: Record<TravelStatusDto, string> = {
  PLANNED: 'text-sky-700',
  IN_PROGRESS: 'text-brand-primary',
  COMPLETED: 'text-slate-600',
};

function statusLabel(status: TravelStatusDto, copy: Copy): string {
  if (status === 'PLANNED') {
    return copy.plannedLabel;
  }
  if (status === 'COMPLETED') {
    return copy.completedLabel;
  }
  return copy.inProgressLabel;
}

function planMeta(plan: TravelPlan, language: AppLanguage): string {
  const dayCount = dayCountBetween(plan.startDate, plan.endDate);
  const daySuffix = language === 'ko' ? '일' : ' days';
  return `${plan.startDate} → ${plan.endDate} · ${dayCount}${daySuffix}`;
}

export function HomePlanPickerModal({
  visible,
  plans,
  selectedPlanId,
  language,
  copy,
  onClose,
  onSelect,
}: HomePlanPickerModalProps) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={copy.pickPlanTitle}
      subtitle={copy.pickPlanSubtitle}
      maxHeight="75%"
      showHandle
      closeAccessibilityLabel={copy.pickPlanClose}>
      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}>
        {plans.map(plan => {
          const selected = plan.planId === selectedPlanId;
          const travelStatus = resolvePlanTravelStatus(plan);
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
                selected ? `${plan.title}, ${copy.pickPlanSelected}` : plan.title
              }>
              <View className="flex-1 pr-2">
                <View
                  className={cn(
                    'mb-1.5 self-start rounded-full px-2 py-0.5',
                    STATUS_BADGE_CLASS[travelStatus],
                  )}>
                  <Text
                    className={cn(
                      'text-[11px] font-bold',
                      STATUS_BADGE_TEXT_CLASS[travelStatus],
                    )}>
                    {statusLabel(travelStatus, copy)}
                  </Text>
                </View>
                <Text className="text-base font-bold text-brand-text" numberOfLines={2}>
                  {plan.title}
                </Text>
                <Text className="mt-0.5 text-xs text-brand-muted">{planMeta(plan, language)}</Text>
              </View>
              {selected ? (
                <AppIcon name="check" size={20} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </AppModal>
  );
}
