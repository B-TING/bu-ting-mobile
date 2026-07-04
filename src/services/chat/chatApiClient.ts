import { logZoneChat } from '../../utils/chat/zoneChatLogger';
import { ApiClientError, apiRequest, bearerAuthHeaders, unwrapApiData } from '../api/apiClient';

export class ChatApiError extends ApiClientError {
  constructor(message: string, status?: number) {
    super(message, { status });
    this.name = 'ChatApiError';
  }
}

export { bearerAuthHeaders as chatAuthHeaders, unwrapApiData as unwrapChatApiBody };

type ChatApiRequestOptions = {
  method?: string;
  accessToken?: string;
  logStep: string;
  logMessage: string;
  logDetail?: Record<string, unknown>;
};

function mapChatError(error: ApiClientError): ChatApiError {
  return new ChatApiError(error.message, error.status);
}

/** 인증 채팅 REST 호출. 204/빈 본문이면 undefined, JSON이면 unwrap 후 반환 */
export async function chatApiRequest<T>(
  url: string,
  options: ChatApiRequestOptions,
): Promise<T | undefined> {
  const { method = 'GET', accessToken, logStep, logMessage, logDetail } = options;

  return apiRequest<T>(url, {
    method,
    accessToken,
    errorMessagePrefix: 'Chat request failed',
    mapError: mapChatError,
    onRequest: () => {
      logZoneChat(logStep, logMessage, { detail: { url, ...logDetail } });
    },
  });
}

/** 인증 불필요한 GET */
export async function chatApiGet<T>(
  url: string,
  options: Pick<ChatApiRequestOptions, 'logStep' | 'logMessage' | 'logDetail'>,
): Promise<T | undefined> {
  return chatApiRequest<T>(url, { ...options, method: 'GET' });
}
