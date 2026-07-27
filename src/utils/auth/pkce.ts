import { sha256 } from '@noble/hashes/sha2.js';

function getRandomValues(bytes: Uint8Array): Uint8Array {
  const crypto = (globalThis as { crypto?: { getRandomValues: (array: Uint8Array) => Uint8Array } })
    .crypto;
  if (!crypto?.getRandomValues) {
    throw new Error(
      'Secure random is not available. Ensure react-native-get-random-values is imported in index.js.',
    );
  }
  return crypto.getRandomValues(bytes);
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
    .replace(/[=]+$/, '');
}

/** RFC 7636 — 43~128자 URL-safe 랜덤 문자열 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const bytes = Uint8Array.from(codeVerifier, char => char.charCodeAt(0));
  return toBase64Url(sha256(bytes));
}
