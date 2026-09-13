import { LogBox } from 'react-native';

import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import type { WizardPickedPlace } from '../../types/planWizard';
import type { OnboardingProfile } from '../../types/user';
import { E2E_ACCESS_TOKEN, E2E_USER_ID } from './e2eSession';

export { E2E_ACCESS_TOKEN, E2E_USER_ID, isE2EAccessToken } from './e2eSession';

/** 장소 API 없이 AI 위저드 실패 경로를 돌리기 위한 고정 관광지 */
export const E2E_WIZARD_PLACE: WizardPickedPlace = {
  placeId: '126081',
  placeName: '해동용궁사',
  location: { lat: 35.1882, lng: 129.2232 },
  address: '부산 기장군 기장읍 용궁길 86',
};

const E2E_PROFILE: OnboardingProfile = {
  travelStyle: 'planned',
  schedulePace: 'relaxed',
  companions: 'solo',
  luggage: 'light',
  purposes: ['food'],
  busanFamiliarity: 'novice',
  skippedSteps: [],
  skippedAll: false,
  completedAt: '2026-01-01T00:00:00.000Z',
  language: 'ko',
  aiPromptContext: '',
};

/**
 * QA E2E 전용 로컬 세션. 릴리스 빌드에서는 동작하지 않습니다.
 * OAuth 없이 메인 탭·탐색 스모크를 돌리기 위한 진입점입니다.
 */
export function enterE2ESession(): boolean {
  if (!__DEV__) {
    return false;
  }

  // 가짜 토큰 401 LogBox가 FAB·탭·다음 버튼을 가린다
  LogBox.ignoreAllLogs(true);

  const app = useAppStore.getState();
  if (!app.language) {
    app.setLanguage('ko');
  }

  if (!useAppStore.getState().onboarding) {
    useAppStore.getState().completeOnboarding(
      {
        ...E2E_PROFILE,
        language: useAppStore.getState().language ?? 'ko',
        completedAt: new Date().toISOString(),
      },
      { userId: E2E_USER_ID },
    );
  }

  useAuthStore.getState().setSession({
    accessToken: E2E_ACCESS_TOKEN,
    expiresIn: 60 * 60 * 24 * 365,
    user: {
      userId: E2E_USER_ID,
      email: 'e2e@buting.test',
      nickname: 'E2E',
      provider: 'google',
    },
    rememberMe: true,
    provider: 'google',
    providerToken: null,
  });

  useAppStore.getState().login({
    userId: E2E_USER_ID,
    displayName: 'E2E',
  });

  return true;
}
