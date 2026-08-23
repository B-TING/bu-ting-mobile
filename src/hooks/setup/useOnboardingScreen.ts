import { useCallback, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppAlert } from '../../components/shared/modals';
import {
  getFeatureStepContent,
  ONBOARDING_FLOW,
  ONBOARDING_QUESTION_COUNT,
  ONBOARDING_QUESTION_FLOW,
} from '../../constants/setup/onboarding';
import { useAppLanguage, useCopy } from '../../i18n';
import type { OnboardingFlowStep, OnboardingStepId } from '../../constants/setup/onboarding';
import type { RootStackParamList } from '../../navigation/types';
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
  TravelStyle,
  VisitPurpose,
} from '../../types/user';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

type OnboardingMode = NonNullable<RootStackParamList['Onboarding']>['mode'];

type UseOnboardingScreenParams = {
  navigation: Navigation;
  mode: OnboardingMode | undefined;
};

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

export function useOnboardingScreen({ navigation, mode }: UseOnboardingScreenParams) {
  const resolvedMode = mode ?? 'setup';
  const isEditMode = resolvedMode === 'edit';
  const isAccountMode = resolvedMode === 'account';
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

  const selectTravelStyle = useCallback((travelStyle: TravelStyle) => {
    setAnswers(prev =>
      withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('travelStyle'), {
        travelStyle,
      }),
    );
  }, []);

  const selectSchedulePace = useCallback((schedulePace: SchedulePace) => {
    setAnswers(prev =>
      withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('schedulePace'), {
        schedulePace,
      }),
    );
  }, []);

  const selectCompanions = useCallback(
    (companions: NonNullable<OnboardingAnswers['companions']>) => {
      setAnswers(prev =>
        withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('companions'), {
          companions,
        }),
      );
    },
    [],
  );

  const selectLuggage = useCallback(
    (luggage: NonNullable<OnboardingAnswers['luggage']>) => {
      setAnswers(prev =>
        withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('luggage'), {
          luggage,
        }),
      );
    },
    [],
  );

  const togglePurpose = useCallback((purpose: VisitPurpose) => {
    setAnswers(prev => {
      const exists = prev.purposes.includes(purpose);
      const purposes = exists
        ? prev.purposes.filter(p => p !== purpose)
        : [...prev.purposes, purpose];
      return withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('purposes'), {
        purposes,
      });
    });
  }, []);

  const selectBusanFamiliarity = useCallback((busanFamiliarity: BusanFamiliarity) => {
    setAnswers(prev =>
      withAnsweredQuestion(prev, QUESTION_ORDER.indexOf('busanFamiliarity'), {
        busanFamiliarity,
      }),
    );
  }, []);

  const featureContent =
    stepConfig.kind === 'feature'
      ? getFeatureStepContent(stepConfig.forQuestion, answers)
      : null;

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

  return {
    navigation,
    language,
    copy,
    answers,
    step,
    stepCount,
    stepConfig,
    isWelcomeStep,
    isFeatureStep,
    isEditMode,
    pendingComplete,
    featureContent,
    title,
    subtitle,
    footerLabel,
    goNext,
    goPrevious,
    onSkipStep,
    onSkipAll,
    canProceed,
    selectTravelStyle,
    selectSchedulePace,
    selectCompanions,
    selectLuggage,
    togglePurpose,
    selectBusanFamiliarity,
    handleThankYouComplete,
  };
}
