import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/shared/buttons/PrimaryButton';
import { AppBar } from '../components/shared/navigation/AppBar';
import { AppMenuDrawer } from '../components/shared/navigation/AppMenuDrawer';
import { Navbar, type NavbarTab } from '../components/shared/navigation/Navbar';
import { useAppAlert } from '../components/shared/modals';
import { MY_PAGE_COPY } from '../constants/mypage/myPage';
import { layout } from '../constants/common/layout';
import { selectActivePlan, useAppStore, useAuthStore, usePlanStore } from '../stores';
import { selectAuthUser, selectIsAuthenticated } from '../stores/useAuthStore';
import type { RootStackParamList } from '../navigation/types';
import { logoutSession } from '../services/auth/authSession';
import { cn } from '../utils/common/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

const NAVBAR_HEIGHT = 72;

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
        {checked ? <Text className="text-xs text-white">✓</Text> : null}
      </View>
      <Text className="text-sm text-brand-text">{label}</Text>
    </Pressable>
  );
}

export function MyPageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { alert } = useAppAlert();
  const language = useAppStore(s => s.language) ?? 'ko';
  const hideUserIdOnMyPage = useAppStore(s => s.hideUserIdOnMyPage);
  const setHideUserIdOnMyPage = useAppStore(s => s.setHideUserIdOnMyPage);
  const copy = MY_PAGE_COPY[language];
  const activePlan = usePlanStore(selectActivePlan);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectAuthUser);
  const rememberMe = useAuthStore(s => s.rememberMe);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavbarPress = (tab: NavbarTab) => {
    switch (tab) {
      case 'home':
        navigation.navigate('MainHome');
        break;
      case 'route':
        navigation.navigate(activePlan ? 'PlanDetail' : 'PlanWizard');
        break;
      case 'feed':
        navigation.navigate('TravelogueFeed');
        break;
      case 'my':
        break;
      default:
        break;
    }
  };

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

  const providerLabel = user ? copy.providers[user.provider] : '—';

  return (
    <View className="flex-1 bg-brand-background" style={layout.screen}>
      <AppBar
        onMenuPress={() => setMenuOpen(true)}
        onProfilePress={() => undefined}
      />

      <AppMenuDrawer
        visible={menuOpen}
        language={language}
        navigation={navigation}
        onClose={() => setMenuOpen(false)}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: NAVBAR_HEIGHT + insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}>
        <Text className="mb-5 text-[28px] font-bold text-brand-text">{copy.title}</Text>

        <View className="mb-5 rounded-2xl border border-brand-border bg-brand-surface p-5">
          <Text className="mb-4 text-lg font-bold text-brand-text">{copy.profile}</Text>

          {isAuthenticated && user ? (
            <>
              <InfoRow label={copy.nickname} value={user.nickname || '—'} />
              <InfoRow label={copy.email} value={user.email || '—'} />
              <InfoRow label={copy.provider} value={providerLabel} />
              {!hideUserIdOnMyPage ? (
                <InfoRow label={copy.userId} value={user.userId} />
              ) : null}
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

      <Navbar activeTab="my" language={language} onTabPress={handleNavbarPress} />
    </View>
  );
}
