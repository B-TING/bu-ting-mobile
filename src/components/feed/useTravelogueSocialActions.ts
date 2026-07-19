import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ImportPlanModalPhase, ImportPlanModalProps } from './modals/ImportPlanModal';
import type { CopyFor } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  createTravelRecordComment,
  fetchTravelRecordComments,
  likeTravelRecord,
  unlikeTravelRecord,
} from '../../services/travel/travelRecordService';
import {
  selectActivePlan,
  useAppStore,
  useAuthStore,
  usePlanStore,
} from '../../stores';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import type {
  TravelRecord,
  TravelRecordComment,
  TravelRecordSocial,
} from '../../types/travelReview';
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
  options?: {
    onTravelRecordPatch?: (patch: Partial<TravelRecord>) => void;
  },
) {
  const auth = useAppStore(s => s.auth);
  const language = useAppStore(s => s.language) ?? 'ko';
  const accessToken = useAuthStore(selectReusableAccessToken);
  const userId = auth.userId ?? 'local-user';
  const userName = auth.displayName ?? (language === 'ko' ? '여행자' : 'Traveler');

  const [comments, setComments] = useState<TravelRecordComment[]>([]);
  const [likeCount, setLikeCount] = useState(travelRecord.likeCount);
  const [likedByMe, setLikedByMe] = useState(Boolean(travelRecord.likedByMe));
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    setLikeCount(travelRecord.likeCount);
    setLikedByMe(Boolean(travelRecord.likedByMe));
  }, [travelRecord.likeCount, travelRecord.likedByMe, travelRecord.travelRecordId]);

  useEffect(() => {
    let cancelled = false;
    void fetchTravelRecordComments(travelRecord.travelRecordId)
      .then(list => {
        if (!cancelled) {
          setComments(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setComments([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [travelRecord.travelRecordId]);

  const social: TravelRecordSocial = useMemo(
    () => ({
      likedUserIds: likedByMe ? [userId] : [],
      comments,
      likeCount,
      likedByMe,
    }),
    [likedByMe, userId, comments, likeCount],
  );

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

  const handleToggleLike = useCallback(async () => {
    if (!accessToken?.trim() || liking) {
      return;
    }
    const nextLiked = !likedByMe;
    const prevCount = likeCount;
    const prevLiked = likedByMe;
    setLikedByMe(nextLiked);
    setLikeCount(c => Math.max(0, c + (nextLiked ? 1 : -1)));
    setLiking(true);
    try {
      if (nextLiked) {
        const res = await likeTravelRecord(accessToken, travelRecord.travelRecordId);
        if (typeof res?.likeCount === 'number') {
          setLikeCount(res.likeCount);
        }
      } else {
        await unlikeTravelRecord(accessToken, travelRecord.travelRecordId);
      }
      options?.onTravelRecordPatch?.({
        likedByMe: nextLiked,
        likeCount: nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1),
      });
    } catch {
      setLikedByMe(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLiking(false);
    }
  }, [
    accessToken,
    liking,
    likedByMe,
    likeCount,
    travelRecord.travelRecordId,
    options,
  ]);

  const handleAddComment = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || !accessToken?.trim()) {
        return;
      }
      const created = await createTravelRecordComment(
        accessToken,
        travelRecord.travelRecordId,
        { content },
      );
      setComments(prev => [...prev, created]);
    },
    [accessToken, travelRecord.travelRecordId],
  );

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
    travelogue: travelRecord,
    handleToggleHelpful: handleToggleLike,
  };
}
