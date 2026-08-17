type AuthLogLevel = 'info' | 'warn' | 'error';

function maskToken(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.length <= 12) {
    return '***';
  }
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`;
}

function sanitizeDetail(detail: unknown): string | undefined {
  if (detail == null) {
    return undefined;
  }
  if (detail instanceof Error) {
    return detail.message;
  }
  if (typeof detail !== 'object') {
    return String(detail);
  }

  const record = detail as Record<string, unknown>;
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (
      key === 'accessToken' ||
      key === 'idToken' ||
      key === 'refreshToken' ||
      key === 'providerToken' ||
      key === 'codeVerifier' ||
      key === 'idToken'
    ) {
      safe[key] = maskToken(typeof value === 'string' ? value : undefined);
      continue;
    }
    safe[key] = value;
  }

  try {
    return JSON.stringify(safe);
  } catch {
    return String(detail);
  }
}

/** Metro 터미널(`npm start`)에 `[Bu-Ting Auth]` 로그를 출력합니다. */
export function logAuth(
  step: string,
  message: string,
  options?: {
    level?: AuthLogLevel;
    detail?: unknown;
  },
): void {
  const level = options?.level ?? 'info';
  const prefix = `[Bu-Ting Auth] ${step}`;
  const detail = sanitizeDetail(options?.detail);
  const payload = detail ? `${message} | ${detail}` : message;

  if (level === 'error') {
    console.error(prefix, payload);
  } else if (level === 'warn') {
    console.warn(prefix, payload);
  } else {
    console.log(prefix, payload);
  }
}
