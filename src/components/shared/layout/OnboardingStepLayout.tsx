import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '../../../constants/common/layout';
import { ONBOARDING_STEP_COUNT } from '../../../constants/setup/onboarding';
import { SkipButton } from '../buttons/SkipButton';

type OnboardingStepLayoutProps = {
  stepIndex: number;
  stepLabel: string;
  title: string;
  subtitle: string;
  skipLabel: string;
  skipAllLabel: string;
  onSkipStep: () => void;
  onSkipAll: () => void;
  children: ReactNode;
  footer: ReactNode;
};

export function OnboardingStepLayout({
  stepIndex,
  stepLabel,
  title,
  subtitle,
  skipLabel,
  skipAllLabel,
  onSkipStep,
  onSkipAll,
  children,
  footer,
}: OnboardingStepLayoutProps) {
  const insets = useSafeAreaInsets();
  const progress = (stepIndex + 1) / ONBOARDING_STEP_COUNT;

  return (
    <View
      className="flex-1 bg-brand-background px-6"
      style={[layout.screenPad24, { paddingTop: insets.top + 8 }]}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-brand-muted">{stepLabel}</Text>
        <SkipButton label={skipLabel} onPress={onSkipStep} />
      </View>

      <View className="mb-2 h-1 overflow-hidden rounded-sm bg-brand-border">
        <View
          className="h-full rounded-sm bg-brand-primary"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <Pressable
        onPress={onSkipAll}
        className="mb-2 self-center py-2 active:opacity-80"
        hitSlop={8}>
        <Text className="text-sm font-semibold text-brand-primary underline">
          {skipAllLabel}
        </Text>
      </Pressable>

      <View className="flex-1 pt-4">
        <Text className="mb-2 text-[26px] font-bold leading-[34px] text-brand-text">
          {title}
        </Text>
        <Text className="mb-7 text-[15px] leading-[22px] text-brand-muted">
          {subtitle}
        </Text>
        <View className="flex-1">{children}</View>
      </View>

      <View className="pt-2" style={{ paddingBottom: insets.bottom + 16 }}>
        {footer}
      </View>
    </View>
  );
}
