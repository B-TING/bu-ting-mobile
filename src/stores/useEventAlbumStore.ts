import { create } from 'zustand';

import { EVENT_ALBUM_SEED_POSTS } from '../constants/eventZone/eventAlbumSeed';
import type {
  EventAlbumComment,
  EventAlbumPost,
  EventAlbumSort,
  EventAlbumVisibility,
} from '../types/eventAlbum';
import type { EventParticipationRecord } from '../types/eventParticipation';
import type { EventZoneId } from '../types/eventZone';

export const EMPTY_ALBUM_POSTS: EventAlbumPost[] = [];
export const EMPTY_ALBUM_COMMENTS: EventAlbumComment[] = [];

type EventAlbumState = {
  posts: EventAlbumPost[];
  toggleLike: (postId: string) => void;
  addComment: (
    postId: string,
    input: { authorId: string; authorNickname: string; content: string },
  ) => void;
  setVisibility: (postId: string, visibility: EventAlbumVisibility) => void;
  /** approved 참여 이력을 내 앨범 게시물로 반영 (세션 mock) */
  syncFromApprovedParticipations: (
    records: EventParticipationRecord[],
    author: { userId: string; nickname: string },
  ) => void;
  /** DEV: 공개/비공개 토글 확인용 내 게시물 1개 보장 */
  ensureDemoMyPost: (author: { userId: string; nickname: string }) => void;
  clearAll: () => void;
};

function createCommentId(): string {
  return `ac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPostId(): string {
  return `ap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function postFromParticipation(
  record: EventParticipationRecord,
  author: { userId: string; nickname: string },
): EventAlbumPost {
  return {
    id: createPostId(),
    participationId: record.id,
    eventId: record.eventId,
    zoneId: record.zoneId,
    eventTitleKo: record.eventTitleKo,
    eventType: record.eventType,
    authorId: author.userId,
    authorNickname: author.nickname,
    localImageUri: record.localImageUri,
    likeCount: 0,
    likedByMe: false,
    comments: EMPTY_ALBUM_COMMENTS,
    visibility: 'public',
    completedAt: record.submittedAt ?? record.createdAt,
  };
}

export function sortAlbumPosts(
  posts: EventAlbumPost[],
  sort: EventAlbumSort,
): EventAlbumPost[] {
  if (posts.length === 0) {
    return EMPTY_ALBUM_POSTS;
  }
  const next = [...posts];
  if (sort === 'most_liked') {
    next.sort((a, b) => {
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount;
      }
      return Date.parse(b.completedAt) - Date.parse(a.completedAt);
    });
    return next;
  }
  next.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  return next;
}

/** 공용 피드: 공개 게시물 + 내 비공개 게시물 */
export function selectVisibleAlbumPosts(
  posts: EventAlbumPost[],
  viewerUserId: string,
  filters?: { zoneId?: EventZoneId; eventId?: string },
): EventAlbumPost[] {
  return posts.filter(post => {
    if (filters?.zoneId && post.zoneId !== filters.zoneId) {
      return false;
    }
    if (filters?.eventId && post.eventId !== filters.eventId) {
      return false;
    }
    if (post.visibility === 'public') {
      return true;
    }
    return Boolean(viewerUserId) && post.authorId === viewerUserId;
  });
}

export const useEventAlbumStore = create<EventAlbumState>()((set, get) => ({
  posts: EVENT_ALBUM_SEED_POSTS,
  toggleLike: postId =>
    set(state => ({
      posts: state.posts.map(post => {
        if (post.id !== postId) {
          return post;
        }
        if (post.likedByMe) {
          return {
            ...post,
            likedByMe: false,
            likeCount: Math.max(0, post.likeCount - 1),
          };
        }
        return {
          ...post,
          likedByMe: true,
          likeCount: post.likeCount + 1,
        };
      }),
    })),
  addComment: (postId, input) => {
    const content = input.content.trim();
    if (!content) {
      return;
    }
    const comment: EventAlbumComment = {
      id: createCommentId(),
      authorId: input.authorId,
      authorNickname: input.authorNickname,
      content,
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post,
      ),
    }));
  },
  setVisibility: (postId, visibility) =>
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId ? { ...post, visibility } : post,
      ),
    })),
  syncFromApprovedParticipations: (records, author) => {
    if (!author.userId) {
      return;
    }
    const approved = records.filter(record => record.status === 'approved');
    if (approved.length === 0) {
      return;
    }
    const existing = get().posts;
    const knownParticipationIds = new Set(
      existing
        .map(post => post.participationId)
        .filter((id): id is string => Boolean(id)),
    );
    const knownEventIdsForAuthor = new Set(
      existing
        .filter(post => post.authorId === author.userId)
        .map(post => post.eventId),
    );
    const toAdd: EventAlbumPost[] = [];
    for (const record of approved) {
      if (knownParticipationIds.has(record.id)) {
        continue;
      }
      if (knownEventIdsForAuthor.has(record.eventId)) {
        continue;
      }
      toAdd.push(postFromParticipation(record, author));
      knownEventIdsForAuthor.add(record.eventId);
    }
    if (toAdd.length === 0) {
      return;
    }
    set({ posts: [...toAdd, ...existing] });
  },
  ensureDemoMyPost: author => {
    if (!author.userId) {
      return;
    }
    const existing = get().posts;
    if (existing.some(post => post.authorId === author.userId)) {
      return;
    }
    const demo: EventAlbumPost = {
      id: `album-demo-${author.userId}`,
      eventId: 'demo-my-event',
      zoneId: 'SUYEONG_NAMGU',
      eventTitleKo: '광안대교 야경 담기',
      eventType: 'place_auth',
      authorId: author.userId,
      authorNickname: author.nickname,
      content: '내 인증 게시물 (데모)',
      likeCount: 2,
      likedByMe: false,
      comments: EMPTY_ALBUM_COMMENTS,
      visibility: 'public',
      completedAt: new Date().toISOString(),
    };
    set({ posts: [demo, ...existing] });
  },
  clearAll: () => set({ posts: EVENT_ALBUM_SEED_POSTS }),
}));
