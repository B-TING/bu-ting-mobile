import type { NavbarTab } from '../../components/shared/navigation/Navbar';
import { GUIDE_TARGET, type GuideTargetId } from '../../components/guide/guideTypes';

export type OnboardingFeatureKey =
  | 'planner'
  | 'nearby'
  | 'sync'
  | 'offline'
  | 'locker'
  | 'amenities'
  | 'restaurants'
  | 'festivals'
  | 'eventZone'
  | 'sceneryList'
  | 'gpsGuide'
  | 'travelJournal';

export type OnboardingGuideTargetSpec = {
  tab: NavbarTab;
  targetId: GuideTargetId;
};

/** featureCopy 키 → 임베드 탭 + 하이라이트 타깃 */
export const ONBOARDING_GUIDE_TARGETS: Record<
  OnboardingFeatureKey,
  OnboardingGuideTargetSpec
> = {
  planner: { tab: 'home', targetId: GUIDE_TARGET.plannerHeroCta },
  nearby: { tab: 'home', targetId: GUIDE_TARGET.rebootFab },
  gpsGuide: { tab: 'home', targetId: GUIDE_TARGET.quickAccessRow },
  amenities: { tab: 'home', targetId: GUIDE_TARGET.quickAccessRow },
  sync: { tab: 'home', targetId: GUIDE_TARGET.syncDot },
  offline: { tab: 'home', targetId: GUIDE_TARGET.syncDot },
  locker: { tab: 'home', targetId: GUIDE_TARGET.quickLuggage },
  festivals: { tab: 'home', targetId: GUIDE_TARGET.quickFestivals },
  eventZone: { tab: 'home', targetId: GUIDE_TARGET.quickEventZone },
  sceneryList: { tab: 'home', targetId: GUIDE_TARGET.quickAttractions },
  restaurants: { tab: 'home', targetId: GUIDE_TARGET.quickHotels },
  travelJournal: { tab: 'home', targetId: GUIDE_TARGET.traveloguePreview },
};

export function resolveOnboardingGuideTarget(
  featureKey: string,
): OnboardingGuideTargetSpec {
  const mapped = ONBOARDING_GUIDE_TARGETS[featureKey as OnboardingFeatureKey];
  if (mapped) {
    return mapped;
  }
  return { tab: 'home', targetId: GUIDE_TARGET.plannerHeroCta };
}
