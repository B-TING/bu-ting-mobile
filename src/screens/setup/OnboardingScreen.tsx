import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { OnboardingStepLayout } from '../../components/setup/OnboardingStepLayout';
import { OptionCard } from '../../components/setup/OptionCard';
import { PrimaryButton } from '../../components/setup/PrimaryButton';
import {
  COMPANION_OPTIONS,
  FAMILIARITY_OPTIONS,
  LUGGAGE_OPTIONS,
  ONBOARDING_STEP_COUNT,
  ONBOARDING_STEPS,
  PURPOSE_OPTIONS,
  SETUP_COPY,
  TRAVEL_STYLE_OPTIONS,
} from '../../constants/onboarding';
import type { RootStackParamList } from '../../navigation/types';
import { buildUserPromptContext } from '../../services/promptBuilder';
import { useAppStore } from '../../stores';
import type {
  BusanFamiliarity,
  OnboardingAnswers,
  OnboardingProfile,
  VisitPurpose,
} from '../../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const emptyAnswers = (): OnboardingAnswers => ({
  travelStyle: null,
  companions: null,
  luggage: null,
  purposes: [],
  busanFamiliarity: null,
  skippedSteps: [],
  skippedAll: false,
});

export function OnboardingScreen({ navigation }: Props) {
  const language = useAppStore(state => state.language) ?? 'en';
  const completeOnboardingStore = useAppStore(state => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(emptyAnswers);

  const copy = SETUP_COPY[language];
  const stepConfig = ONBOARDING_STEPS[step];

  const completeOnboarding = useCallback(
    (finalAnswers: OnboardingAnswers) => {
      const completedAt = new Date().toISOString();
      const profile: OnboardingProfile = {
        ...finalAnswers,
        language,
        completedAt,
        aiPromptContext: '',
      };
      profile.aiPromptContext = buildUserPromptContext(profile);
      completeOnboardingStore(profile);
      navigation.replace('Home');
    },
    [language, navigation, completeOnboardingStore],
  );

  const markStepSkipped = (stepIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      skippedSteps: prev.skippedSteps.includes(stepIndex)
        ? prev.skippedSteps
        : [...prev.skippedSteps, stepIndex],
    }));
  };

  const goNext = () => {
    if (step < ONBOARDING_STEP_COUNT - 1) {
      setStep(s => s + 1);
      return;
    }
    completeOnboarding(answers);
  };

  const onSkipStep = () => {
    markStepSkipped(step);
    goNext();
  };

  const onSkipAll = () => {
    completeOnboarding({
      ...answers,
      skippedAll: true,
      skippedSteps: Array.from({ length: ONBOARDING_STEP_COUNT }, (_, i) => i),
    });
  };

  const canProceed = (): boolean => {
    switch (stepConfig.id) {
      case 'travelStyle':
        return answers.travelStyle !== null;
      case 'companions':
        return answers.companions !== null;
      case 'luggage':
        return answers.luggage !== null;
      case 'purposes':
        return answers.purposes.length > 0;
      case 'busanFamiliarity':
        return answers.busanFamiliarity !== null;
      default:
        return false;
    }
  };

  const togglePurpose = (purpose: VisitPurpose) => {
    setAnswers(prev => {
      const exists = prev.purposes.includes(purpose);
      return {
        ...prev,
        purposes: exists
          ? prev.purposes.filter(p => p !== purpose)
          : [...prev.purposes, purpose],
      };
    });
  };

  const renderOptions = () => {
    switch (stepConfig.id) {
      case 'travelStyle':
        return TRAVEL_STYLE_OPTIONS.map(opt => (
          <OptionCard
            key={opt.value}
            label={opt.label[language]}
            selected={answers.travelStyle === opt.value}
            onPress={() =>
              setAnswers(prev => ({ ...prev, travelStyle: opt.value }))
            }
          />
        ));
      case 'companions':
        return COMPANION_OPTIONS.map(opt => (
          <OptionCard
            key={opt.value}
            label={opt.label[language]}
            selected={answers.companions === opt.value}
            onPress={() =>
              setAnswers(prev => ({ ...prev, companions: opt.value }))
            }
          />
        ));
      case 'luggage':
        return LUGGAGE_OPTIONS.map(opt => (
          <OptionCard
            key={opt.value}
            label={opt.label[language]}
            selected={answers.luggage === opt.value}
            onPress={() =>
              setAnswers(prev => ({ ...prev, luggage: opt.value }))
            }
          />
        ));
      case 'purposes':
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {PURPOSE_OPTIONS.map(opt => (
              <OptionCard
                key={opt.value}
                label={opt.label[language]}
                selected={answers.purposes.includes(opt.value)}
                compact
                onPress={() => togglePurpose(opt.value)}
              />
            ))}
          </ScrollView>
        );
      case 'busanFamiliarity':
        return FAMILIARITY_OPTIONS.map(opt => (
          <OptionCard
            key={opt.value}
            label={opt.label[language]}
            selected={answers.busanFamiliarity === opt.value}
            onPress={() =>
              setAnswers(prev => ({
                ...prev,
                busanFamiliarity: opt.value as BusanFamiliarity,
              }))
            }
          />
        ));
      default:
        return null;
    }
  };

  const footerLabel =
    step === ONBOARDING_STEP_COUNT - 1 ? copy.finish : copy.next;

  return (
    <OnboardingStepLayout
      stepIndex={step}
      stepLabel={copy.stepOf(step + 1, ONBOARDING_STEP_COUNT)}
      title={stepConfig.title[language]}
      subtitle={stepConfig.subtitle[language]}
      skipLabel={copy.skip}
      skipAllLabel={copy.skipAll}
      onSkipStep={onSkipStep}
      onSkipAll={onSkipAll}
      footer={
        <PrimaryButton
          label={footerLabel}
          onPress={goNext}
          disabled={!canProceed()}
        />
      }>
      <View className="flex-1">{renderOptions()}</View>
    </OnboardingStepLayout>
  );
}
