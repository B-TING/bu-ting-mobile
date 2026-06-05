import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WizardStepLayout } from '../../components/plan/WizardStepLayout';
import { OptionCard } from '../../components/setup/OptionCard';
import { PrimaryButton } from '../../components/setup/PrimaryButton';
import {
  ACCOMMODATION_AREAS,
  ACCOMMODATION_SEARCH,
  BUSAN_ATTRACTIONS,
  BUSAN_FOODS,
  COMPANION_TYPE_OPTIONS,
  dayCountBetween,
  isValidIsoDate,
  PLAN_WIZARD_COPY,
  PLAN_WIZARD_STEP_COUNT,
  PLAN_WIZARD_STEPS,
} from '../../constants/planWizard';
import type { RootStackParamList } from '../../navigation/types';
import { requestAutoPlan, requestPlanCandidates } from '../../services/planAiService';
import { useAppStore, usePlanStore, emptyWizardAnswers } from '../../stores';
import type { CompanionGroupType } from '../../types/planWizard';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanWizard'>;

function defaultDates() {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function PlanWizardScreen({ navigation }: Props) {
  const language = useAppStore(s => s.language) ?? 'ko';
  const onboarding = useAppStore(s => s.onboarding);
  const addPlan = usePlanStore(s => s.addPlan);
  const confirmPlan = usePlanStore(s => s.confirmPlan);
  const setPlanCandidates = usePlanStore(s => s.setPlanCandidates);

  const copy = PLAN_WIZARD_COPY[language];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => ({
    ...emptyWizardAnswers(),
    ...defaultDates(),
  }));
  const [accQuery, setAccQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const stepConfig = PLAN_WIZARD_STEPS[step];

  const filteredStays = useMemo(() => {
    const q = accQuery.trim().toLowerCase();
    if (!q) {
      return ACCOMMODATION_SEARCH;
    }
    return ACCOMMODATION_SEARCH.filter(s =>
      s.label[language].toLowerCase().includes(q),
    );
  }, [accQuery, language]);

  const canProceed = (): boolean => {
    switch (stepConfig.id) {
      case 'dates':
        return (
          isValidIsoDate(answers.startDate) &&
          isValidIsoDate(answers.endDate) &&
          dayCountBetween(answers.startDate, answers.endDate) > 0
        );
      case 'companions':
        return answers.companionCount >= 1 && answers.companionCount <= 20;
      case 'companionType':
        return answers.companionTypes.length > 0;
      case 'luggage':
        return true;
      case 'attractions':
        return answers.attractionIds.length > 0;
      case 'foods':
        return answers.foodIds.length > 0;
      case 'accommodation':
        if (answers.accommodationMode === 'booked') {
          return !!answers.accommodationPlaceId;
        }
        return answers.accommodationAreaIds.length > 0;
      case 'generationMode':
        return true;
      default:
        return false;
    }
  };

  const toggleId = (key: 'attractionIds' | 'foodIds' | 'accommodationAreaIds', id: string) => {
    setAnswers(prev => {
      const list = prev[key];
      const exists = list.includes(id);
      return {
        ...prev,
        [key]: exists ? list.filter(x => x !== id) : [...list, id],
      };
    });
  };

  const toggleCompanionType = (type: CompanionGroupType) => {
    setAnswers(prev => {
      const exists = prev.companionTypes.includes(type);
      return {
        ...prev,
        companionTypes: exists
          ? prev.companionTypes.filter(t => t !== type)
          : [...prev.companionTypes, type],
      };
    });
  };

  const finish = async () => {
    setLoading(true);
    try {
      if (answers.generationMode === 'auto') {
        const plan = await requestAutoPlan(answers, onboarding);
        addPlan(plan);
        confirmPlan(plan.planId);
        navigation.reset({
          index: 0,
          routes: [{ name: 'PlanDetail', params: { planId: plan.planId } }],
        });
      } else {
        const candidates = await requestPlanCandidates(answers, onboarding);
        setPlanCandidates(candidates);
        navigation.replace('PlanCandidates');
      }
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step < PLAN_WIZARD_STEP_COUNT - 1) {
      setStep(s => s + 1);
      return;
    }
    finish();
  };

  const goBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainHome');
    }
  };

  const renderStep = () => {
    switch (stepConfig.id) {
      case 'dates':
        return (
          <View>
            <Text className="mb-2 text-sm font-semibold text-brand-muted">
              {copy.startDate}
            </Text>
            <TextInput
              className="mb-4 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3.5 text-base text-brand-text"
              value={answers.startDate}
              onChangeText={startDate => setAnswers(p => ({ ...p, startDate }))}
              placeholder="2026-06-15"
              autoCapitalize="none"
            />
            <Text className="mb-2 text-sm font-semibold text-brand-muted">
              {copy.endDate}
            </Text>
            <TextInput
              className="rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3.5 text-base text-brand-text"
              value={answers.endDate}
              onChangeText={endDate => setAnswers(p => ({ ...p, endDate }))}
              placeholder="2026-06-16"
              autoCapitalize="none"
            />
          </View>
        );
      case 'companions':
        return (
          <View className="items-center pt-8">
            <Text className="mb-6 text-4xl font-bold text-brand-primary">
              {copy.countLabel(answers.companionCount)}
            </Text>
            <View className="flex-row gap-6">
              <Pressable
                className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary active:opacity-90"
                onPress={() =>
                  setAnswers(p => ({
                    ...p,
                    companionCount: Math.max(1, p.companionCount - 1),
                  }))
                }>
                <Text className="text-2xl font-bold text-white">−</Text>
              </Pressable>
              <Pressable
                className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary active:opacity-90"
                onPress={() =>
                  setAnswers(p => ({
                    ...p,
                    companionCount: Math.min(20, p.companionCount + 1),
                  }))
                }>
                <Text className="text-2xl font-bold text-white">+</Text>
              </Pressable>
            </View>
          </View>
        );
      case 'companionType':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {COMPANION_TYPE_OPTIONS.map(opt => (
              <OptionCard
                key={opt.id}
                label={opt.label[language]}
                selected={answers.companionTypes.includes(opt.id)}
                onPress={() => toggleCompanionType(opt.id)}
              />
            ))}
          </ScrollView>
        );
      case 'luggage':
        return (
          <>
            <OptionCard
              label={copy.heavyYes}
              selected={answers.hasHeavyBaggage}
              onPress={() => setAnswers(p => ({ ...p, hasHeavyBaggage: true }))}
            />
            <OptionCard
              label={copy.heavyNo}
              selected={!answers.hasHeavyBaggage}
              onPress={() => setAnswers(p => ({ ...p, hasHeavyBaggage: false }))}
            />
          </>
        );
      case 'attractions':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {BUSAN_ATTRACTIONS.map(opt => (
              <OptionCard
                key={opt.id}
                label={opt.label[language]}
                selected={answers.attractionIds.includes(opt.id)}
                compact
                onPress={() => toggleId('attractionIds', opt.id)}
              />
            ))}
          </ScrollView>
        );
      case 'foods':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {BUSAN_FOODS.map(opt => (
              <OptionCard
                key={opt.id}
                label={opt.label[language]}
                selected={answers.foodIds.includes(opt.id)}
                compact
                onPress={() => toggleId('foodIds', opt.id)}
              />
            ))}
          </ScrollView>
        );
      case 'accommodation':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <OptionCard
              label={copy.accBooked}
              selected={answers.accommodationMode === 'booked'}
              onPress={() =>
                setAnswers(p => ({
                  ...p,
                  accommodationMode: 'booked',
                  accommodationAreaIds: [],
                }))
              }
            />
            <OptionCard
              label={copy.accArea}
              selected={answers.accommodationMode === 'area_only'}
              onPress={() =>
                setAnswers(p => ({
                  ...p,
                  accommodationMode: 'area_only',
                  accommodationPlaceId: null,
                  accommodationName: null,
                }))
              }
            />
            {answers.accommodationMode === 'booked' ? (
              <View className="mt-2">
                <Text className="mb-2 text-sm font-semibold text-brand-muted">
                  {copy.accSearch}
                </Text>
                <TextInput
                  className="mb-3 rounded-2xl border-2 border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text"
                  placeholder={copy.accSearchPlaceholder}
                  value={accQuery}
                  onChangeText={setAccQuery}
                />
                {filteredStays.map(stay => (
                  <OptionCard
                    key={stay.id}
                    label={stay.label[language]}
                    selected={answers.accommodationPlaceId === stay.id}
                    compact
                    onPress={() =>
                      setAnswers(p => ({
                        ...p,
                        accommodationPlaceId: stay.id,
                        accommodationName: stay.label[language],
                      }))
                    }
                  />
                ))}
              </View>
            ) : (
              <View className="mt-2">
                {ACCOMMODATION_AREAS.map(area => (
                  <OptionCard
                    key={area.id}
                    label={area.label[language]}
                    selected={answers.accommodationAreaIds.includes(area.id)}
                    compact
                    onPress={() => toggleId('accommodationAreaIds', area.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        );
      case 'generationMode':
        return (
          <>
            <OptionCard
              label={copy.modeAuto}
              selected={answers.generationMode === 'auto'}
              onPress={() => setAnswers(p => ({ ...p, generationMode: 'auto' }))}
            />
            <Text className="-mt-1 mb-3 ml-1 text-xs text-brand-muted">
              {copy.modeAutoSub}
            </Text>
            <OptionCard
              label={copy.modeCandidates}
              selected={answers.generationMode === 'candidates'}
              onPress={() => setAnswers(p => ({ ...p, generationMode: 'candidates' }))}
            />
            <Text className="-mt-1 mb-3 ml-1 text-xs text-brand-muted">
              {copy.modeCandidatesSub}
            </Text>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6">
        <ActivityIndicator size="large" color="#0077B6" />
        <Text className="mt-4 text-base text-brand-muted">{copy.generating}</Text>
      </View>
    );
  }

  const stepLabel = `${step + 1} / ${PLAN_WIZARD_STEP_COUNT}`;
  const isLast = step === PLAN_WIZARD_STEP_COUNT - 1;

  return (
    <WizardStepLayout
      stepIndex={step}
      totalSteps={PLAN_WIZARD_STEP_COUNT}
      stepLabel={stepLabel}
      title={stepConfig.title[language]}
      subtitle={stepConfig.subtitle[language]}
      backLabel={copy.back}
      onBack={goBack}
      footer={
        <PrimaryButton
          label={isLast ? copy.finish : copy.next}
          onPress={goNext}
          disabled={!canProceed()}
        />
      }>
      {renderStep()}
    </WizardStepLayout>
  );
}
