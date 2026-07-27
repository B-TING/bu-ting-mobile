import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ImportPlanModalPhase, ImportPlanModalProps } from './modals/ImportPlanModal';
import type { CopyFor } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  createTravelRecordComment,
  deleteTravelRecordComment,
  fetchTravelRecordComments,
  likeTravelRecord,
  unlikeTravelRecord,
  updateTravelRecordComment,
} from '../../services/travel/travelRecordService';
import {
  selectActivePlan,
  useAppStore,
  useAuthStore,
  usePlanStore,
} from '../../stores';
import { useTravelRecordBookmarkStore } from '../../stores/useTravelRecordBookmarkStore';
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
  const [bookmarking, setBookmarking] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const bookmarkedByMe = useTravelRecordBookmarkStore(state =>
    state.isBookmarked(travelRecord.travelRecordId),
  );
  const hydrateBookmarks = useTravelRecordBookmarkStore(state => state.hydrate);
  const toggleBookmarkInStore = useTravelRecordBookmarkStore(
    state => state.toggleBookmark,
  );

  useEffect(() => {
    void hydrateBookmarks(accessToken);
  }, [accessToken, hydrateBookmarks]);

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

  const handleUpdateComment = useCallback(
    async (commentId: string, text: string) => {
      const content = text.trim();
      if (!content) {
        return;
      }
      if (!accessToken?.trim() || !userId) {
        requireLogin();
        return;
      }
      if (commentId.startsWith('temp-cmt-')) {
        throw new TravelogueSocialError(copy.socialCommentUpdateFailed);
      }
      if (commenting) {
        return;
      }
      const prev = comments.find(c => c.commentId === commentId);
      if (!prev) {
        return;
      }
      setComments(list =>
        list.map(c =>
          c.commentId === commentId
            ? { ...c, content, updatedAt: new Date().toISOString() }
            : c,
        ),
      );
      setCommenting(true);
      try {
        const updated = await updateTravelRecordComment(
          accessToken,
          travelRecord.travelRecordId,
          commentId,
          { content },
        );
        setComments(list =>
          list.map(c => (c.commentId === commentId ? updated : c)),
        );
      } catch (error) {
        setComments(list =>
          list.map(c => (c.commentId === commentId ? prev : c)),
        );
        const message =
          error instanceof Error && error.message
            ? error.message
            : copy.socialCommentUpdateFailed;
        throw new TravelogueSocialError(message);
      } finally {
        setCommenting(false);
      }
    },
    [
      accessToken,
      userId,
      commenting,
      comments,
      travelRecord.travelRecordId,
      requireLogin,
      copy.socialCommentUpdateFailed,
    ],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!accessToken?.trim() || !userId) {
        requireLogin();
        return;
      }
      if (commentId.startsWith('temp-cmt-')) {
        setComments(list => list.filter(c => c.commentId !== commentId));
        return;
      }
      if (commenting) {
        return;
      }
      const prev = comments;
      setComments(list => list.filter(c => c.commentId !== commentId));
      setCommenting(true);
      try {
        await deleteTravelRecordComment(
          accessToken,
          travelRecord.travelRecordId,
          commentId,
        );
      } catch (error) {
        setComments(prev);
        const message =
          error instanceof Error && error.message
            ? error.message
            : copy.socialCommentDeleteFailed;
        throw new TravelogueSocialError(message);
      } finally {
        setCommenting(false);
      }
    },
    [
      accessToken,
      userId,
      commenting,
      comments,
      travelRecord.travelRecordId,
      requireLogin,
      copy.socialCommentDeleteFailed,
    ],
  );

  const handleToggleBookmark = useCallback(async () => {
    if (!accessToken?.trim() || !userId) {
      requireLogin();
      return;
    }
    if (bookmarking) {
      return;
    }
    setBookmarking(true);
    try {
      const nextBookmarked = await toggleBookmarkInStore(
        accessToken,
        travelRecord.travelRecordId,
      );
      onPatchRef.current?.({ bookmarkedByMe: nextBookmarked });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : copy.socialBookmarkFailed;
      throw new TravelogueSocialError(message);
    } finally {
      setBookmarking(false);
    }
  }, [
    accessToken,
    userId,
    bookmarking,
    travelRecord.travelRecordId,
    toggleBookmarkInStore,
    requireLogin,
    copy.socialBookmarkFailed,
  ]);

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
    bookmarking,
    bookmarkedByMe,
    reloadComments,
    handleToggleLike,
    handleToggleBookmark,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleImportPlan,
    importModalProps,
    travelogue: travelRecord,
    handleToggleHelpful: handleToggleLike,
  };
}
