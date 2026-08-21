import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { OAuthProviderList } from '../../components/setup/OAuthProviderButton';
import { BrandIcon } from '../../components/shared/brand/BrandIcon';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { ICON_COLOR_WHITE } from '../../constants/icons';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { completeProviderLogin } from '../../services/auth/authSession';
import { AuthServiceError } from '../../services/auth/authService';
import { OAuthSdkError, signInWithProvider } from '../../services/auth/oauthSdkService';
import { selectLatestLocalPlan, useAppStore, usePlanStore } from '../../stores';
import type { OAuthProvider } from '../../types/auth';
import { logAuth } from '../../utils/auth/authLogger';
import { cn } from '../../utils/common/cn';

const heroImage = require('../../../assets/images/home-hero.jpg');

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const language = useAppLanguage();
  const copy = useCopy('setup');
  const setOfflineMode = useAppStore(state => state.setOfflineMode);
  const plansHydrated = usePlanStore(state => state._hasHydrated);
  const [rememberMe, setRememberMe] = useState(true);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLoading = loadingProvider !== null;
  const offlineEntryDisabled = isLoading || !plansHydrated;
  const heroHeight = Math.max(240, Math.round(windowHeight * 0.38));

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

  const onEnterOfflineMode = useCallback(() => {
    if (!usePlanStore.getState()._hasHydrated) {
      return;
    }
    const plan = selectLatestLocalPlan(usePlanStore.getState());
    if (!plan) {
      setErrorMessage(copy.offlineModeEmpty);
      return;
    }
    setErrorMessage(null);
    setOfflineMode(true);
    navigation.replace('PlanDetail', { planId: plan.planId });
  }, [copy.offlineModeEmpty, navigation, setOfflineMode]);

  return (
    <View className="flex-1 bg-white">
      <View style={[styles.heroShadow, { height: heroHeight + insets.top }]}>
        <ImageBackground
          source={heroImage}
          style={StyleSheet.absoluteFill}
          resizeMode="cover">
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <View style={styles.logoScrim}>
              <View className="px-6 pb-7 pt-5">
                <View className="mb-2 flex-row items-center gap-2.5">
                  <BrandIcon size={36} />
                  <BrandLogo height={26} style={{ tintColor: '#FFFFFF' }} />
                </View>
                <Text className="text-sm font-medium text-white/90">{copy.loginSlogan}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      <View
        className="mt-1 flex-1 bg-white px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}>
        <Text className="mb-2 text-[28px] font-bold text-brand-text">{copy.loginTitle}</Text>
        <Text className="mb-6 text-[15px] leading-[22px] text-brand-muted">
          {copy.loginSubtitle}
        </Text>

        <OAuthProviderList
          language={language}
          disabled={isLoading}
          onPress={onProviderLogin}
        />

        <Pressable
          disabled={isLoading}
          onPress={() => setRememberMe(current => !current)}
          className="mb-1 mt-1 flex-row items-center active:opacity-80">
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
          <Text className="mt-3 text-sm text-red-600">{errorMessage}</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color="#0077B6"
            style={{ marginTop: 12 }}
          />
        ) : null}

        <View className="my-5 flex-row items-center">
          <View className="h-px flex-1 bg-brand-border" />
          <Text className="mx-3 text-xs font-medium text-brand-muted">{copy.loginOr}</Text>
          <View className="h-px flex-1 bg-brand-border" />
        </View>

        <Pressable
          disabled={offlineEntryDisabled}
          onPress={onEnterOfflineMode}
          accessibilityRole="button"
          accessibilityLabel={copy.offlineMode}
          className={cn(
            'mb-auto items-center rounded-xl border border-brand-border bg-white py-3.5 active:opacity-80',
            offlineEntryDisabled && 'opacity-50',
          )}>
          <Text className="text-base font-semibold text-brand-text">{copy.offlineMode}</Text>
        </Pressable>

        <Text className="mt-6 text-center text-xs leading-5 text-brand-muted">
          {copy.loginTermsPrefix}
          <Text className="font-semibold text-brand-primary">{copy.loginTermsOfService}</Text>
          {copy.loginTermsMiddle}
          <Text className="font-semibold text-brand-primary">{copy.loginPrivacyPolicy}</Text>
          {copy.loginTermsSuffix}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroShadow: {
    overflow: 'visible',
    zIndex: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  logoScrim: {
    marginTop: 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
});
