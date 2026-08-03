/** S3 객체 URL / path 에서 fileKey 추출 (uploads/images/....) */
export function extractFileKeyFromUri(uri: string): string | null {
  try {
    const pathname = new URL(uri).pathname.replace(/^\/+/, '');
    const uploadsIdx = pathname.indexOf('uploads/');
    if (uploadsIdx >= 0) {
      return pathname.slice(uploadsIdx);
    }
    return pathname || null;
  } catch {
    const cleaned = uri.split('?')[0]?.split('#')[0] ?? uri;
    const uploadsIdx = cleaned.indexOf('uploads/');
    if (uploadsIdx >= 0) {
      return cleaned.slice(uploadsIdx);
    }
    return null;
  }
}

/** Presigned GET 서명 쿼리 여부 */
export function hasPresignedQuery(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return (
      parsed.searchParams.has('X-Amz-Signature') ||
      parsed.searchParams.has('X-Amz-Credential') ||
      parsed.searchParams.has('Signature')
    );
  } catch {
    return /[?&](X-Amz-Signature|X-Amz-Credential|Signature)=/i.test(uri);
  }
}
