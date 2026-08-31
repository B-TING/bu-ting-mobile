import { parseInviteTokenFromUrl } from '../src/utils/travel/parseInviteToken';

describe('parseInviteTokenFromUrl', () => {
  it('extracts token from inviteLink query', () => {
    expect(
      parseInviteTokenFromUrl('https://yourdomain.com/invite?token=invite-token'),
    ).toBe('invite-token');
  });

  it('extracts token when other query params exist', () => {
    expect(
      parseInviteTokenFromUrl(
        'https://buting.store/invite?foo=1&token=abc123&bar=2',
      ),
    ).toBe('abc123');
  });

  it('accepts a bare token string', () => {
    expect(parseInviteTokenFromUrl('invite-token')).toBe('invite-token');
  });

  it('returns null for empty or URL without token', () => {
    expect(parseInviteTokenFromUrl('')).toBeNull();
    expect(parseInviteTokenFromUrl('   ')).toBeNull();
    expect(parseInviteTokenFromUrl('https://yourdomain.com/invite')).toBeNull();
    expect(parseInviteTokenFromUrl('https://yourdomain.com/path/only')).toBeNull();
  });
});
