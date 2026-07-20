import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NicknameEditModal } from '../components/mypage/NicknameEditModal';
import {
  MyTravelRecordGrid,
  MyTravelRecordGridEmpty,
} from '../components/mypage/MyTravelRecordGrid';
import { AppIcon } from '../components/shared/icons/AppIcon';
import { getNavbarOverlayHeight } from '../components/shared/navigation/Navbar';
import { useAppAlert } from '../components/shared/modals';
import { useAppLanguage, useCopy } from '../i18n';
import { summarizeOnboardingPreferences } from '../constants/setup/onboarding';
import { layout } from '../constants/common/layout';
import { ICON_COLOR_DEFAULT, ICON_COLOR_MUTED, ICON_COLOR_PRIMARY, ICON_COLOR_WHITE } from '../constants/icons';
import {
  selectOnboardingForUser,
  useAppStore,
  useAuthStore,
  useTravelRecordBookmarkStore,
} from '../stores';
import {
  selectAuthUser,
  selectIsAuthenticated,
  selectReusableAccessToken,
} from '../stores/useAuthStore';
import type { RootStackParamList } from '../navigation/types';
import { logoutSession } from '../services/auth/authSession';
import {
  fetchMyTravelRecords,
  TravelRecordServiceError,
} from '../services/travel/travelRecordService';
import { fetchTravelSurveyProfile } from '../services/setup/travelSurveyService';
import {
  createEmptyOnboardingProfile,
  hasAnsweredSurvey,
} from '../services/setup/travelSurveyMapper';
import { deleteMyAccount, updateMyProfile, UserServiceError } from '../services/user/userService';
import { mapTravelRecordManageItem } from '../types/travelRecordApi';
import type { TravelRecord } from '../types/travelReview';
import { authorInitial } from '../utils/review/travelReview';
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
        {checked ? (
          <AppIcon name="check" size={12} color={ICON_COLOR_WHITE} strokeWidth={3} />
        ) : null}
      </View>
      <Text className="text-sm text-brand-text">{label}</Text>
    </Pressable>
  );
}

function HeaderActionButton({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-1 items-center rounded-xl border py-2.5 active:opacity-80',
        primary
          ? 'border-brand-primary bg-brand-primary'
          : 'border-brand-border bg-brand-surface',
      )}
      accessibilityRole="button">
      <Text
        className={cn(
          'text-sm font-bold',
          primary ? 'text-white' : 'text-brand-text',
        )}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MyPageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const navbarClearance = getNavbarOverlayHeight(insets.bottom);
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recordsTab, setRecordsTab] = useState<'mine' | 'saved'>('mine');

  const bookmarkedRecords = useTravelRecordBookmarkStore(s => s.bookmarkedRecords);
  const bookmarksLoading = useTravelRecordBookmarkStore(s => s.loading);
  const hydrateBookmarks = useTravelRecordBookmarkStore(s => s.hydrate);

  const nickname = user?.nickname || user?.email?.split('@')[0] || 'User';

  const loadMyRecords = useCallback(async () => {
    if (!accessToken) {
      setRecords([]);
      return;
    }
    const list = await fetchMyTravelRecords(accessToken);
    const mapped = list.map(item => mapTravelRecordManageItem(item, nickname));
    setRecords(mapped);
    await hydrateBookmarks(accessToken);
  }, [accessToken, nickname, hydrateBookmarks]);

  useEffect(() => {
    let cancelled = false;
    setLoadingRecords(true);
    void loadMyRecords()
      .catch(error => {
        if (__DEV__) {
          const message =
            error instanceof TravelRecordServiceError ? error.message : String(error);
          console.warn('[MyPage] fetchMyTravelRecords failed:', message);
        }
        if (!cancelled) {
          setRecords([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRecords(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadMyRecords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadMyRecords();
    } catch (error) {
      if (__DEV__) {
        const message =
          error instanceof TravelRecordServiceError ? error.message : String(error);
        console.warn('[MyPage] refresh failed:', message);
      }
    } finally {
      setRefreshing(false);
    }
  }, [loadMyRecords]);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken || !user?.userId) {
        return;
      }
      const userId = user.userId;
      let cancelled = false;
      void fetchTravelSurveyProfile(accessToken, userId, language)
        .then(profile => {
          if (cancelled) {
            return;
          }
          if (profile && hasAnsweredSurvey(profile)) {
            useAppStore.getState().saveUserOnboarding(userId, profile);
            return;
          }
          // GET 데이터 없음 → 로컬도 비움 (skippedAll 캐시 제거)
          useAppStore
            .getState()
            .saveUserOnboarding(userId, createEmptyOnboardingProfile(language, userId));
        })
        .catch(error => {
          console.warn('[Bu-Ting] MyPage travel survey fetch failed', error);
        });
      return () => {
        cancelled = true;
      };
    }, [accessToken, user?.userId, language]),
  );

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

  const applyNicknameUpdate = (nextNickname: string) => {
    if (!user) {
      return;
    }
    useAuthStore.getState().setUser({ ...user, nickname: nextNickname });
    useAppStore.getState().login({
      userId: user.userId,
      displayName: nextNickname || user.email.split('@')[0] || 'User',
    });
  };

  const handleSaveNickname = async (nextNickname: string) => {
    if (!accessToken) {
      alert({ title: copy.changeNicknameError });
      return;
    }
    if (!nextNickname) {
      alert({ title: copy.changeNicknameEmpty });
      return;
    }

    setSavingNickname(true);
    try {
      const updated = await updateMyProfile(accessToken, { nickname: nextNickname });
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

  return (
    <View className="flex-1 bg-brand-background" style={layout.screen}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: navbarClearance + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ICON_COLOR_PRIMARY} />
        }>
        {/* Instagram-style profile header */}
        <View className="px-5 pt-4 pb-3">
          {isAuthenticated && user ? (
            <>
              <View className="mb-4 flex-row items-center">
                <View className="mr-5 h-20 w-20 items-center justify-center rounded-full bg-brand-primary">
                  <Text className="text-3xl font-bold text-white">
                    {authorInitial(nickname)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xl font-bold text-brand-text" numberOfLines={1}>
                    {nickname}
                  </Text>
                  <View className="flex-row items-end gap-1">
                    <Text className="text-lg font-bold text-brand-text">
                      {copy.postsCount(records.length)}
                    </Text>
                    <Text className="mb-0.5 text-sm text-brand-muted">{copy.posts}</Text>
                  </View>
                  {user.email ? (
                    <Text className="mt-1 text-xs text-brand-muted" numberOfLines={1}>
                      {user.email}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="mb-3 flex-row gap-2">
                <HeaderActionButton
                  label={copy.editProfile}
                  onPress={() => setNicknameModalOpen(true)}
                />
                <HeaderActionButton
                  label={copy.editPreferences}
                  onPress={() => navigation.navigate('Onboarding', { mode: 'edit' })}
                  primary
                />
              </View>

              {preferenceRows && preferenceRows.length > 0 ? (
                <View className="mb-2 rounded-2xl border border-brand-border bg-brand-surface px-4 py-3">
                  <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-muted">
                    {copy.preferences}
                  </Text>
                  <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                    {preferenceRows.slice(0, 4).map(row => (
                      <Text key={row.id} className="text-xs text-brand-text">
                        <Text className="text-brand-muted">{row.label} </Text>
                        {row.value}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : (
                <Text className="mb-2 text-xs text-brand-muted">
                  {!onboarding
                    ? copy.preferencesEmpty
                    : onboarding.skippedAll
                      ? copy.preferencesSkippedAll
                      : copy.preferencesDesc}
                </Text>
              )}
            </>
          ) : (
            <View className="mb-4 items-center py-8">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-brand-selected">
                <AppIcon name="user" size={36} color={ICON_COLOR_MUTED} />
              </View>
              <Text className="mb-4 text-base text-brand-muted">{copy.notLoggedIn}</Text>
              <HeaderActionButton label={copy.loginAgain} onPress={goToLogin} primary />
            </View>
          )}
        </View>

        {/* Feed grid */}
        {isAuthenticated ? (
          <View>
            <View className="flex-row border-t border-brand-border">
              <Pressable
                onPress={() => setRecordsTab('mine')}
                className={cn(
                  'flex-1 items-center border-b-2 py-3 active:opacity-80',
                  recordsTab === 'mine' ? 'border-brand-text' : 'border-transparent',
                )}
                accessibilityRole="tab"
                accessibilityState={{ selected: recordsTab === 'mine' }}>
                <AppIcon
                  name="layoutGrid"
                  size={20}
                  color={recordsTab === 'mine' ? ICON_COLOR_DEFAULT : ICON_COLOR_MUTED}
                />
              </Pressable>
              <Pressable
                onPress={() => setRecordsTab('saved')}
                className={cn(
                  'flex-1 items-center border-b-2 py-3 active:opacity-80',
                  recordsTab === 'saved' ? 'border-brand-text' : 'border-transparent',
                )}
                accessibilityRole="tab"
                accessibilityState={{ selected: recordsTab === 'saved' }}>
                <AppIcon
                  name="bookmark"
                  size={20}
                  color={recordsTab === 'saved' ? ICON_COLOR_DEFAULT : ICON_COLOR_MUTED}
                  filled={recordsTab === 'saved'}
                />
              </Pressable>
            </View>

            {recordsTab === 'mine' ? (
              loadingRecords && records.length === 0 ? (
                <View className="items-center py-16">
                  <ActivityIndicator color={ICON_COLOR_PRIMARY} />
                </View>
              ) : records.length === 0 ? (
                <MyTravelRecordGridEmpty
                  title={copy.recordsEmpty}
                  subtitle={copy.recordsEmptySub}
                />
              ) : (
                <MyTravelRecordGrid
                  records={records}
                  statusLabels={copy.statusLabels}
                  onPressRecord={travelRecordId =>
                    navigation.navigate('TravelRecordDetail', { travelRecordId })
                  }
                />
              )
            ) : bookmarksLoading && bookmarkedRecords.length === 0 ? (
              <View className="items-center py-16">
                <ActivityIndicator color={ICON_COLOR_PRIMARY} />
              </View>
            ) : bookmarkedRecords.length === 0 ? (
              <MyTravelRecordGridEmpty
                title={copy.savedRecordsEmpty}
                subtitle={copy.savedRecordsEmptySub}
              />
            ) : (
              <MyTravelRecordGrid
                records={bookmarkedRecords}
                statusLabels={copy.statusLabels}
                onPressRecord={travelRecordId =>
                  navigation.navigate('TravelRecordDetail', { travelRecordId })
                }
              />
            )}
          </View>
        ) : null}

        {/* Account settings (collapsed) */}
        {isAuthenticated && user ? (
          <View className="mt-6 px-5">
            <Pressable
              onPress={() => setAccountOpen(open => !open)}
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-brand-border bg-brand-surface px-4 py-3.5 active:opacity-80"
              accessibilityRole="button">
              <Text className="text-sm font-bold text-brand-text">{copy.accountSettings}</Text>
              <AppIcon
                name={accountOpen ? 'chevronUp' : 'chevronDown'}
                size={18}
                color={ICON_COLOR_MUTED}
              />
            </Pressable>

            {accountOpen ? (
              <View className="mb-4 rounded-2xl border border-brand-border bg-brand-surface p-5">
                <InfoRow label={copy.nickname} value={user.nickname || '—'} />
                <InfoRow label={copy.email} value={user.email || '—'} />
                <InfoRow label={copy.provider} value={providerLabel} />
                {!hideUserIdOnMyPage ? (
                  <InfoRow label={copy.userId} value={user.userId} />
                ) : null}
                <InfoRow
                  label={copy.rememberMe}
                  value={rememberMe ? copy.rememberMeOn : copy.rememberMeOff}
                />
                <SettingToggle
                  label={copy.hideUserId}
                  checked={hideUserIdOnMyPage}
                  onPress={() => setHideUserIdOnMyPage(!hideUserIdOnMyPage)}
                />
                <Pressable
                  onPress={() => setNicknameModalOpen(true)}
                  className="mb-3 self-start active:opacity-70"
                  accessibilityRole="button">
                  <Text className="text-sm font-semibold text-brand-primary">
                    {copy.changeNickname}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={deletingAccount}
                  className={cn(
                    'mb-4 self-start active:opacity-70',
                    deletingAccount && 'opacity-50',
                  )}
                  accessibilityRole="button">
                  <Text className="text-sm font-semibold text-red-600">{copy.deleteAccount}</Text>
                </Pressable>
                <Pressable
                  onPress={handleLogout}
                  className="items-center rounded-xl border border-brand-border bg-brand-background py-3 active:opacity-80"
                  accessibilityRole="button">
                  <Text className="text-sm font-bold text-brand-text">{copy.logout}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleLogout}
                className="mb-2 items-center rounded-xl border border-brand-border bg-brand-surface py-3 active:opacity-80"
                accessibilityRole="button">
                <Text className="text-sm font-bold text-brand-text">{copy.logout}</Text>
              </Pressable>
            )}
          </View>
        ) : null}
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
