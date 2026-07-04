import type { ApiEnvelope, ApiErrorResponse } from '../../types/auth';
import { logZoneChat } from '../../utils/chat/zoneChatLogger';

export class ChatApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
  }
}

export function chatAuthHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export function unwrapChatApiBody<T>(body: ApiEnvelope<T> | ApiErrorResponse | T | null): T {
  if (body && typeof body === 'object' && 'data' in body && (body as ApiEnvelope<T>).data != null) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}

async function parseChatErrorMessage(res: Response, body: unknown): Promise<string> {
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof (body as { message: unknown }).message === 'string'
  ) {
    return (body as { message: string }).message;
  }
  return `Chat request failed (${res.status})`;
}

type ChatApiRequestOptions = {
  method?: string;
  accessToken?: string;
  logStep: string;
  logMessage: string;
  logDetail?: Record<string, unknown>;
};

/** 인증 채팅 REST 호출. 204/빈 본문이면 undefined, JSON이면 unwrap 후 반환 */
export async function chatApiRequest<T>(
  url: string,
  options: ChatApiRequestOptions,
): Promise<T | undefined> {
  const { method = 'GET', accessToken, logStep, logMessage, logDetail } = options;

  logZoneChat(logStep, logMessage, { detail: { url, ...logDetail } });

  const headers: Record<string, string> = {};
  if (accessToken) {
    Object.assign(headers, chatAuthHeaders(accessToken));
  }

  const res = await fetch(url, { method, headers });
  const body = (await res.json().catch(() => null)) as
    | ApiEnvelope<T>
    | ApiErrorResponse
    | T
    | null;

  if (!res.ok) {
    throw new ChatApiError(await parseChatErrorMessage(res, body), res.status);
  }

  if (res.status === 204 || body == null) {
    return undefined;
  }

  return unwrapChatApiBody<T>(body);
}

/** 인증 불필요한 GET */
export async function chatApiGet<T>(
  url: string,
  options: Pick<ChatApiRequestOptions, 'logStep' | 'logMessage' | 'logDetail'>,
): Promise<T | undefined> {
  return chatApiRequest<T>(url, { ...options, method: 'GET' });
}
