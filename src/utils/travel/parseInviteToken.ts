/**
 * 초대 링크(또는 raw token)에서 OpenAPI `InviteToken` query 값을 추출합니다.
 * 예: `https://yourdomain.com/invite?token=invite-token`
 */
export function parseInviteTokenFromUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) {
    return null;
  }

  const fromSearch = (search: string): string | null => {
    const token = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      .get('token')
      ?.trim();
    return token || null;
  };

  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('token')?.trim();
    if (fromQuery) {
      return fromQuery;
    }
  } catch {
    // relative / bare string
  }

  const qIndex = raw.indexOf('?');
  if (qIndex >= 0) {
    return fromSearch(raw.slice(qIndex));
  }

  if (/^https?:\/\//i.test(raw) || raw.includes('://') || raw.includes('/')) {
    return null;
  }

  if (/\s/.test(raw)) {
    return null;
  }

  return raw;
}
