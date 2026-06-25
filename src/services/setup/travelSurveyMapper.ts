import type { TravelSurveyProfileRequest, TravelSurveyProfileResponse } from '../../types/travelSurvey';
import type {
  AppLanguage,
  BusanFamiliarity,
  CompanionType,
  LuggageLevel,
  OnboardingProfile,
  SchedulePace,
  TravelStyle,
  VisitPurpose,
} from '../../types/user';
import { buildUserPromptContext } from './promptBuilder';

const PURPOSE_VALUES: VisitPurpose[] = [
  'food',
  'scenery',
  'culture',
  'shopping',
  'nightlife',
  'relaxation',
];

function toTravelStyle(isPlanned: boolean | null | undefined): TravelStyle | null {
  if (isPlanned === true) {
    return 'planned';
  }
  if (isPlanned === false) {
    return 'spontaneous';
  }
  return null;
}

function toSchedulePace(isRelaxed: boolean | null | undefined): SchedulePace | null {
  if (isRelaxed === true) {
    return 'relaxed';
  }
  if (isRelaxed === false) {
    return 'packed';
  }
  return null;
}

function toCompanions(isSolo: boolean | null | undefined): CompanionType | null {
  if (isSolo === true) {
    return 'solo';
  }
  if (isSolo === false) {
    return 'group';
  }
  return null;
}

function toLuggage(isLight: boolean | null | undefined): LuggageLevel | null {
  if (isLight === true) {
    return 'light';
  }
  if (isLight === false) {
    return 'heavy';
  }
  return null;
}

function toFamiliarity(isFamiliar: boolean | null | undefined): BusanFamiliarity | null {
  if (isFamiliar === true) {
    return 'familiar';
  }
  if (isFamiliar === false) {
    return 'novice';
  }
  return null;
}

function parsePurposes(purposes: string[] | undefined): VisitPurpose[] {
  if (!purposes?.length) {
    return [];
  }
  const allowed = new Set(PURPOSE_VALUES);
  return purposes.filter((p): p is VisitPurpose => allowed.has(p as VisitPurpose));
}

function parseLanguage(value: string | undefined, fallback: AppLanguage): AppLanguage {
  if (value === 'ko' || value === 'en' || value === 'ja' || value === 'zh') {
    return value;
  }
  return fallback;
}

export function toTravelSurveyRequest(profile: OnboardingProfile): TravelSurveyProfileRequest {
  const base: TravelSurveyProfileRequest = {
    preferredLanguage: profile.language,
    skippedSteps: profile.skippedSteps,
    skippedAll: profile.skippedAll,
    purposes: profile.skippedAll ? [] : profile.purposes,
  };

  if (profile.skippedAll) {
    return base;
  }

  return {
    ...base,
    isPlanned:
      profile.travelStyle === 'planned'
        ? true
        : profile.travelStyle === 'spontaneous'
          ? false
          : null,
    isRelaxed:
      profile.schedulePace === 'relaxed'
        ? true
        : profile.schedulePace === 'packed'
          ? false
          : null,
    isSolo:
      profile.companions === 'solo'
        ? true
        : profile.companions === 'group'
          ? false
          : null,
    isLight:
      profile.luggage === 'light' ? true : profile.luggage === 'heavy' ? false : null,
    isFamiliar:
      profile.busanFamiliarity === 'familiar'
        ? true
        : profile.busanFamiliarity === 'novice'
          ? false
          : null,
  };
}

export function fromTravelSurveyResponse(
  response: TravelSurveyProfileResponse,
  fallbackLanguage: AppLanguage,
  ownerUserId: string,
): OnboardingProfile {
  const language = parseLanguage(response.preferredLanguage, fallbackLanguage);
  const profile: OnboardingProfile = {
    travelStyle: toTravelStyle(response.isPlanned),
    schedulePace: toSchedulePace(response.isRelaxed),
    companions: toCompanions(response.isSolo),
    luggage: toLuggage(response.isLight),
    busanFamiliarity: toFamiliarity(response.isFamiliar),
    purposes: parsePurposes(response.purposes),
    skippedSteps: response.skippedSteps ?? [],
    skippedAll: response.skippedAll ?? false,
    language,
    completedAt: response.completedAt ?? new Date().toISOString(),
    aiPromptContext: response.aiPromptContext ?? '',
    ownerUserId,
  };

  if (!profile.aiPromptContext) {
    profile.aiPromptContext = buildUserPromptContext(profile);
  }

  return profile;
}

export function shouldSyncTravelSurvey(profile: OnboardingProfile): boolean {
  return !profile.skippedAll;
}
