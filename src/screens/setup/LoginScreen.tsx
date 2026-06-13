import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
import { layout } from '../../constants/layout';
import { SETUP_COPY } from '../../constants/onboarding';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(state => state.language) ?? 'en';
  const login = useAppStore(state => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const copy = SETUP_COPY[language];

  const onLogin = () => {
    const trimmed = email.trim() || 'guest@buting.app';
    login({
      userId: `user_${Date.now()}`,
      displayName: trimmed.split('@')[0],
    });
    navigation.replace('Onboarding');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-background px-6"
      style={[layout.screenPad24, { paddingTop: insets.top + 32 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="mb-8">
        <BrandLogo height={32} style={{ marginBottom: 20 }} />
        <Text className="mb-2 text-[28px] font-bold text-brand-text">
          {copy.loginTitle}
        </Text>
        <Text className="text-[15px] leading-[22px] text-brand-muted">
          {copy.loginSubtitle}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="mb-2 text-sm font-semibold text-brand-text">
          {copy.email}
        </Text>
        <TextInput
          className="mb-5 rounded-xl border-[1.5px] border-brand-border bg-brand-surface px-4 py-3.5 text-base text-brand-text"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#64748B"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text className="mb-2 text-sm font-semibold text-brand-text">
          {copy.password}
        </Text>
        <TextInput
          className="mb-5 rounded-xl border-[1.5px] border-brand-border bg-brand-surface px-4 py-3.5 text-base text-brand-text"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#64748B"
          secureTextEntry
        />
      </View>

      <View className="pt-2" style={{ paddingBottom: insets.bottom + 20 }}>
        <PrimaryButton label={copy.login} onPress={onLogin} />
        <Text className="mt-4 text-center text-xs text-brand-muted">
          {language === 'ko'
            ? '백엔드 연동 전: 이메일 없이도 로그인 가능합니다'
            : 'Pre-backend: sign in works without a real account'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
