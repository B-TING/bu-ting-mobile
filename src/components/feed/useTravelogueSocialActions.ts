import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import {
  selectAuthUser,
  selectReusableAccessToken,
} from '../../stores/useAuthStore';
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

export class TravelogueSocialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TravelogueSocialError';
  }
}

export function useTravelogueSocialActions(
  travelRecord: TravelRecord,
  copy: Copy,
  navigation: TravelRecordNavigation,
  options?: {
    onTravelRecordPatch?: (patch: Partial<TravelRecord>) => void;
  },
) {
  const language = useAppStore(s => s.language) ?? 'ko';
  const accessToken = useAuthStore(selectReusableAccessToken);
  const authUser = useAuthStore(selectAuthUser);
  const userId = authUser?.userId ?? '';
  const userName =
    authUser?.nickname?.trim() ||
    (language === 'ko' ? '여행자' : 'Traveler');

  const onPatchRef = useRef(options?.onTravelRecordPatch);
  onPatchRef.current = options?.onTravelRecordPatch;

  const [comments, setComments] = useState<TravelRecordComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(travelRecord.likeCount);
  const [likedByMe, setLikedByMe] = useState(Boolean(travelRecord.likedByMe));
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    setLikeCount(travelRecord.likeCount);
    setLikedByMe(Boolean(travelRecord.likedByMe));
  }, [travelRecord.likeCount, travelRecord.likedByMe, travelRecord.travelRecordId]);

  const reloadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const list = await fetchTravelRecordComments(travelRecord.travelRecordId);
      setComments(list);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [travelRecord.travelRecordId]);

  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
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
      })
      .finally(() => {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [travelRecord.travelRecordId]);

  const social: TravelRecordSocial = useMemo(
    () => ({
      likedUserIds: likedByMe && userId ? [userId] : [],
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
      userId: userId || 'guest',
      displayName: userName,
    });
    if (!plan) {
      setImportModalPhase('error');
      return;
    }
    setImportedPlanId(plan.planId);
    setImportModalPhase('success');
  }, [importPlanFromTravelRecord, travelRecord, userId, userName]);

  const requireLogin = useCallback(() => {
    throw new TravelogueSocialError(copy.socialLoginRequired);
  }, [copy.socialLoginRequired]);

  const handleToggleLike = useCallback(async () => {
    if (!accessToken?.trim() || !userId) {
      requireLogin();
      return;
    }
    if (liking) {
      return;
    }
    const nextLiked = !likedByMe;
    const prevCount = likeCount;
    const prevLiked = likedByMe;
    const optimisticCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
    setLikedByMe(nextLiked);
    setLikeCount(optimisticCount);
    setLiking(true);
    try {
      let nextCount = optimisticCount;
      if (nextLiked) {
        const res = await likeTravelRecord(accessToken, travelRecord.travelRecordId);
        if (typeof res.likeCount === 'number') {
          nextCount = res.likeCount;
          setLikeCount(res.likeCount);
        }
      } else {
        await unlikeTravelRecord(accessToken, travelRecord.travelRecordId);
      }
      onPatchRef.current?.({
        likedByMe: nextLiked,
        likeCount: nextCount,
      });
    } catch (error) {
      setLikedByMe(prevLiked);
      setLikeCount(prevCount);
      const message =
        error instanceof Error && error.message
          ? error.message
          : copy.socialLikeFailed;
      throw new TravelogueSocialError(message);
    } finally {
      setLiking(false);
    }
  }, [
    accessToken,
    userId,
    liking,
    likedByMe,
    likeCount,
    travelRecord.travelRecordId,
    requireLogin,
    copy.socialLikeFailed,
  ]);

  const handleAddComment = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content) {
        return;
      }
      if (!accessToken?.trim() || !userId) {
        requireLogin();
        return;
      }
      if (commenting) {
        return;
      }
      const tempId = `temp-cmt-${Date.now()}`;
      const optimistic: TravelRecordComment = {
        commentId: tempId,
        travelRecordId: travelRecord.travelRecordId,
        authorId: userId,
        authorNickname: userName,
        authorProfileImageUrl: null,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setComments(prev => [...prev, optimistic]);
      setCommenting(true);
      try {
        const created = await createTravelRecordComment(
          accessToken,
          travelRecord.travelRecordId,
          { content },
        );
        setComments(prev =>
          prev.map(c => (c.commentId === tempId ? created : c)),
        );
      } catch (error) {
        setComments(prev => prev.filter(c => c.commentId !== tempId));
        const message =
          error instanceof Error && error.message
            ? error.message
            : copy.socialCommentFailed;
        throw new TravelogueSocialError(message);
      } finally {
        setCommenting(false);
      }
    },
    [
      accessToken,
      userId,
      userName,
      commenting,
      travelRecord.travelRecordId,
      requireLogin,
      copy.socialCommentFailed,
    ],
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
    commentsLoading,
    commenting,
    liking,
    reloadComments,
    handleToggleLike,
    handleAddComment,
    handleImportPlan,
    importModalProps,
    travelogue: travelRecord,
    handleToggleHelpful: handleToggleLike,
  };
}
