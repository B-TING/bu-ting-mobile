import {
  selectVisibleAlbumPosts,
  sortAlbumPosts,
} from '../src/stores/useEventAlbumStore';
import type { EventAlbumPost } from '../src/types/eventAlbum';

const basePost = (overrides: Partial<EventAlbumPost>): EventAlbumPost => ({
  id: 'p1',
  eventId: 'e1',
  zoneId: 'SUYEONG_NAMGU',
  eventTitleKo: '테스트',
  eventType: 'place_auth',
  authorId: 'u1',
  authorNickname: '테스터',
  likeCount: 0,
  likedByMe: false,
  comments: [],
  visibility: 'public',
  completedAt: '2026-09-04T12:00:00.000Z',
  ...overrides,
});

describe('event album store helpers', () => {
  it('sorts by latest and most liked', () => {
    const posts = [
      basePost({ id: 'a', likeCount: 1, completedAt: '2026-09-01T00:00:00.000Z' }),
      basePost({ id: 'b', likeCount: 5, completedAt: '2026-09-03T00:00:00.000Z' }),
      basePost({ id: 'c', likeCount: 5, completedAt: '2026-09-02T00:00:00.000Z' }),
    ];

    expect(sortAlbumPosts(posts, 'latest').map(p => p.id)).toEqual(['b', 'c', 'a']);
    expect(sortAlbumPosts(posts, 'most_liked').map(p => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('hides other users private posts but keeps mine', () => {
    const posts = [
      basePost({ id: 'pub', visibility: 'public', authorId: 'other' }),
      basePost({ id: 'priv-other', visibility: 'private', authorId: 'other' }),
      basePost({ id: 'priv-me', visibility: 'private', authorId: 'me' }),
    ];

    const visible = selectVisibleAlbumPosts(posts, 'me');
    expect(visible.map(p => p.id).sort()).toEqual(['priv-me', 'pub']);
  });
});
