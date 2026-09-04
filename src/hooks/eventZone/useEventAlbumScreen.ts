import { useEffect, useMemo, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';
import { useCopy } from '../../i18n';
import { useAuthStore, useEventParticipationStore } from '../../stores';
import { selectAuthUser } from '../../stores/useAuthStore';
import {
  selectVisibleAlbumPosts,
  sortAlbumPosts,
  useEventAlbumStore,
} from '../../stores/useEventAlbumStore';
import type { EventAlbumSort } from '../../types/eventAlbum';
import type { EventZoneId } from '../../types/eventZone';

type Params = {
  zoneId?: EventZoneId;
  eventId?: string;
};

type Navigation = NativeStackNavigationProp<RootStackParamList, 'EventAlbum'>;

export function useEventAlbumScreen(navigation: Navigation, params: Params) {
  const copy = useCopy('eventGame');
  const authUser = useAuthStore(selectAuthUser);
  const userId = authUser?.userId ?? '';
  const nickname =
    authUser?.nickname?.trim() || (copy.albumGuestName);

  const posts = useEventAlbumStore(s => s.posts);
  const toggleLike = useEventAlbumStore(s => s.toggleLike);
  const addComment = useEventAlbumStore(s => s.addComment);
  const setVisibility = useEventAlbumStore(s => s.setVisibility);
  const syncFromApprovedParticipations = useEventAlbumStore(
    s => s.syncFromApprovedParticipations,
  );
  const ensureDemoMyPost = useEventAlbumStore(s => s.ensureDemoMyPost);
  const participationRecords = useEventParticipationStore(s => s.records);

  const [sort, setSort] = useState<EventAlbumSort>('latest');
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  useEffect(() => {
    syncFromApprovedParticipations(participationRecords, {
      userId,
      nickname,
    });
    if (__DEV__ && userId) {
      ensureDemoMyPost({ userId, nickname });
    }
  }, [
    participationRecords,
    userId,
    nickname,
    syncFromApprovedParticipations,
    ensureDemoMyPost,
  ]);

  const visiblePosts = useMemo(
    () =>
      selectVisibleAlbumPosts(posts, userId, {
        zoneId: params.zoneId,
        eventId: params.eventId,
      }),
    [posts, userId, params.zoneId, params.eventId],
  );

  const sortedPosts = useMemo(
    () => sortAlbumPosts(visiblePosts, sort),
    [visiblePosts, sort],
  );

  const commentPost = useMemo(
    () => sortedPosts.find(post => post.id === commentPostId) ?? null,
    [sortedPosts, commentPostId],
  );

  const handleToggleVisibility = (postId: string, isPrivate: boolean) => {
    setVisibility(postId, isPrivate ? 'public' : 'private');
  };

  const handleSubmitComment = (text: string) => {
    if (!commentPostId || !userId) {
      return;
    }
    addComment(commentPostId, {
      authorId: userId,
      authorNickname: nickname,
      content: text,
    });
  };

  return {
    copy,
    userId,
    sort,
    setSort,
    sortedPosts,
    commentPost,
    openComment: (postId: string) => setCommentPostId(postId),
    closeComment: () => setCommentPostId(null),
    toggleLike,
    handleToggleVisibility,
    handleSubmitComment,
    goBack: () => navigation.goBack(),
  };
}
