/** QA E2E 전용 로컬 세션 식별자. 릴리스 빌드에서는 쓰이지 않습니다. */
export const E2E_USER_ID = 'e2e-qa-user';
export const E2E_ACCESS_TOKEN = 'e2e-local-token';

export function isE2EAccessToken(token: string | null | undefined): boolean {
  return __DEV__ && token === E2E_ACCESS_TOKEN;
}
