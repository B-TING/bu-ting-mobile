import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuideBlind } from '../guide/GuideBlind';
import { GUIDE_TARGET, type GuideRect } from '../guide/guideTypes';
import { GuideTargetProvider, useGuideTargets } from '../guide/GuideTargetContext';
import { PlanSyncStatusDot } from '../plan/PlanSyncStatusDot';
import { PrimaryButton } from '../shared/buttons/PrimaryButton';
import { AppBar } from '../shared/navigation/AppBar';
import type { NavbarTab } from '../shared/navigation/Navbar';
import { layout } from '../../constants/common/layout';
import type { FeatureStepContent } from '../../constants/setup/onboarding';
import { resolveOnboardingGuideTarget } from '../../constants/setup/onboardingGuideTargets';
import { MainTabNavigationContext } from '../../navigation/mainTabNavigation';
import type { RootStackParamList } from '../../navigation/types';
import { MainHomeScreen } from '../../screens/MainHomeScreen';
import type { AppLanguage } from '../../types/user';

type OnboardingFeatureGuideProps = {
  features: FeatureStepContent['features'];
  language: AppLanguage;
  nextLabel: string;
  skipLabel: string;
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
  backLabel?: string;
  navigation: NavigationProp<RootStackParamList>;
};

function OnboardingFeatureGuideInner({
  features,
  language,
  nextLabel,
  skipLabel,
  onNext,
  onSkip,
  onBack,
  backLabel,
  navigation,
}: OnboardingFeatureGuideProps) {
  const insets = useSafeAreaInsets();
  const { measureTarget, rootRef } = useGuideTargets();
  const [featureIndex, setFeatureIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<GuideRect | null>(null);

  const current = features[featureIndex] ?? features[0];
  const guideSpec = useMemo(
    () => resolveOnboardingGuideTarget(current?.id ?? 'planner'),
    [current?.id],
  );

  const showOfflineDot = current?.id === 'offline';
  const forceShowRebootFab = current?.id === 'nearby';

  useEffect(() => {
    let cancelled = false;
    setTargetRect(null);

    const needsScroll = guideSpec.targetId === GUIDE_TARGET.traveloguePreview;

    const measure = async () => {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const waitMs =
          attempt === 0 ? (needsScroll ? 420 : 50) : 50 + attempt * 40;
        await new Promise<void>(resolve => {
          setTimeout(resolve, waitMs);
        });
        if (cancelled) {
          return;
        }
        const rect = await measureTarget(guideSpec.targetId);
        if (rect) {
          if (!cancelled) {
            setTargetRect(rect);
          }
          return;
        }
      }
    };

    void measure();
    return () => {
      cancelled = true;
    };
  }, [featureIndex, guideSpec.targetId, measureTarget, showOfflineDot, forceShowRebootFab]);

  const tabContext = useMemo(
    () => ({
      activeTab: 'home' as NavbarTab,
      goToTab: (_tab: NavbarTab) => undefined,
    }),
    [],
  );

  const handleNext = useCallback(() => {
    if (featureIndex >= features.length - 1) {
      onNext();
      return;
    }
    setFeatureIndex(prev => prev + 1);
  }, [featureIndex, features.length, onNext]);

  if (!current) {
    return null;
  }

  return (
    <MainTabNavigationContext.Provider value={tabContext}>
      <View
        ref={rootRef}
        collapsable={false}
        className="flex-1 bg-brand-background"
        style={layout.screen}>
        <AppBar
          onMenuPress={() => undefined}
          onProfilePress={() => undefined}
          topRightAccessory={<PlanSyncStatusDot offline={showOfflineDot} />}
        />

        <View className="flex-1 overflow-hidden">
          <MainHomeScreen
            navigation={navigation}
            suppressNavbarClearance
            forceShowRebootFab={forceShowRebootFab}
            guideScrollTargetId={guideSpec.targetId}
          />
        </View>

        <GuideBlind
          rect={targetRect}
          title={current.title[language]}
          description={current.description[language]}
          controls={
            <View style={{ flex: 1 }} pointerEvents="box-none">
              <View
                className="flex-row items-center justify-between px-5"
                style={{ paddingTop: Math.max(insets.top, 12) + 8 }}
                pointerEvents="box-none">
                {onBack ? (
                  <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button">
                    <Text className="text-sm font-semibold text-white">
                      {backLabel ?? (language === 'ko' ? '뒤로' : 'Back')}
                    </Text>
                  </Pressable>
                ) : (
                  <View />
                )}
                <Pressable onPress={onSkip} hitSlop={12} accessibilityRole="button">
                  <Text className="text-sm font-semibold text-white">{skipLabel}</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }} pointerEvents="none" />
              <View
                className="px-5 pb-2"
                style={{ paddingBottom: Math.max(insets.bottom, 12) }}
                pointerEvents="box-none">
                <PrimaryButton label={nextLabel} onPress={handleNext} />
              </View>
            </View>
          }
        />
      </View>
    </MainTabNavigationContext.Provider>
  );
}

export function OnboardingFeatureGuide(props: OnboardingFeatureGuideProps) {
  return (
    <GuideTargetProvider>
      <OnboardingFeatureGuideInner {...props} />
    </GuideTargetProvider>
  );
}
