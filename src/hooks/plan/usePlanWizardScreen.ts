import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useFeatureUnavailableAlert } from '../../components/shared/modals';
import {
  TRAVEL_CONSTRAINT_NONE_ID,
  ACCOMMODATION_SEARCH,
  dayCountBetween,
  isValidIsoDate,
  PLAN_WIZARD_STEP_COUNT,
  PLAN_WIZARD_STEPS,
} from '../../constants/plan/planWizard';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { navigateToMainTab } from '../../navigation/navigateToMainTab';
import { requestAutoPlan, requestPlanCandidates } from '../../services/plan/planAiService';
import { createManualTravelPlan } from '../../services/travel/createManualTravelPlan';
import {
  selectOnboardingForUser,
  useAppStore,
  useAuthStore,
  usePlanStore,
  emptyWizardAnswers,
} from '../../stores';
import { selectAuthUser, selectReusableAccessToken } from '../../stores/useAuthStore';
import type { CompanionGroupType } from '../../types/planWizard';

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

export function usePlanWizardScreen(
  navigation: NativeStackNavigationProp<RootStackParamList>,
) {
  const language = useAppLanguage();
  const copy = useCopy('planWizard');
  const { showUnavailable } = useFeatureUnavailableAlert();
  const user = useAuthStore(selectAuthUser);
  const accessToken = useAuthStore(selectReusableAccessToken);
  const onboarding = useAppStore(selectOnboardingForUser(user?.userId));
  const addPlan = usePlanStore(s => s.addPlan);
  const confirmPlan = usePlanStore(s => s.confirmPlan);
  const setPlanCandidates = usePlanStore(s => s.setPlanCandidates);
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
      case 'travelStyle':
        return answers.travelStyleIds.length > 0;
      case 'constraints':
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

  const toggleTravelStyle = (id: string) => {
    setAnswers(prev => {
      const exists = prev.travelStyleIds.includes(id);
      return {
        ...prev,
        travelStyleIds: exists
          ? prev.travelStyleIds.filter(x => x !== id)
          : [...prev.travelStyleIds, id],
      };
    });
  };

  const isConstraintSelected = (id: string): boolean => {
    if (answers.otherConstraintIds.includes(TRAVEL_CONSTRAINT_NONE_ID)) {
      return id === TRAVEL_CONSTRAINT_NONE_ID;
    }
    if (id === TRAVEL_CONSTRAINT_NONE_ID) {
      return false;
    }
    if (id === 'heavy_luggage') {
      return answers.hasHeavyBaggage;
    }
    if (id === 'light_luggage') {
      return !answers.hasHeavyBaggage;
    }
    if (id === 'pets') {
      return answers.hasPets;
    }
    return answers.otherConstraintIds.includes(id);
  };

  const toggleConstraint = (id: string) => {
    setAnswers(prev => {
      if (id === TRAVEL_CONSTRAINT_NONE_ID) {
        const isNone = prev.otherConstraintIds.includes(TRAVEL_CONSTRAINT_NONE_ID);
        if (isNone) {
          return { ...prev, otherConstraintIds: [] };
        }
        return {
          ...prev,
          hasHeavyBaggage: false,
          hasPets: false,
          otherConstraintIds: [TRAVEL_CONSTRAINT_NONE_ID],
        };
      }

      const clearedNone = {
        ...prev,
        otherConstraintIds: prev.otherConstraintIds.filter(x => x !== TRAVEL_CONSTRAINT_NONE_ID),
      };

      if (id === 'heavy_luggage') {
        return { ...clearedNone, hasHeavyBaggage: true };
      }
      if (id === 'light_luggage') {
        return { ...clearedNone, hasHeavyBaggage: false };
      }
      if (id === 'pets') {
        return { ...clearedNone, hasPets: !prev.hasPets };
      }
      const exists = clearedNone.otherConstraintIds.includes(id);
      return {
        ...clearedNone,
        otherConstraintIds: exists
          ? clearedNone.otherConstraintIds.filter(x => x !== id)
          : [...clearedNone.otherConstraintIds, id],
      };
    });
  };

  const selectGenerationMode = (mode: 'auto' | 'candidates' | 'manual') => {
    if (mode !== 'manual' && isAlphaFeatureBlocked('planAi')) {
      showUnavailable(ALPHA_FEATURE_LABELS.planAi);
      return;
    }
    setAnswers(p => ({ ...p, generationMode: mode }));
  };

  const finish = async () => {
    if (
      isAlphaFeatureBlocked('planAi') &&
      answers.generationMode !== 'manual'
    ) {
      showUnavailable(ALPHA_FEATURE_LABELS.planAi);
      return;
    }

    setLoading(true);
    try {
      if (answers.generationMode === 'manual') {
        if (!accessToken) {
          Alert.alert(copy.createManualError);
          return;
        }
        const plan = await createManualTravelPlan({
          accessToken,
          answers,
          members: [
            {
              userId: user?.userId ?? 'local-user',
              nickname: user?.nickname ?? 'Traveler',
              role: 'LEADER',
            },
          ],
        });
        addPlan(plan);
        confirmPlan(plan.planId);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { tab: 'route' } }],
        });
        return;
      }

      if (answers.generationMode === 'auto') {
        const plan = await requestAutoPlan(answers, onboarding);
        addPlan(plan);
        confirmPlan(plan.planId);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { tab: 'route' } }],
        });
      } else {
        const candidates = await requestPlanCandidates(answers, onboarding);
        setPlanCandidates(candidates);
        navigation.replace('PlanCandidates');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.createManualError;
      Alert.alert(copy.createManualError, message);
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
      navigateToMainTab(navigation, 'home');
    }
  };

  const stepLabel = `${step + 1} / ${PLAN_WIZARD_STEP_COUNT}`;
  const isLast = step === PLAN_WIZARD_STEP_COUNT - 1;

  return {
    language,
    copy,
    step,
    stepConfig,
    stepLabel,
    isLast,
    answers,
    setAnswers,
    accQuery,
    setAccQuery,
    loading,
    filteredStays,
    canProceed,
    toggleId,
    toggleCompanionType,
    toggleTravelStyle,
    isConstraintSelected,
    toggleConstraint,
    selectGenerationMode,
    goNext,
    goBack,
  };
}
