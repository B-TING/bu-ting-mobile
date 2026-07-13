import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { OAuthProviderList } from '../../components/setup/OAuthProviderButton';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { layout } from '../../constants/common/layout';
import { ICON_COLOR_WHITE } from '../../constants/icons';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { completeProviderLogin } from '../../services/auth/authSession';
import { AuthServiceError } from '../../services/auth/authService';
import { OAuthSdkError, signInWithProvider } from '../../services/auth/oauthSdkService';
import type { OAuthProvider } from '../../types/auth';
import { logAuth } from '../../utils/auth/authLogger';
import { cn } from '../../utils/common/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('setup');
  const [rememberMe, setRememberMe] = useState(true);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLoading = loadingProvider !== null;

  const onProviderLogin = useCallback(
    async (provider: OAuthProvider) => {
      setErrorMessage(null);
      setLoadingProvider(provider);
      try {
        const result = await signInWithProvider(provider);
        await completeProviderLogin(provider, result.providerToken, rememberMe);
        navigation.replace('MainTabs');
      } catch (error) {
        if (error instanceof OAuthSdkError && error.message.includes('cancelled')) {
          logAuth('login.cancelled', `${provider} sign-in cancelled by user`, {
            level: 'warn',
          });
          return;
        }
        if (
          error instanceof OAuthSdkError &&
          /rate limit/i.test(error.message)
        ) {
          setErrorMessage(
            language === 'ko'
              ? '카카오 로그인 요청이 너무 많습니다. 5~10분 후 다시 시도해 주세요.'
              : 'Too many Kakao sign-in attempts. Please try again in 5–10 minutes.',
          );
          logAuth('login.error', `${provider} login rate limited`, {
            level: 'warn',
            detail: error,
          });
          return;
        }
        logAuth('login.error', `${provider} login failed on screen`, {
          level: 'error',
          detail: error,
        });
        const message =
          error instanceof AuthServiceError ||
          error instanceof OAuthSdkError
            ? error.message
            : language === 'ko'
              ? '로그인에 실패했습니다. 다시 시도해 주세요.'
              : 'Sign-in failed. Please try again.';
        setErrorMessage(message);
      } finally {
        setLoadingProvider(null);
      }
    },
    [language, navigation, rememberMe],
  );

  return (
    <View
      className="flex-1 bg-brand-background px-6"
      style={[layout.screenPad24, { paddingTop: insets.top + 32 }]}>
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
        <OAuthProviderList
          language={language}
          disabled={isLoading}
          onPress={onProviderLogin}
        />

        <Pressable
          disabled={isLoading}
          onPress={() => setRememberMe(current => !current)}
          className="mt-2 flex-row items-center active:opacity-80">
          <View
            className={cn(
              'mr-3 h-5 w-5 items-center justify-center rounded border-2 border-brand-border',
              rememberMe && 'border-brand-primary bg-brand-primary',
            )}>
            {rememberMe ? (
              <AppIcon name="check" size={12} color={ICON_COLOR_WHITE} strokeWidth={3} />
            ) : null}
          </View>
          <Text className="text-sm text-brand-text">
            {language === 'ko' ? '자동 로그인' : 'Keep me signed in'}
          </Text>
        </Pressable>

        {errorMessage ? (
          <Text className="mt-4 text-sm text-red-600">{errorMessage}</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color="#0077B6"
            style={{ marginTop: 16 }}
          />
        ) : null}
      </View>

      <View className="pt-2" style={{ paddingBottom: insets.bottom + 20 }}>
        <Text className="text-center text-xs text-brand-muted">
          {language === 'ko'
            ? '소셜 계정으로 가입·로그인합니다. 최초 로그인 시 자동으로 회원가입됩니다.'
            : 'Sign up or sign in with a social account. First sign-in creates your account.'}
        </Text>
      </View>
    </View>
  );
}
