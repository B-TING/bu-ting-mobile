import { useCallback, useState } from 'react';

import type { ImportPlanModalPhase, ImportPlanModalProps } from './modals/ImportPlanModal';
import type { CopyFor } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  selectActivePlan,
  useAppStore,
  usePlanStore,
  useTravelRecordStore,
  EMPTY_SOCIAL,
} from '../../stores';
import type { TravelRecord } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';

type Copy = CopyFor<'travelReview'>;

type TravelRecordNavigation = {
  navigate: (
    screen: 'PlanDetail',
    params: RootStackParamList['PlanDetail'],
  ) => void;
};

export function useTravelogueSocialActions(
  travelRecord: TravelRecord,
  copy: Copy,
  navigation: TravelRecordNavigation,
) {
  const auth = useAppStore(s => s.auth);
  const language = useAppStore(s => s.language) ?? 'ko';
  const userId = auth.userId ?? 'local-user';
  const userName = auth.displayName ?? (language === 'ko' ? '여행자' : 'Traveler');

  const social = useTravelRecordStore(
    s => s.socialByTravelRecord[travelRecord.travelRecordId] ?? EMPTY_SOCIAL,
  );
  const toggleLike = useTravelRecordStore(s => s.toggleLike);
  const addComment = useTravelRecordStore(s => s.addComment);
  const importPlanFromTravelRecord = usePlanStore(s => s.importPlanFromTravelRecord);
  const activePlan = usePlanStore(selectActivePlan);

  const [importModalPhase, setImportModalPhase] = useState<ImportPlanModalPhase | null>(null);
  const [importedPlanId, setImportedPlanId] = useState<string | null>(null);

  const closeImportModal = useCallback(() => {
    setImportModalPhase(null);
    setImportedPlanId(null);
  }, []);

  const performImport = useCallback(() => {
    const plan = importPlanFromTravelRecord(travelRecord, {
      userId,
      displayName: userName,
    });
    if (!plan) {
      setImportModalPhase('error');
      return;
    }
    setImportedPlanId(plan.planId);
    setImportModalPhase('success');
  }, [importPlanFromTravelRecord, travelRecord, userId, userName]);

  const handleToggleLike = () => {
    toggleLike(travelRecord.travelRecordId, userId);
  };

  const handleAddComment = (text: string) => {
    addComment(travelRecord.travelRecordId, {
      authorId: userId,
      authorNickname: userName,
      content: text,
    });
  };

  const handleImportPlan = () => {
    setImportModalPhase('confirm');
  };

  const handleConfirmImport = () => {
    if (activePlan && activePlan.status !== 'COMPLETED') {
      setImportModalPhase('activePlanWarning');
      return;
    }
    performImport();
  };

  const handleConfirmActivePlanImport = () => {
    performImport();
  };

  const handleGoToImportedPlan = () => {
    if (!importedPlanId) {
      return;
    }
    closeImportModal();
    navigation.navigate('PlanDetail', { planId: importedPlanId });
  };

  const importModalProps: ImportPlanModalProps = {
    phase: importModalPhase,
    copy,
    language: language as AppLanguage,
    travelRecordTitle: travelRecord.title ?? '',
    activePlanTitle: activePlan?.title,
    onClose: closeImportModal,
    onConfirm: handleConfirmImport,
    onConfirmActivePlan: handleConfirmActivePlanImport,
    onGoToPlan: handleGoToImportedPlan,
  };

  return {
    travelRecord,
    social,
    userId,
    userName,
    handleToggleLike,
    handleAddComment,
    handleImportPlan,
    importModalProps,
    // Back-compat aliases used by existing screens
    travelogue: travelRecord,
    handleToggleHelpful: handleToggleLike,
  };
}
