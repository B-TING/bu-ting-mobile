import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import type { CopyFor } from '../../i18n';
import type { TravelPlan } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';
import { formatWeekdayDate } from '../../utils/geo/geo';
import { getScheduleDayColor } from '../../constants/plan/scheduleDayColors';
import { AppModal, AppModalPrimaryFooter } from '../shared/modals';

type Copy = CopyFor<'placeSearch'>;

type AddPlaceToPlanDayModalProps = {
  visible: boolean;
  plans: TravelPlan[];
  initialPlanId?: string | null;
  language: AppLanguage;
  copy: Copy;
  placeName: string;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (planId: string, dayNumber: number) => void | Promise<void>;
};

export function AddPlaceToPlanDayModal({
  visible,
  plans,
  initialPlanId = null,
  language,
  copy,
  placeName,
  saving = false,
  onClose,
  onConfirm,
}: AddPlaceToPlanDayModalProps) {
  const [planId, setPlanId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState(1);

  const selectedPlan = useMemo(
    () => plans.find(p => p.planId === planId) ?? plans[0] ?? null,
    [plans, planId],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    const nextPlanId =
      (initialPlanId && plans.some(p => p.planId === initialPlanId)
        ? initialPlanId
        : null) ??
      plans[0]?.planId ??
      null;
    setPlanId(nextPlanId);
    const plan = plans.find(p => p.planId === nextPlanId) ?? plans[0];
    setDayNumber(plan?.itinerary[0]?.dayNumber ?? 1);
  }, [visible, initialPlanId, plans]);

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }
    if (!selectedPlan.itinerary.some(d => d.dayNumber === dayNumber)) {
      setDayNumber(selectedPlan.itinerary[0]?.dayNumber ?? 1);
    }
  }, [selectedPlan, dayNumber]);

  const canConfirm = Boolean(selectedPlan && !saving);

  return (
    <AppModal
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={copy.addToPlanPickTitle}
      subtitle={`${placeName}\n${copy.addToPlanPickSub}`}
      maxHeight="70%"
      backdropDismiss={!saving}
      footer={
        <AppModalPrimaryFooter
          confirmLabel={saving ? copy.addToPlanSaving : copy.addToPlanConfirm}
          onConfirm={() => {
            if (!selectedPlan || saving) {
              return;
            }
            Promise.resolve(onConfirm(selectedPlan.planId, dayNumber)).catch(() => undefined);
          }}
          confirmDisabled={!canConfirm}
          cancelLabel={copy.addToPlanCancel}
          onCancel={saving ? () => undefined : onClose}
        />
      }>
      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        {plans.length > 1 ? (
          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold text-brand-muted">
              {language === 'ko' ? '여행' : language === 'ja' ? '旅行' : language === 'zh' ? '行程' : 'Trip'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {plans.map(plan => {
                const selected = plan.planId === selectedPlan?.planId;
                return (
                  <Pressable
                    key={plan.planId}
                    onPress={() => setPlanId(plan.planId)}
                    disabled={saving}
                    className={`mr-2 max-w-[220px] rounded-2xl border px-3 py-2 ${
                      selected
                        ? 'border-brand-primary bg-brand-selected'
                        : 'border-brand-border bg-brand-surface'
                    }`}>
                    <Text
                      numberOfLines={1}
                      className={`text-sm font-semibold ${
                        selected ? 'text-brand-primary' : 'text-brand-text'
                      }`}>
                      {plan.title}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-brand-muted">
                      {plan.startDate} → {plan.endDate}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : selectedPlan ? (
          <Text className="mb-3 text-sm font-semibold text-brand-text" numberOfLines={2}>
            {selectedPlan.title}
          </Text>
        ) : null}

        {selectedPlan ? (
          <View className="mb-2">
            <Text className="mb-2 text-xs font-bold text-brand-muted">
              {language === 'ko' ? '날짜' : language === 'ja' ? '日付' : language === 'zh' ? '日期' : 'Day'}
            </Text>
            <View className="flex-row flex-wrap">
              {selectedPlan.itinerary.map(day => {
                const selected = day.dayNumber === dayNumber;
                const color = getScheduleDayColor(day.dayNumber);
                return (
                  <Pressable
                    key={day.dailyId}
                    onPress={() => setDayNumber(day.dayNumber)}
                    disabled={saving}
                    className="mb-2 mr-2 flex-row items-center rounded-full px-3 py-2"
                    style={{
                      backgroundColor: selected ? color.main : color.light,
                      borderWidth: 1.5,
                      borderColor: selected ? color.main : color.border,
                    }}>
                    <View
                      className="mr-2 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: selected ? '#FFFFFF' : color.main }}
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: selected ? '#FFFFFF' : color.main }}>
                      {formatWeekdayDate(day.date, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {saving ? (
          <View className="items-center py-3">
            <ActivityIndicator color="#0077B6" />
          </View>
        ) : null}
      </ScrollView>
    </AppModal>
  );
}
