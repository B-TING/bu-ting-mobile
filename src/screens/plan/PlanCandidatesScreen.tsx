import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../../components/setup/PrimaryButton';
import { PLAN_WIZARD_COPY, dayCountBetween } from '../../constants/planWizard';
import { layout } from '../../constants/layout';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore, usePlanStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanCandidates'>;

export function PlanCandidatesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = PLAN_WIZARD_COPY[language];
  const candidates = usePlanStore(s => s.planCandidates);
  const addPlan = usePlanStore(s => s.addPlan);
  const confirmPlan = usePlanStore(s => s.confirmPlan);
  const clearCandidates = usePlanStore(s => s.clearCandidates);

  useEffect(() => {
    if (!candidates?.length) {
      navigation.replace('PlanWizard');
    }
  }, [candidates, navigation]);

  if (!candidates?.length) {
    return null;
  }

  const selectPlan = (planId: string) => {
    const plan = candidates.find(p => p.planId === planId);
    if (!plan) {
      return;
    }
    addPlan(plan);
    confirmPlan(plan.planId);
    clearCandidates();
    navigation.replace('Home');
  };

  return (
    <View
      className="flex-1 bg-brand-background"
      style={[layout.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Text className="mb-2 px-6 text-[26px] font-bold text-brand-text">
        {language === 'ko' ? '일정 후보 선택' : 'Pick a plan'}
      </Text>
      <Text className="mb-6 px-6 text-[15px] text-brand-muted">
        {language === 'ko'
          ? 'AI가 제안한 플랜 중 하나를 골라 시작하세요'
          : 'Choose one of the AI-suggested itineraries'}
      </Text>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {candidates.map(plan => {
          const days = dayCountBetween(plan.startDate, plan.endDate);
          const spotCount = plan.itinerary.reduce((n, d) => n + d.routes.length, 0);
          return (
            <Pressable
              key={plan.planId}
              className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface p-4 active:opacity-90"
              onPress={() => selectPlan(plan.planId)}>
              <Text className="mb-1 text-lg font-bold text-brand-text">{plan.title}</Text>
              <Text className="mb-2 text-sm text-brand-muted">
                {plan.startDate} → {plan.endDate} · {copy.days(days)} · {spotCount}{' '}
                {language === 'ko' ? '곳' : 'spots'}
              </Text>
              {plan.itinerary[0]?.routes.slice(0, 3).map(r => (
                <Text key={r.itemId} className="text-sm text-brand-text">
                  · {r.placeName}
                </Text>
              ))}
              <Text className="mt-3 text-sm font-semibold text-brand-primary">
                {copy.pickPlan} →
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="px-6 pt-2">
        <PrimaryButton
          label={language === 'ko' ? '다시 질문하기' : 'Redo questions'}
          onPress={() => {
            clearCandidates();
            navigation.replace('PlanWizard');
          }}
        />
      </View>
    </View>
  );
}
