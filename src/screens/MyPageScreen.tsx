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
import { AccountSettingsModal } from '../components/mypage/AccountSettingsModal';
import {
  MyTravelRecordGrid,
  MyTravelRecordGridEmpty,
} from '../components/mypage/MyTravelRecordGrid';
import { AppIcon } from '../components/shared/icons/AppIcon';
import { getNavbarOverlayHeight } from '../components/shared/navigation/Navbar';
import { useAppAlert, useFeatureUnavailableAlert } from '../components/shared/modals';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../constants/common/alphaFeatureBlocks';
import { useAppLanguage, useCopy } from '../i18n';
import { layout } from '../constants/common/layout';
import {
  ICON_COLOR_HEART,
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
  ICON_COLOR_WHITE,
  type LucideIconName,
} from '../constants/icons';
import {
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
import { countPlaceReviewsForMyTravelRecords } from '../services/travel/loadTravelRecordDetail';
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

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <View className="mr-5 flex-row items-baseline">
      <Text className="mr-1 text-base font-bold text-brand-text">{count}</Text>
      <Text className="text-sm text-brand-muted">{label}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  danger,
  showChevron = true,
  last,
}: {
  icon: LucideIconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  showChevron?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center px-4 py-3.5 active:opacity-80',
        !last && 'border-b border-brand-border',
      )}
      accessibilityRole="button">
      <AppIcon
        name={icon}
        size={20}
        color={danger ? ICON_COLOR_HEART : ICON_COLOR_MUTED}
      />
      <Text
        className={cn(
          'ml-3 flex-1 text-[15px] font-medium',
          danger ? 'text-red-500' : 'text-brand-text',
        )}>
        {label}
      </Text>
      {showChevron ? (
        <AppIcon name="chevronRight" size={18} color={ICON_COLOR_MUTED} />
      ) : null}
    </Pressable>
  );
}

function profileHandle(nickname: string): string {
  const cleaned = nickname.trim().replace(/\s+/g, '').toLowerCase();
  return cleaned ? `@${cleaned}` : '@user';
}

export function MyPageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const navbarClearance = getNavbarOverlayHeight(insets.bottom);
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const language = useAppLanguage();
  const user = useAuthStore(selectAuthUser);
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
  const [placeReviewCount, setPlaceReviewCount] = useState(0);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recordsTab, setRecordsTab] = useState<'mine' | 'saved'>('mine');

  const bookmarkedRecords = useTravelRecordBookmarkStore(s => s.bookmarkedRecords);
  const bookmarksLoading = useTravelRecordBookmarkStore(s => s.loading);
  const hydrateBookmarks = useTravelRecordBookmarkStore(s => s.hydrate);

  const nickname = user?.nickname || user?.email?.split('@')[0] || 'User';
  const handle = profileHandle(nickname);

  const loadMyRecords = useCallback(async () => {
    if (!accessToken) {
      setRecords([]);
      setPlaceReviewCount(0);
      return;
    }
    const list = await fetchMyTravelRecords(accessToken);
    const mapped = list.map(item => mapTravelRecordManageItem(item, nickname));
    setRecords(mapped);
    const reviewCount = await countPlaceReviewsForMyTravelRecords(
      accessToken,
      list.map(item => item.travelRecordId),
    );
    setPlaceReviewCount(reviewCount);
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
          setPlaceReviewCount(0);
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

  return (
    <View className="flex-1 bg-brand-background" style={layout.screen}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: navbarClearance + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ICON_COLOR_PRIMARY} />
        }>
        <View className="px-5 pt-5 pb-4">
          {isAuthenticated && user ? (
            <View className="flex-row items-start">
              <View className="mr-4">
                <View className="h-[88px] w-[88px] items-center justify-center rounded-full bg-brand-primary">
                  <Text className="text-3xl font-bold text-white">
                    {authorInitial(nickname)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setNicknameModalOpen(true)}
                  className="absolute -bottom-0.5 -right-0.5 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-primary active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel={copy.editProfile}>
                  <AppIcon name="camera" size={14} color={ICON_COLOR_WHITE} />
                </Pressable>
              </View>

              <View className="min-w-0 flex-1 pt-1">
                <View className="flex-row items-center">
                  <Text
                    className="mr-1.5 shrink text-2xl font-bold text-brand-text"
                    numberOfLines={1}>
                    {nickname}
                  </Text>
                  <Pressable
                    onPress={() => setNicknameModalOpen(true)}
                    className="h-6 w-6 items-center justify-center active:opacity-70"
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={copy.changeNickname}>
                    <AppIcon name="pencil" size={13} color={ICON_COLOR_MUTED} />
                  </Pressable>
                </View>
                <Text className="mt-0.5 text-sm text-brand-muted" numberOfLines={1}>
                  {handle}
                </Text>
                <View className="mt-3 flex-row flex-wrap items-center">
                  <StatItem count={records.length} label={copy.travelogueStat} />
                  <StatItem count={placeReviewCount} label={copy.visitStat} />
                </View>
              </View>
            </View>
          ) : (
            <View className="items-center py-8">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-brand-selected">
                <AppIcon name="user" size={36} color={ICON_COLOR_MUTED} />
              </View>
              <Text className="mb-4 text-base text-brand-muted">{copy.notLoggedIn}</Text>
              <Pressable
                onPress={goToLogin}
                className="items-center rounded-xl border border-brand-primary bg-brand-primary px-8 py-2.5 active:opacity-80"
                accessibilityRole="button">
                <Text className="text-sm font-bold text-white">{copy.loginAgain}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {isAuthenticated ? (
          <View className="mb-6">
            <View className="mb-3 flex-row px-5">
              <Pressable
                onPress={() => setRecordsTab('mine')}
                className={cn(
                  'mr-5 border-b-2 pb-2 active:opacity-80',
                  recordsTab === 'mine' ? 'border-brand-text' : 'border-transparent',
                )}
                accessibilityRole="tab"
                accessibilityState={{ selected: recordsTab === 'mine' }}>
                <Text
                  className={cn(
                    'text-base font-bold',
                    recordsTab === 'mine' ? 'text-brand-text' : 'text-brand-muted',
                  )}>
                  {copy.myRecords}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRecordsTab('saved')}
                className={cn(
                  'border-b-2 pb-2 active:opacity-80',
                  recordsTab === 'saved' ? 'border-brand-text' : 'border-transparent',
                )}
                accessibilityRole="tab"
                accessibilityState={{ selected: recordsTab === 'saved' }}>
                <Text
                  className={cn(
                    'text-base font-bold',
                    recordsTab === 'saved' ? 'text-brand-text' : 'text-brand-muted',
                  )}>
                  {copy.savedRecords}
                </Text>
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
                  onPressRecord={travelRecordId => {
                    if (isAlphaFeatureBlocked('travelogue')) {
                      showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
                      return;
                    }
                    navigation.navigate('TravelRecordDetail', { travelRecordId });
                  }}
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
                onPressRecord={travelRecordId => {
                  if (isAlphaFeatureBlocked('travelogue')) {
                    showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
                    return;
                  }
                  navigation.navigate('TravelRecordDetail', { travelRecordId });
                }}
              />
            )}
          </View>
        ) : null}

        {isAuthenticated && user ? (
          <View className="px-5">
            <Text className="mb-3 text-base font-bold text-brand-text">{copy.settings}</Text>
            <View className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
              <SettingsRow
                icon="pencil"
                label={copy.editProfile}
                onPress={() => setNicknameModalOpen(true)}
              />
              <SettingsRow
                icon="sparkles"
                label={copy.editPreferences}
                onPress={() => navigation.navigate('Onboarding', { mode: 'edit' })}
              />
              <SettingsRow
                icon="bell"
                label={copy.notificationSettings}
                onPress={() => alert({ title: copy.notificationUnavailable })}
              />
              <SettingsRow
                icon="globe"
                label={copy.languageSettings}
                onPress={() => navigation.navigate('LanguageSelection')}
              />
              <SettingsRow
                icon="settings"
                label={copy.accountSettings}
                onPress={() => setAccountOpen(true)}
              />
              <SettingsRow
                icon="logOut"
                label={copy.logout}
                onPress={handleLogout}
                danger
                showChevron={false}
                last
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {user ? (
        <>
          <AccountSettingsModal
            visible={accountOpen}
            copy={{
              title: copy.accountSettings,
              nickname: copy.nickname,
              email: copy.email,
              provider: copy.provider,
              userId: copy.userId,
              rememberMe: copy.rememberMe,
              rememberMeOn: copy.rememberMeOn,
              rememberMeOff: copy.rememberMeOff,
              hideUserId: copy.hideUserId,
              deleteAccount: copy.deleteAccount,
            }}
            nickname={user.nickname || '—'}
            email={user.email || '—'}
            providerLabel={providerLabel}
            userId={user.userId}
            rememberMe={rememberMe}
            hideUserId={hideUserIdOnMyPage}
            deletingAccount={deletingAccount}
            onClose={() => {
              if (!deletingAccount) {
                setAccountOpen(false);
              }
            }}
            onToggleHideUserId={() => setHideUserIdOnMyPage(!hideUserIdOnMyPage)}
            onDeleteAccount={handleDeleteAccount}
          />
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
        </>
      ) : null}
    </View>
  );
}
