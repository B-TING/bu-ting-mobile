import { fetchFileAccessUrl } from '../../services/files/fileUploadService';
import type { ReviewMedia } from '../../types/travelReview';
import {
  extractFileKeyFromUri,
  hasPresignedQuery,
} from './fileKey';

const resolvedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL_MS = 45 * 60 * 1000;

export async function resolveDisplayMediaUrl(
  uri: string,
  options?: {
    accessToken?: string | null;
    fileKey?: string | null;
    forceRefresh?: boolean;
  },
): Promise<string> {
  const fileKey =
    options?.fileKey?.trim() || extractFileKeyFromUri(uri) || null;

  if (!options?.forceRefresh && hasPresignedQuery(uri)) {
    return uri;
  }

  if (!fileKey) {
    return uri;
  }

  const cached = resolvedUrlCache.get(fileKey);
  if (
    !options?.forceRefresh &&
    cached &&
    cached.expiresAt > Date.now() &&
    cached.url
  ) {
    return cached.url;
  }

  try {
    const data = await fetchFileAccessUrl(options?.accessToken, fileKey);
    resolvedUrlCache.set(fileKey, {
      url: data.url,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return data.url;
  } catch {
    return uri;
  }
}

/** API `mediaUrls` → 표시용 (fileKey 부착 + 가능하면 Presigned 재발급) */
export async function resolveReviewMediaList(
  media: ReviewMedia[],
  accessToken?: string | null,
): Promise<ReviewMedia[]> {
  if (media.length === 0) {
    return media;
  }
  return Promise.all(
    media.map(async item => {
      const fileKey =
        item.fileKey?.trim() || extractFileKeyFromUri(item.uri) || undefined;
      const uri = await resolveDisplayMediaUrl(item.uri, {
        accessToken,
        fileKey,
      });
      return { ...item, uri, fileKey };
    }),
  );
}

export function mediaFromApiUrls(
  placeReviewId: string,
  mediaUrls?: string[],
): ReviewMedia[] {
  return (
    mediaUrls?.map((uri, index) => {
      const looksVideo =
        /\.(mp4|mov|webm|m4v)(\?|$)/i.test(uri) ||
        /\/uploads\/videos\//i.test(uri);
      return {
        mediaId: `api-media-${placeReviewId}-${index}`,
        type: (looksVideo ? 'video' : 'image') as 'image' | 'video',
        uri,
        fileKey: extractFileKeyFromUri(uri) ?? undefined,
      };
    }) ?? []
  );
}
