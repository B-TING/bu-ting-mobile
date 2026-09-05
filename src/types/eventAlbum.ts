import type { EventZoneId, ZoneEventType } from './eventZone';

export type EventAlbumVisibility = 'public' | 'private';

export type EventAlbumSort = 'latest' | 'most_liked';

export type EventAlbumAuthType = Extract<ZoneEventType, 'PLACE_AUTH' | 'OBJECT_AUTH'>;

export type EventAlbumComment = {
  id: string;
  authorId: string;
  authorNickname: string;
  content: string;
  createdAt: string;
};

/** Phase 2 이벤트 앨범 게시물 (세션 mock) */
export type EventAlbumPost = {
  id: string;
  /** 내 참여 이력과 연결될 때 */
  participationId?: string;
  eventId: string;
  zoneId: EventZoneId;
  eventTitleKo: string;
  eventType: EventAlbumAuthType;
  authorId: string;
  authorNickname: string;
  content?: string;
  localImageUri?: string;
  likeCount: number;
  likedByMe: boolean;
  comments: EventAlbumComment[];
  visibility: EventAlbumVisibility;
  completedAt: string;
};
