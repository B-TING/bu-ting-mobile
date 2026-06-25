import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
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
  ONBOARDING_QUESTION_FLOW,
  PURPOSE_OPTIONS,
  SCHEDULE_PACE_OPTIONS,
  SETUP_COPY,
  TRAVEL_STYLE_OPTIONS,
} from '../../constants/setup/onboarding';
import type { OnboardingFlowStep, OnboardingStepId } from '../../constants/setup/onboarding';
import type { RootStackParamList } from '../../navigation/types';
import { buildUserPromptContext } from '../../services/setup/promptBuilder';
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

function profileToAnswers(profile: OnboardingProfile): OnboardingAnswers {
  return {
    travelStyle: profile.travelStyle,
    schedulePace: profile.schedulePace,
    companions: profile.companions,
    luggage: profile.luggage,
    purposes: [...profile.purposes],
    busanFamiliarity: profile.busanFamiliarity,
    skippedSteps: [...profile.skippedSteps],
    skippedAll: profile.skippedAll,
  };
}

function questionIndexForStep(
  flowSteps: OnboardingFlowStep[],
  flowStep: number,
): number | null {
  const config = flowSteps[flowStep];
  if (config?.kind === 'question') {
    return QUESTION_ORDER.indexOf(config.id);
  }
  return null;
}

export function OnboardingScreen({ navigation, route }: Props) {
  const isEditMode = route.params?.mode === 'edit';
  const language = useAppStore(state => state.language) ?? 'en';
  const savedOnboarding = useAppStore(state => state.onboarding);
  const completeOnboardingStore = useAppStore(state => state.completeOnboarding);

  const flowSteps = isEditMode ? ONBOARDING_QUESTION_FLOW : ONBOARDING_FLOW;
  const stepCount = flowSteps.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() =>
    isEditMode && savedOnboarding
      ? profileToAnswers(savedOnboarding)
      : emptyAnswers(),
  );
  const [pendingComplete, setPendingComplete] = useState<OnboardingAnswers | null>(
    null,
  );

  const copy = SETUP_COPY[language];
  const stepConfig = flowSteps[step];
  const isWelcomeStep = stepConfig.kind === 'welcome';
  const isFeatureStep = stepConfig.kind === 'feature';

  const persistProfile = useCallback(
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

      if (isEditMode) {
        navigation.goBack();
        return;
      }
      navigation.replace('Login');
    },
    [language, navigation, completeOnboardingStore, isEditMode],
  );

  const showThankYouThenComplete = useCallback(
    (finalAnswers: OnboardingAnswers) => {
      if (isEditMode) {
        persistProfile(finalAnswers);
        return;
      }
      setPendingComplete(finalAnswers);
    },
    [isEditMode, persistProfile],
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
    if (step < stepCount - 1) {
      setStep(s => s + 1);
      return;
    }
    showThankYouThenComplete(answers);
  };

  const onSkipStep = () => {
    if (stepConfig.kind === 'welcome') {
      goNext();
      return;
    }
    if (stepConfig.kind === 'question') {
      const qIndex = questionIndexForStep(flowSteps, step);
      if (qIndex !== null && qIndex >= 0) {
        markQuestionSkipped(qIndex);
      }
      const skipDelta = isEditMode ? 1 : 2;
      const nextStep = step + skipDelta;
      if (nextStep >= stepCount) {
        showThankYouThenComplete(answers);
        return;
      }
      setStep(nextStep);
      return;
    }
    goNext();
  };

  const onSkipAll = () => {
    if (isEditMode) {
      navigation.goBack();
      return;
    }
    showThankYouThenComplete({
      ...answers,
      skippedAll: true,
      skippedSteps: Array.from({ length: ONBOARDING_QUESTION_COUNT }, (_, i) => i),
    });
  };

  const canProceed = (): boolean => {
    if (isWelcomeStep || isFeatureStep) {
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

  const featureContent =
    stepConfig.kind === 'feature'
      ? getFeatureStepContent(stepConfig.forQuestion, answers)
      : null;

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

  const title = useMemo(() => {
    if (stepConfig.kind === 'welcome') {
      return copy.welcomeTitle;
    }
    if (stepConfig.kind === 'question') {
      return stepConfig.title[language];
    }
    return featureContent?.title[language] ?? '';
  }, [copy.welcomeTitle, featureContent, language, stepConfig]);

  const subtitle = useMemo(() => {
    if (stepConfig.kind === 'welcome') {
      return copy.welcomeSubtitle;
    }
    if (stepConfig.kind === 'question') {
      return stepConfig.subtitle[language];
    }
    return featureContent?.subtitle[language] ?? '';
  }, [copy.welcomeSubtitle, featureContent, language, stepConfig]);

  const footerLabel =
    step === stepCount - 1
      ? isEditMode
        ? copy.save
        : copy.finish
      : copy.next;

  const handleThankYouComplete = useCallback(() => {
    if (pendingComplete) {
      persistProfile(pendingComplete);
    }
  }, [pendingComplete, persistProfile]);

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
      stepTotal={stepCount}
      stepLabel={copy.stepOf(step + 1, stepCount)}
      title={title}
      subtitle={subtitle}
      skipLabel={copy.skip}
      skipAllLabel={isEditMode ? copy.cancelEdit : copy.skipAll}
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
        {isWelcomeStep ? (
          <View className="flex-1 items-center justify-center">
            <BrandLogo height={48} style={{ marginBottom: 24 }} />
            <Text className="text-center text-base leading-6 text-brand-muted">
              {language === 'ko'
                ? '건너뛰기를 눌러 바로 시작할 수도 있어요.'
                : 'You can skip anytime to get started faster.'}
            </Text>
          </View>
        ) : isFeatureStep ? (
          renderFeatureHighlights()
        ) : (
          renderOptions()
        )}
      </View>
    </OnboardingStepLayout>
  );
}
