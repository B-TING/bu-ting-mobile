type ZoneChatLogLevel = 'info' | 'warn' | 'error';

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
    if (key === 'accessToken' || key === 'token') {
      safe[key] = typeof value === 'string' ? '***' : value;
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

export function logZoneChat(
  step: string,
  message: string,
  options?: { level?: ZoneChatLogLevel; detail?: unknown },
): void {
  const level = options?.level ?? 'info';
  const prefix = `[Bu-Ting ZoneChat] ${step}`;
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
