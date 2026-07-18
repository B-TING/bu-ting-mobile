import { API_BASE_URL } from '../../constants/api/apiBaseUrl';
import type { ApiServerOrigin, TravelPlan } from '../../types/travelPlan';

const LIVE_API_HOST = 'api.buting.store';

/** `API_BASE_URL` 기준으로 라이브/로컬 서버를 구분합니다. */
export function resolveApiServerOrigin(baseUrl: string = API_BASE_URL): ApiServerOrigin {
  try {
    const host = new URL(baseUrl).hostname.toLowerCase();
    if (host === LIVE_API_HOST || host.endsWith(`.${LIVE_API_HOST}`)) {
      return 'live';
    }
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '10.0.2.2' ||
      host.endsWith('.localhost')
    ) {
      return 'local';
    }
  } catch {
    // fall through
  }

  const normalized = baseUrl.toLowerCase();
  if (normalized.includes(LIVE_API_HOST)) {
    return 'live';
  }
  if (
    normalized.includes('localhost') ||
    normalized.includes('127.0.0.1') ||
    normalized.includes('10.0.2.2')
  ) {
    return 'local';
  }

  // 알 수 없는 호스트(예: ngrok)는 로컬 개발 환경으로 취급
  return 'local';
}

export function getCurrentApiServerOrigin(): ApiServerOrigin {
  return resolveApiServerOrigin(API_BASE_URL);
}

/** 현재 API 서버에서 불러온(또는 생성한) 플랜인지 여부 */
export function isPlanForCurrentApiServer(plan: TravelPlan): boolean {
  const isApiBacked = plan.source === 'api' || Boolean(plan.apiTravelId);
  if (!isApiBacked) {
    return true;
  }
  return plan.apiServerOrigin === getCurrentApiServerOrigin();
}

export function filterPlansForCurrentApiServer(plans: TravelPlan[]): TravelPlan[] {
  return plans.filter(isPlanForCurrentApiServer);
}
