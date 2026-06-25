type WebCrypto = {
  getRandomValues: (array: Uint8Array) => Uint8Array;
  subtle: {
    digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer>;
  };
};

function getWebCrypto(): WebCrypto {
  const crypto = (globalThis as { crypto?: WebCrypto }).crypto;
  if (!crypto?.getRandomValues || !crypto.subtle?.digest) {
    throw new Error('Web Crypto API is not available');
  }
  return crypto;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  const btoaFn = (globalThis as { btoa?: (data: string) => string }).btoa;
  if (!btoaFn) {
    throw new Error('btoa is not available');
  }

  return btoaFn(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** RFC 7636 — 43~128자 URL-safe 랜덤 문자열 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  getWebCrypto().getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function generateCodeChallenge(
  codeVerifier: string,
): Promise<string> {
  const bytes = Uint8Array.from(codeVerifier, char => char.charCodeAt(0));
  const digest = await getWebCrypto().subtle.digest('SHA-256', bytes);
  return toBase64Url(new Uint8Array(digest));
}
