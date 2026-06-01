import { Pressable, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { layout } from '../constants/layout';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../stores';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const onboarding = useAppStore(state => state.onboarding);
  const resetSetup = useAppStore(state => state.resetSetup);

  return (
    <View
      className="flex-1 bg-brand-background"
      style={[layout.screen, { paddingTop: insets.top }]}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-2 text-4xl font-bold text-brand-primary">부팅</Text>
        <Text className="mb-6 text-center text-base text-brand-muted">
          나만의 부산 여행 가이드
        </Text>
        {onboarding && (
          <View className="w-full rounded-xl border border-brand-border bg-brand-surface p-4">
            <Text className="mb-2 text-sm font-semibold text-brand-text">
              {onboarding.language === 'ko' ? '온보딩 완료' : 'Onboarding complete'}
            </Text>
            <Text className="text-xs leading-[18px] text-brand-muted" numberOfLines={4}>
              {onboarding.aiPromptContext}
            </Text>
          </View>
        )}
      </View>
      {__DEV__ && (
        <Pressable
          className="self-center p-3 active:opacity-80"
          style={{ marginBottom: insets.bottom + 16 }}
          onPress={() => {
            resetSetup();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'LanguageSelection' }],
              }),
            );
          }}>
          <Text className="text-[13px] text-brand-primary underline">
            {onboarding?.language === 'ko'
              ? '[DEV] 초기 설정 초기화'
              : '[DEV] Reset setup'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
