import { useCallback, useMemo, useState } from 'react';
import { BackHandler, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
import { FeatureHighlightCard } from '../../components/shared/cards/FeatureHighlightCard';
import { OptionCard } from '../../components/shared/cards/OptionCard';
import { OnboardingStepLayout } from '../../components/shared/layout/OnboardingStepLayout';
import { OnboardingThankYouView } from '../../components/shared/layout/OnboardingThankYouView';
import { useAppAlert } from '../../components/shared/modals';
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
  TRAVEL_STYLE_OPTIONS,
} from '../../constants/setup/onboarding';
import { useAppLanguage, useCopy } from '../../i18n';
import type { OnboardingFlowStep, OnboardingStepId } from '../../constants/setup/onboarding';
import type { RootStackParamList } from '../../navigation/types';
import { buildUserPromptContext } from '../../services/setup/promptBuilder';
import { hasAnsweredSurvey } from '../../services/setup/travelSurveyMapper';
import { persistTravelSurveyForUser } from '../../services/setup/travelSurveySync';
import { selectOnboardingForUser, useAppStore } from '../../stores';
import {
  selectReusableAccessToken,
  useAuthStore,
} from '../../stores/useAuthStore';
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

function applyQuestionSkip(
  prev: OnboardingAnswers,
  questionIndex: number,
): OnboardingAnswers {
  const skippedSteps = prev.skippedSteps.includes(questionIndex)
    ? prev.skippedSteps
    : [...prev.skippedSteps, questionIndex];
  const next: OnboardingAnswers = { ...prev, skippedSteps, skippedAll: false };
  switch (QUESTION_ORDER[questionIndex]) {
    case 'travelStyle':
      next.travelStyle = null;
      break;
    case 'schedulePace':
      next.schedulePace = null;
      break;
    case 'companions':
      next.companions = null;
      break;
    case 'luggage':
      next.luggage = null;
      break;
    case 'purposes':
      next.purposes = [];
      break;
    case 'busanFamiliarity':
      next.busanFamiliarity = null;
      break;
    default:
      break;
  }
  return next;
}

function withAnsweredQuestion(
  prev: OnboardingAnswers,
  questionIndex: number,
  patch: Partial<OnboardingAnswers>,
): OnboardingAnswers {
  return {
    ...prev,
    ...patch,
    skippedSteps: prev.skippedSteps.filter(index => index !== questionIndex),
    skippedAll: false,
  };
}

export function OnboardingScreen({ navigation, route }: Props) {
  const mode = route.params?.mode ?? 'setup';
  const isEditMode = mode === 'edit';
  const isAccountMode = mode === 'account';
  const isQuestionOnlyFlow = isEditMode || isAccountMode;
  const { alert } = useAppAlert();
  const language = useAppLanguage();
  const copy = useCopy('setup');
  const userId = useAuthStore(state => state.user?.userId ?? null);
  const accessToken = useAuthStore(selectReusableAccessToken);
  const savedOnboarding = useAppStore(
    isQuestionOnlyFlow ? selectOnboardingForUser(userId) : state => state.onboarding,
  );
  const completeOnboardingStore = useAppStore(state => state.completeOnboarding);

  const flowSteps = isQuestionOnlyFlow ? ONBOARDING_QUESTION_FLOW : ONBOARDING_FLOW;
  const stepCount = flowSteps.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => {
    if (isEditMode && savedOnboarding && hasAnsweredSurvey(savedOnboarding)) {
      return profileToAnswers({ ...savedOnboarding, skippedAll: false });
    }
    return emptyAnswers();
  });
  const [pendingComplete, setPendingComplete] = useState<OnboardingAnswers | null>(
    null,
  );

  const stepConfig = flowSteps[step];
  const isWelcomeStep = stepConfig.kind === 'welcome';
  const isFeatureStep = stepConfig.kind === 'feature';

  const persistProfile = useCallback(
    async (finalAnswers: OnboardingAnswers) => {
      const completedAt = new Date().toISOString();
      const profile: OnboardingProfile = {
        ...finalAnswers,
        skippedAll: false,
        language,
        completedAt,
        aiPromptContext: '',
      };
      profile.aiPromptContext = buildUserPromptContext(profile);

      // 계정 취향은 userId 기준으로 저장. 게스트 분기는 로그인 전 플로우만.
      if (userId) {
        if (accessToken) {
          try {
            const synced = await persistTravelSurveyForUser(
              profile,
              userId,
              accessToken,
            );
            completeOnboardingStore(synced, { userId });
          } catch (error) {
            console.warn('[Bu-Ting] travel survey save failed', error);
            alert({
              title: copy.travelSurveySaveError,
            });
            return;
          }
        } else {
          // 토큰 만료 시에도 guest로 새지 않고 계정 로컬 캐시 갱신
          completeOnboardingStore(profile, { userId });
          if (isEditMode || isAccountMode) {
            alert({ title: copy.travelSurveySaveError });
          }
        }
      } else {
        completeOnboardingStore(profile, { userId: null });
      }

      if (isEditMode) {
        navigation.goBack();
        return;
      }
      if (isAccountMode) {
        navigation.replace('MainTabs');
        return;
      }
      navigation.replace('Login');
    },
    [
      language,
      copy,
      navigation,
      completeOnboardingStore,
      isEditMode,
      isAccountMode,
      userId,
      accessToken,
      alert,
    ],
  );

  const showThankYouThenComplete = useCallback(
    (finalAnswers: OnboardingAnswers) => {
      if (isQuestionOnlyFlow) {
        void persistProfile(finalAnswers);
        return;
      }
      setPendingComplete(finalAnswers);
    },
    [isQuestionOnlyFlow, persistProfile],
  );

  const goNext = () => {
    if (step < stepCount - 1) {
      setStep(s => s + 1);
      return;
    }
    showThankYouThenComplete(answers);
  };

  const goPrevious = useCallback(() => {
    if (pendingComplete) {
      setPendingComplete(null);
      setStep(stepCount - 1);
      return;
    }
    if (step > 0) {
      setStep(current => current - 1);
      return;
    }
    if (isEditMode || isAccountMode) {
      navigation.goBack();
      return;
    }
    navigation.navigate('LanguageSelection');
  }, [
    isAccountMode,
    isEditMode,
    navigation,
    pendingComplete,
    step,
    stepCount,
  ]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goPrevious();
        return true;
      });
      return () => subscription.remove();
    }, [goPrevious]),
  );

  const onSkipStep = () => {
    if (stepConfig.kind === 'welcome') {
      goNext();
      return;
    }
    if (stepConfig.kind === 'question') {
      const qIndex = questionIndexForStep(flowSteps, step);
      const skipDelta = isEditMode ? 1 : 2;
      const nextStep = step + skipDelta;
      if (nextStep >= stepCount) {
        const finalAnswers =
          qIndex !== null && qIndex >= 0
            ? applyQuestionSkip(answers, qIndex)
            : answers;
        setAnswers(finalAnswers);
        showThankYouThenComplete(finalAnswers);
        return;
      }
      if (qIndex !== null && qIndex >= 0) {
        setAnswers(prev => applyQuestionSkip(prev, qIndex));
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
    // skippedAll 플래그 없이 빈 설문으로 완료 처리
    const emptySkipped: OnboardingAnswers = {
      ...emptyAnswers(),
      skippedSteps: Array.from({ length: ONBOARDING_QUESTION_COUNT }, (_, i) => i),
    };
    if (isAccountMode) {
      void persistProfile(emptySkipped);
      return;
    }
    showThankYouThenComplete(emptySkipped);
  };

  const canProceed = (): boolean => {
    if (isWelcomeStep || isFeatureStep) {
      return true;
    }
    if (stepConfig.kind !== 'question') {
      return false;
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
      const purposes = exists
        ? prev.purposes.filter(p => p !== purpose)
        : [...prev.purposes, purpose];
      return withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('purposes'), {
        purposes,
      });
    });
  };

  const renderOptions = () => {
    if (stepConfig.kind !== 'question') {
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
              setAnswers(prev =>
                withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('travelStyle'), {
                  travelStyle: opt.value,
                }),
              )
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
              setAnswers(prev =>
                withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('schedulePace'), {
                  schedulePace: opt.value as SchedulePace,
                }),
              )
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
              setAnswers(prev =>
                withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('companions'), {
                  companions: opt.value,
                }),
              )
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
              setAnswers(prev =>
                withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('luggage'), {
                  luggage: opt.value,
                }),
              )
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
              setAnswers(prev =>
                withAnsweredQuestion(
                  prev,
                  QUESTION_ORDER.indexOf('busanFamiliarity'),
                  { busanFamiliarity: opt.value as BusanFamiliarity },
                ),
              )
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
            icon={feature.icon}
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
      void persistProfile(pendingComplete);
    }
  }, [pendingComplete, persistProfile]);

  if (pendingComplete) {
    return (
      <OnboardingThankYouView
        title={copy.thankYouTitle}
        privacy={copy.thankYouPrivacy}
        waitLabel={copy.thankYouWait}
        backLabel={copy.back}
        onBack={goPrevious}
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
      backLabel={copy.back}
      onBack={goPrevious}
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
