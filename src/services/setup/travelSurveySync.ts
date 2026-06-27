import { useAppStore } from '../../stores/useAppStore';
import type { OnboardingProfile } from '../../types/user';
import { logTravelSurvey } from '../../utils/setup/travelSurveyLogger';
import { shouldSyncTravelSurvey } from './travelSurveyMapper';
import {
  fetchTravelSurveyProfile,
  putTravelSurveyProfile,
  TravelSurveyServiceError,
} from './travelSurveyService';

export type TravelSurveyLoginSyncResult = {
  needsOnboardingPrompt: boolean;
};

function hasMeaningfulSurvey(profile: OnboardingProfile | null | undefined): boolean {
  if (!profile) {
    return false;
  }
  if (profile.skippedAll) {
    return true;
  }
  return (
    profile.travelStyle !== null ||
    profile.schedulePace !== null ||
    profile.companions !== null ||
    profile.luggage !== null ||
    profile.purposes.length > 0 ||
    profile.busanFamiliarity !== null
  );
}

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
      guestSkippedAll: guest?.skippedAll,
      hasLocalProfile: Boolean(localProfile),
    },
  });

  if (guest) {
    if (shouldSyncTravelSurvey(guest)) {
      logTravelSurvey('sync.guest', 'Uploading guest survey after login', { detail: { userId } });
      try {
        const synced = await putTravelSurveyProfile(
          accessToken,
          { ...guest, ownerUserId: userId },
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
        app.saveUserOnboarding(userId, { ...guest, ownerUserId: userId });
      }
    } else {
      logTravelSurvey('sync.guest.skip', 'Guest survey skippedAll — local only, no PUT', {
        detail: { userId },
      });
      app.saveUserOnboarding(userId, { ...guest, ownerUserId: userId });
    }
    app.clearGuestOnboarding();
    logTravelSurvey('sync.complete', 'Login sync finished (guest path)', {
      detail: { userId, needsOnboardingPrompt: false },
    });
    return { needsOnboardingPrompt: false };
  }

  if (localProfile && hasMeaningfulSurvey(localProfile)) {
    app.setActiveOnboarding(userId);
    if (shouldSyncTravelSurvey(localProfile)) {
      logTravelSurvey('sync.local', 'Re-uploading local survey for user', { detail: { userId } });
      try {
        const synced = await putTravelSurveyProfile(
          accessToken,
          localProfile,
          userId,
          language,
        );
        app.saveUserOnboarding(userId, synced);
        logTravelSurvey('sync.local.ok', 'Local survey synced', { detail: { userId } });
      } catch (error) {
        logTravelSurvey('sync.local.fail', 'Local survey sync failed', {
          level: 'warn',
          detail: { userId, error },
        });
      }
    } else {
      logTravelSurvey('sync.local.skip', 'Local survey skippedAll — no PUT', {
        detail: { userId },
      });
    }
    logTravelSurvey('sync.complete', 'Login sync finished (local path)', {
      detail: { userId, needsOnboardingPrompt: false },
    });
    return { needsOnboardingPrompt: false };
  }

  logTravelSurvey('sync.fetch', 'Fetching remote survey', { detail: { userId } });
  try {
    const remote = await fetchTravelSurveyProfile(accessToken, userId, language);
    if (remote && hasMeaningfulSurvey(remote)) {
      app.saveUserOnboarding(userId, remote);
      logTravelSurvey('sync.fetch.ok', 'Remote survey loaded', { detail: { userId } });
      logTravelSurvey('sync.complete', 'Login sync finished (remote path)', {
        detail: { userId, needsOnboardingPrompt: false },
      });
      return { needsOnboardingPrompt: false };
    }
    logTravelSurvey('sync.fetch.empty', 'No remote survey found', { detail: { userId } });
  } catch (error) {
    if (error instanceof TravelSurveyServiceError && error.notFound) {
      logTravelSurvey('sync.fetch.notFound', 'Remote survey not found', { detail: { userId } });
    } else {
      logTravelSurvey('sync.fetch.fail', 'Remote survey fetch failed', {
        level: 'warn',
        detail: { userId, error },
      });
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
  const withOwner: OnboardingProfile = { ...profile, ownerUserId: userId };

  logTravelSurvey('persist.start', 'Saving survey for user', {
    detail: {
      userId,
      skippedAll: withOwner.skippedAll,
      willPut: shouldSyncTravelSurvey(withOwner),
    },
  });

  if (!shouldSyncTravelSurvey(withOwner)) {
    useAppStore.getState().saveUserOnboarding(userId, withOwner);
    logTravelSurvey('persist.skip', 'Skipped survey saved locally only', { detail: { userId } });
    return withOwner;
  }

  const synced = await putTravelSurveyProfile(accessToken, withOwner, userId, language);
  useAppStore.getState().saveUserOnboarding(userId, synced);
  logTravelSurvey('persist.ok', 'Survey saved and synced', { detail: { userId } });
  return synced;
}
