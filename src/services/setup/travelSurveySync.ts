import { useAppStore } from '../../stores/useAppStore';
import type { OnboardingProfile } from '../../types/user';
import { logTravelSurvey } from '../../utils/setup/travelSurveyLogger';
import {
  createEmptyOnboardingProfile,
  hasAnsweredSurvey,
} from './travelSurveyMapper';
import {
  fetchTravelSurveyProfile,
  putTravelSurveyProfile,
  TravelSurveyServiceError,
} from './travelSurveyService';

export type TravelSurveyLoginSyncResult = {
  needsOnboardingPrompt: boolean;
};

/** 로그인 직후 게스트 설문 업로드·서버 조회·계정별 로컬 캐시 동기화 */
export async function syncTravelSurveyAfterLogin(
  userId: string,
  accessToken: string,
): Promise<TravelSurveyLoginSyncResult> {
  const app = useAppStore.getState();
  const language = app.language ?? 'ko';
  const guest = app.guestOnboarding;
  const localProfile = app.onboardingByUserId[userId] ?? null;

  logTravelSurvey('sync.start', 'Login sync started', {
    detail: {
      userId,
      hasGuest: Boolean(guest),
      hasLocalProfile: Boolean(localProfile),
      localHasAnswers: hasAnsweredSurvey(localProfile),
    },
  });

  if (guest) {
    if (hasAnsweredSurvey(guest)) {
      logTravelSurvey('sync.guest', 'Uploading guest survey after login', { detail: { userId } });
      try {
        const synced = await putTravelSurveyProfile(
          accessToken,
          { ...guest, skippedAll: false, ownerUserId: userId },
          userId,
          language,
        );
        app.saveUserOnboarding(userId, synced);
        logTravelSurvey('sync.guest.ok', 'Guest survey uploaded', { detail: { userId } });
      } catch (error) {
        logTravelSurvey('sync.guest.fail', 'Guest survey upload failed — saved locally', {
          level: 'warn',
          detail: { userId, error },
        });
        app.saveUserOnboarding(userId, {
          ...guest,
          skippedAll: false,
          ownerUserId: userId,
        });
      }
    } else {
      // skip / 빈 설문 — 로컬에 skippedAll 남기지 않고 비움
      app.saveUserOnboarding(userId, createEmptyOnboardingProfile(language, userId));
      logTravelSurvey('sync.guest.empty', 'Guest had no answers — saved empty profile', {
        detail: { userId },
      });
    }
    app.clearGuestOnboarding();
    logTravelSurvey('sync.complete', 'Login sync finished (guest path)', {
      detail: { userId, needsOnboardingPrompt: false },
    });
    return { needsOnboardingPrompt: false };
  }

  logTravelSurvey('sync.fetch', 'Fetching remote survey', { detail: { userId } });
  try {
    const remote = await fetchTravelSurveyProfile(accessToken, userId, language);
    if (remote && hasAnsweredSurvey(remote)) {
      app.saveUserOnboarding(userId, remote);
      logTravelSurvey('sync.fetch.ok', 'Remote survey loaded', { detail: { userId } });
      logTravelSurvey('sync.complete', 'Login sync finished (remote path)', {
        detail: { userId, needsOnboardingPrompt: false },
      });
      return { needsOnboardingPrompt: false };
    }

    // 서버에 데이터 없음 → 로컬도 비움
    app.saveUserOnboarding(userId, createEmptyOnboardingProfile(language, userId));
    logTravelSurvey('sync.fetch.empty', 'No remote survey — cleared local', {
      detail: { userId },
    });
  } catch (error) {
    if (error instanceof TravelSurveyServiceError && error.notFound) {
      app.saveUserOnboarding(userId, createEmptyOnboardingProfile(language, userId));
      logTravelSurvey('sync.fetch.notFound', 'Remote survey not found — cleared local', {
        detail: { userId },
      });
    } else {
      logTravelSurvey('sync.fetch.fail', 'Remote survey fetch failed', {
        level: 'warn',
        detail: { userId, error },
      });
      if (localProfile && hasAnsweredSurvey(localProfile)) {
        app.setActiveOnboarding(userId);
        return { needsOnboardingPrompt: false };
      }
    }
  }

  app.setActiveOnboarding(userId);
  logTravelSurvey('sync.complete', 'Login sync finished — onboarding prompt needed', {
    detail: { userId, needsOnboardingPrompt: true },
  });
  return { needsOnboardingPrompt: true };
}

export async function persistTravelSurveyForUser(
  profile: OnboardingProfile,
  userId: string,
  accessToken: string,
): Promise<OnboardingProfile> {
  const language = profile.language ?? useAppStore.getState().language ?? 'ko';
  const withOwner: OnboardingProfile = {
    ...profile,
    skippedAll: false,
    ownerUserId: userId,
  };

  logTravelSurvey('persist.start', 'Saving survey for user', {
    detail: {
      userId,
      hasAnswers: hasAnsweredSurvey(withOwner),
    },
  });

  if (!hasAnsweredSurvey(withOwner)) {
    const empty = createEmptyOnboardingProfile(language, userId);
    useAppStore.getState().saveUserOnboarding(userId, empty);
    logTravelSurvey('persist.empty', 'Empty survey saved locally', { detail: { userId } });
    return empty;
  }

  const synced = await putTravelSurveyProfile(accessToken, withOwner, userId, language);
  useAppStore.getState().saveUserOnboarding(userId, synced);
  logTravelSurvey('persist.ok', 'Survey saved and synced', { detail: { userId } });
  return synced;
}
