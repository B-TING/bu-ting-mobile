import { useCallback, useState } from 'react';

import type { ImportPlanModalPhase, ImportPlanModalProps } from './modals/ImportPlanModal';
import type { CopyFor } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  selectActivePlan,
  useAppStore,
  usePlanStore,
  useTravelogueStore,
  EMPTY_SOCIAL,
} from '../../stores';
import type { Travelogue } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';

type Copy = CopyFor<'travelReview'>;

type TravelogueNavigation = {
  navigate: (
    screen: 'PlanDetail',
    params: RootStackParamList['PlanDetail'],
  ) => void;
};

export function useTravelogueSocialActions(
  travelogue: Travelogue,
  copy: Copy,
  navigation: TravelogueNavigation,
) {
  const auth = useAppStore(s => s.auth);
  const language = useAppStore(s => s.language) ?? 'ko';
  const userId = auth.userId ?? 'local-user';
  const userName = auth.displayName ?? (language === 'ko' ? '여행자' : 'Traveler');

  const social = useTravelogueStore(
    s => s.socialByTravelogue[travelogue.travelogueId] ?? EMPTY_SOCIAL,
  );
  const toggleHelpful = useTravelogueStore(s => s.toggleHelpful);
  const addComment = useTravelogueStore(s => s.addComment);
  const importPlanFromTravelogue = usePlanStore(s => s.importPlanFromTravelogue);
  const activePlan = usePlanStore(selectActivePlan);

  const [importModalPhase, setImportModalPhase] = useState<ImportPlanModalPhase | null>(null);
  const [importedPlanId, setImportedPlanId] = useState<string | null>(null);

  const closeImportModal = useCallback(() => {
    setImportModalPhase(null);
    setImportedPlanId(null);
  }, []);

  const performImport = useCallback(() => {
    const plan = importPlanFromTravelogue(travelogue, {
      userId,
      displayName: userName,
    });
    if (!plan) {
      setImportModalPhase('error');
      return;
    }
    setImportedPlanId(plan.planId);
    setImportModalPhase('success');
  }, [importPlanFromTravelogue, travelogue, userId, userName]);

  const handleToggleHelpful = () => {
    toggleHelpful(travelogue.travelogueId, userId);
  };

  const handleAddComment = (text: string) => {
    addComment(travelogue.travelogueId, {
      authorId: userId,
      authorName: userName,
      text,
    });
  };

  const handleImportPlan = () => {
    setImportModalPhase('confirm');
  };

  const handleConfirmImport = () => {
    if (activePlan) {
      setImportModalPhase('activePlanConfirm');
      return;
    }
    performImport();
  };

  const handleConfirmOverwrite = () => {
    performImport();
  };

  const handleViewImportedPlan = () => {
    if (importedPlanId) {
      navigation.navigate('PlanDetail', { planId: importedPlanId });
    }
    closeImportModal();
  };

  const importPlanModalProps: ImportPlanModalProps = {
    visible: importModalPhase != null,
    phase: importModalPhase ?? 'confirm',
    copy,
    travelogue,
    activePlan,
    onClose: closeImportModal,
    onConfirm: handleConfirmImport,
    onConfirmOverwrite: handleConfirmOverwrite,
    onViewPlan: handleViewImportedPlan,
  };

  return {
    social,
    userId,
    userName,
    handleToggleHelpful,
    handleAddComment,
    handleImportPlan,
    importPlanModalProps,
  };
}
