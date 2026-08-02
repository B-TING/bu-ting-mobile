import { useEffect, useState } from 'react';

import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';
import { resolveDisplayMediaUrl } from '../media/resolveMediaUrl';

/** http(s) / 로컬 URI 를 표시용으로 해석 (S3 서명 재발급 포함) */
export function useResolvedDisplayUri(
  uri: string,
  fileKey?: string | null,
): string {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const [displayUri, setDisplayUri] = useState(uri);

  useEffect(() => {
    let cancelled = false;
    setDisplayUri(uri);

    const isRemote = uri.startsWith('http://') || uri.startsWith('https://');
    if (!isRemote) {
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      const resolved = await resolveDisplayMediaUrl(uri, {
        accessToken,
        fileKey,
      });
      if (!cancelled && resolved) {
        setDisplayUri(resolved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri, fileKey, accessToken]);

  return displayUri;
}

export async function refreshDisplayUri(
  uri: string,
  options?: { accessToken?: string | null; fileKey?: string | null },
): Promise<string> {
  return resolveDisplayMediaUrl(uri, {
    ...options,
    forceRefresh: true,
  });
}
