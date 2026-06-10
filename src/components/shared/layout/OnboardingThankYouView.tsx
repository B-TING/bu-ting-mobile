import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ONBOARDING_COMPLETE_DELAY_MS } from '../../../constants/onboarding';
import { layout } from '../../../constants/layout';

type OnboardingThankYouViewProps = {
  title: string;
  privacy: string;
  waitLabel: string;
  onComplete: () => void;
};

export function OnboardingThankYouView({
  title,
  privacy,
  waitLabel,
  onComplete,
}: OnboardingThankYouViewProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(onComplete, ONBOARDING_COMPLETE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View
      className="flex-1 items-center justify-center bg-brand-background px-8"
      style={[layout.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <Text className="mb-4 text-center text-[26px] font-bold leading-[34px] text-brand-text">
        {title}
      </Text>
      <Text className="mb-10 text-center text-[15px] leading-[24px] text-brand-muted">
        {privacy}
      </Text>
      <ActivityIndicator size="large" color="#0077B6" />
      <Text className="mt-5 text-center text-sm text-brand-muted">{waitLabel}</Text>
    </View>
  );
}
