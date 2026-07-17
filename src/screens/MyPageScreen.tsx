import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

import { NicknameEditModal } from '../components/mypage/NicknameEditModal';
import { PrimaryButton } from '../components/shared/buttons/PrimaryButton';
import { AppIcon } from '../components/shared/icons/AppIcon';
import { useAppAlert } from '../components/shared/modals';
import { useAppLanguage, useCopy } from '../i18n';
import { summarizeOnboardingPreferences } from '../constants/setup/onboarding';
import { layout } from '../constants/common/layout';
import { ICON_COLOR_WHITE } from '../constants/icons';
import { selectOnboardingForUser, useAppStore, useAuthStore } from '../stores';
import { selectAuthUser, selectIsAuthenticated, selectReusableAccessToken } from '../stores/useAuthStore';
import type { RootStackParamList } from '../navigation/types';
import { logoutSession } from '../services/auth/authSession';
import { deleteMyAccount, updateMyProfile, UserServiceError } from '../services/user/userService';
import { cn } from '../utils/common/cn';

type Props = {
  navigation: NavigationProp<RootStackParamList>;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </Text>
      <Text className="text-base text-brand-text" selectable>
        {value}
      </Text>
    </View>
  );
}

function NicknameRow({
  label,
  value,
  actionLabel,
  onPressAction,
}: {
  label: string;
  value: string;
  actionLabel: string;
  onPressAction: () => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </Text>
      <View className="flex-row items-center">
        <Text className="flex-1 text-base text-brand-text" selectable>
          {value}
        </Text>
        <Pressable
          onPress={onPressAction}
          className="ml-2 rounded-lg px-2 py-1 active:opacity-70"
          accessibilityRole="button">
          <Text className="text-xs font-semibold text-brand-primary">{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SettingToggle({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center active:opacity-80">
      <View
        className={cn(
          'mr-3 h-5 w-5 items-center justify-center rounded border-2 border-brand-border',
          checked && 'border-brand-primary bg-brand-primary',
        )}>
        {checked ? <AppIcon name="check" size={12} color={ICON_COLOR_WHITE} strokeWidth={3} /> : null}
      </View>
      <Text className="text-sm text-brand-text">{label}</Text>
    </Pressable>
  );
}

export function MyPageScreen({ navigation }: Props) {
  const { alert } = useAppAlert();
  const language = useAppLanguage();
  const user = useAuthStore(selectAuthUser);
  const onboarding = useAppStore(selectOnboardingForUser(user?.userId));
  const hideUserIdOnMyPage = useAppStore(s => s.hideUserIdOnMyPage);
  const setHideUserIdOnMyPage = useAppStore(s => s.setHideUserIdOnMyPage);
  const copy = useCopy('myPage');
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const rememberMe = useAuthStore(s => s.rememberMe);
  const accessToken = useAuthStore(selectReusableAccessToken);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleLogout = () => {
    alert({
      title: copy.logout,
      message: copy.logoutConfirm,
      buttons: [
        { label: copy.logoutCancel, variant: 'secondary', onPress: () => {} },
        {
          label: copy.logout,
          variant: 'danger',
          onPress: () => {
            void logoutSession().then(goToLogin);
          },
        },
      ],
    });
  };

  const applyNicknameUpdate = (nickname: string) => {
    if (!user) {
      return;
    }
    useAuthStore.getState().setUser({ ...user, nickname });
    useAppStore.getState().login({
      userId: user.userId,
      displayName: nickname || user.email.split('@')[0] || 'User',
    });
  };

  const handleSaveNickname = async (nickname: string) => {
    if (!accessToken) {
      alert({ title: copy.changeNicknameError });
      return;
    }
    if (!nickname) {
      alert({ title: copy.changeNicknameEmpty });
      return;
    }

    setSavingNickname(true);
    try {
      const updated = await updateMyProfile(accessToken, { nickname });
      applyNicknameUpdate(updated.nickname);
      setNicknameModalOpen(false);
      alert({ title: copy.changeNicknameSuccess });
    } catch (error) {
      const message =
        error instanceof UserServiceError && error.message
          ? error.message
          : copy.changeNicknameError;
      alert({ title: message });
    } finally {
      setSavingNickname(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!accessToken || deletingAccount) {
      return;
    }

    alert({
      title: copy.deleteAccount,
      message: copy.deleteAccountConfirm,
      buttons: [
        { label: copy.deleteAccountCancel, variant: 'secondary', onPress: () => {} },
        {
          label: copy.deleteAccount,
          variant: 'danger',
          onPress: () => {
            setDeletingAccount(true);
            void deleteMyAccount(accessToken)
              .then(() => logoutSession())
              .then(goToLogin)
              .catch(error => {
                const message =
                  error instanceof UserServiceError && error.message
                    ? error.message
                    : copy.deleteAccountError;
                alert({ title: message });
              })
              .finally(() => setDeletingAccount(false));
          },
        },
      ],
    });
  };

  const providerLabel = user ? copy.providers[user.provider] : '—';
  const preferenceRows = summarizeOnboardingPreferences(onboarding, language, {
    travelStyle: copy.preferenceFields.travelStyle,
    schedulePace: copy.preferenceFields.schedulePace,
    companions: copy.preferenceFields.companions,
    luggage: copy.preferenceFields.luggage,
    purposes: copy.preferenceFields.purposes,
    busanFamiliarity: copy.preferenceFields.busanFamiliarity,
    notSet: copy.preferenceFields.notSet,
    skipped: copy.preferenceFields.skipped,
  });
  const preferencesMessage = !onboarding
    ? copy.preferencesEmpty
    : onboarding.skippedAll
      ? copy.preferencesSkippedAll
      : null;

  return (
    <View className="flex-1 bg-brand-background" style={layout.screen}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}>
        <Text className="mb-5 text-[28px] font-bold text-brand-text">{copy.title}</Text>

        <View className="mb-5 rounded-2xl border border-brand-border bg-brand-surface p-5">
          <Text className="mb-4 text-lg font-bold text-brand-text">{copy.profile}</Text>

          {isAuthenticated && user ? (
            <>
              <NicknameRow
                label={copy.nickname}
                value={user.nickname || '—'}
                actionLabel={copy.changeNickname}
                onPressAction={() => setNicknameModalOpen(true)}
              />
              <InfoRow label={copy.email} value={user.email || '—'} />
              <InfoRow label={copy.provider} value={providerLabel} />
              {!hideUserIdOnMyPage ? (
                <InfoRow label={copy.userId} value={user.userId} />
              ) : null}
              <Pressable
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                className={cn(
                  'mt-2 self-start active:opacity-70',
                  deletingAccount && 'opacity-50',
                )}
                accessibilityRole="button">
                <Text className="text-sm font-semibold text-red-600">{copy.deleteAccount}</Text>
              </Pressable>
            </>
          ) : (
            <Text className="mb-4 text-base text-brand-muted">{copy.notLoggedIn}</Text>
          )}
        </View>

        <View className="mb-5 rounded-2xl border border-brand-border bg-brand-surface p-5">
          <Text className="mb-4 text-lg font-bold text-brand-text">{copy.session}</Text>
          <InfoRow
            label={copy.rememberMe}
            value={rememberMe ? copy.rememberMeOn : copy.rememberMeOff}
          />
          <SettingToggle
            label={copy.hideUserId}
            checked={hideUserIdOnMyPage}
            onPress={() => setHideUserIdOnMyPage(!hideUserIdOnMyPage)}
          />
        </View>

        <View className="mb-5 rounded-2xl border border-brand-border bg-brand-surface p-5">
          <Text className="mb-1 text-lg font-bold text-brand-text">{copy.preferences}</Text>
          <Text className="mb-4 text-sm leading-5 text-brand-muted">{copy.preferencesDesc}</Text>
          {preferenceRows ? (
            <View className="mb-4">
              {preferenceRows.map(row => (
                <InfoRow key={row.id} label={row.label} value={row.value} />
              ))}
            </View>
          ) : (
            <Text className="mb-4 text-base text-brand-muted">{preferencesMessage}</Text>
          )}
          <PrimaryButton
            label={copy.editPreferences}
            onPress={() => navigation.navigate('Onboarding', { mode: 'edit' })}
          />
        </View>

        {isAuthenticated ? (
          <PrimaryButton label={copy.logout} onPress={handleLogout} />
        ) : (
          <PrimaryButton label={copy.loginAgain} onPress={goToLogin} />
        )}
      </ScrollView>

      {user ? (
        <NicknameEditModal
          visible={nicknameModalOpen}
          initialNickname={user.nickname}
          saving={savingNickname}
          copy={{
            title: copy.changeNicknameTitle,
            placeholder: copy.changeNicknamePlaceholder,
            save: copy.changeNicknameSave,
            cancel: copy.changeNicknameCancel,
          }}
          onClose={() => {
            if (!savingNickname) {
              setNicknameModalOpen(false);
            }
          }}
          onSave={handleSaveNickname}
        />
      ) : null}
    </View>
  );
}
