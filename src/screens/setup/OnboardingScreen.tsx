import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { FeatureHighlightCard } from '../../components/shared/cards/FeatureHighlightCard';
import { OptionCard } from '../../components/shared/cards/OptionCard';
import { OnboardingStepLayout } from '../../components/shared/layout/OnboardingStepLayout';
import { OnboardingThankYouView } from '../../components/shared/layout/OnboardingThankYouView';
import {
  COMPANION_OPTIONS,
  FAMILIARITY_OPTIONS,
  getFeatureStepContent,
  LUGGAGE_OPTIONS,
  ONBOARDING_FLOW,
  ONBOARDING_QUESTION_COUNT,
  ONBOARDING_STEP_COUNT,
  PURPOSE_OPTIONS,
  SCHEDULE_PACE_OPTIONS,
  SETUP_COPY,
  TRAVEL_STYLE_OPTIONS,
} from '../../constants/onboarding';
import type { OnboardingStepId } from '../../constants/onboarding';
import type { RootStackParamList } from '../../navigation/types';
import { buildUserPromptContext } from '../../services/promptBuilder';
import { useAppStore } from '../../stores';
import type {
  BusanFamiliarity,
  OnboardingAnswers,
  OnboardingProfile,
  SchedulePace,
  VisitPurpose,
} from '../../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const QUESTION_ORDER: OnboardingStepId[] = [
  'travelStyle',
  'schedulePace',
  'companions',
  'luggage',
  'purposes',
  'busanFamiliarity',
];

const emptyAnswers = (): OnboardingAnswers => ({
  travelStyle: null,
  schedulePace: null,
  companions: null,
  luggage: null,
  purposes: [],
  busanFamiliarity: null,
  skippedSteps: [],
  skippedAll: false,
});

function questionIndexForStep(flowStep: number): number | null {
  const config = ONBOARDING_FLOW[flowStep];
  if (config.kind === 'question') {
    return QUESTION_ORDER.indexOf(config.id);
  }
  return null;
}

export function OnboardingScreen({ navigation }: Props) {
  const language = useAppStore(state => state.language) ?? 'en';
  const completeOnboardingStore = useAppStore(state => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(emptyAnswers);
  const [pendingComplete, setPendingComplete] = useState<OnboardingAnswers | null>(
    null,
  );

  const copy = SETUP_COPY[language];
  const stepConfig = ONBOARDING_FLOW[step];
  const isFeatureStep = stepConfig.kind === 'feature';

  const persistAndNavigate = useCallback(
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
      navigation.replace('PlanWizard');
    },
    [language, navigation, completeOnboardingStore],
  );

  const showThankYouThenComplete = useCallback(
    (finalAnswers: OnboardingAnswers) => {
      setPendingComplete(finalAnswers);
    },
    [],
  );

  const markQuestionSkipped = (questionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      skippedSteps: prev.skippedSteps.includes(questionIndex)
        ? prev.skippedSteps
        : [...prev.skippedSteps, questionIndex],
    }));
  };

  const goNext = () => {
    if (step < ONBOARDING_STEP_COUNT - 1) {
      setStep(s => s + 1);
      return;
    }
    showThankYouThenComplete(answers);
  };

  const onSkipStep = () => {
    if (stepConfig.kind === 'question') {
      const qIndex = questionIndexForStep(step);
      if (qIndex !== null && qIndex >= 0) {
        markQuestionSkipped(qIndex);
      }
      const nextStep = step + 2;
      if (nextStep >= ONBOARDING_STEP_COUNT) {
        showThankYouThenComplete(answers);
        return;
      }
      setStep(nextStep);
      return;
    }
    goNext();
  };

  const onSkipAll = () => {
    showThankYouThenComplete({
      ...answers,
      skippedAll: true,
      skippedSteps: Array.from(
        { length: ONBOARDING_QUESTION_COUNT },
        (_, i) => i,
      ),
    });
  };

  const canProceed = (): boolean => {
    if (isFeatureStep) {
      return true;
    }
    switch (stepConfig.id) {
      case 'travelStyle':
        return answers.travelStyle !== null;
      case 'schedulePace':
        return answers.schedulePace !== null;
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
    if (stepConfig.kind === 'feature') {
      return null;
    }
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
      case 'schedulePace':
        return SCHEDULE_PACE_OPTIONS.map(opt => (
          <OptionCard
            key={opt.value}
            label={opt.label[language]}
            selected={answers.schedulePace === opt.value}
            onPress={() =>
              setAnswers(prev => ({ ...prev, schedulePace: opt.value as SchedulePace }))
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

  const renderFeatureHighlights = () => {
    if (!featureContent) {
      return null;
    }
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {featureContent.features.map(feature => (
          <FeatureHighlightCard
            key={feature.title.en}
            emoji={feature.emoji}
            title={feature.title[language]}
            description={feature.description[language]}
            emphasized={feature.emphasized}
          />
        ))}
      </ScrollView>
    );
  };

  const featureContent =
    stepConfig.kind === 'feature'
      ? getFeatureStepContent(stepConfig.forQuestion, answers)
      : null;

  const title =
    stepConfig.kind === 'question'
      ? stepConfig.title[language]
      : (featureContent?.title[language] ?? '');

  const subtitle =
    stepConfig.kind === 'question'
      ? stepConfig.subtitle[language]
      : (featureContent?.subtitle[language] ?? '');

  const footerLabel =
    step === ONBOARDING_STEP_COUNT - 1 ? copy.finish : copy.next;

  const handleThankYouComplete = useCallback(() => {
    if (pendingComplete) {
      persistAndNavigate(pendingComplete);
    }
  }, [pendingComplete, persistAndNavigate]);

  if (pendingComplete) {
    return (
      <OnboardingThankYouView
        title={copy.thankYouTitle}
        privacy={copy.thankYouPrivacy}
        waitLabel={copy.thankYouWait}
        onComplete={handleThankYouComplete}
      />
    );
  }

  return (
    <OnboardingStepLayout
      stepIndex={step}
      stepLabel={copy.stepOf(step + 1, ONBOARDING_STEP_COUNT)}
      title={title}
      subtitle={subtitle}
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
      <View className="flex-1">
        {isFeatureStep ? renderFeatureHighlights() : renderOptions()}
      </View>
    </OnboardingStepLayout>
  );
}
