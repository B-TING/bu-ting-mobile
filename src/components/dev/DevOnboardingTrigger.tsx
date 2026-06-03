import { useRef, type ReactNode } from 'react';
import { Pressable } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

import type { RootStackParamList } from '../../navigation/types';

const TAP_GOAL = 5;
const TAP_WINDOW_MS = 2000;

type DevOnboardingTriggerProps = {
  navigation: NavigationProp<RootStackParamList>;
  children: ReactNode;
};

/** DEV 전용: 자식 영역을 연속 5회 탭하면 온보딩 화면으로 이동 (데이터 초기화 없음) */
export function DevOnboardingTrigger({
  navigation,
  children,
}: DevOnboardingTriggerProps) {
  const tapTimes = useRef<number[]>([]);

  if (!__DEV__) {
    return <>{children}</>;
  }

  const onPress = () => {
    const now = Date.now();
    tapTimes.current = tapTimes.current.filter(t => now - t < TAP_WINDOW_MS);
    tapTimes.current.push(now);
    if (tapTimes.current.length >= TAP_GOAL) {
      tapTimes.current = [];
      navigation.navigate('Onboarding');
    }
  };

  return (
    <Pressable onPress={onPress} accessibilityLabel="Dev onboarding preview">
      {children}
    </Pressable>
  );
}
