import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventCallout } from '../../components/eventZone/EventCallout';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import {
  BRAND_BORDER,
  BRAND_MUTED,
  BRAND_PAGE_BG,
  BRAND_PRIMARY,
  BRAND_TEXT,
} from '../../components/eventZone/eventZoneTheme';
import { TEST_ID } from '../../constants/e2e/testIds';
import { useNotificationSettingsScreen } from '../../hooks/mypage/useNotificationSettingsScreen';
import { useAppLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import type { NotificationType } from '../../types/notification';
import { cn } from '../../utils/common/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

type PreferenceRowProps = {
  label: string;
  hint: string;
  value: boolean;
  disabled?: boolean;
  last?: boolean;
  testID: string;
  onValueChange: (value: boolean) => void;
};

function PreferenceRow({
  label,
  hint,
  value,
  disabled,
  last,
  testID,
  onValueChange,
}: PreferenceRowProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        !last && 'border-b',
        disabled && 'opacity-50',
      )}
      style={!last ? { borderBottomColor: BRAND_BORDER } : undefined}>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold leading-[22px]" style={{ color: BRAND_TEXT }}>
          {label}
        </Text>
        <Text className="mt-0.5 text-[12px] leading-[18px]" style={{ color: BRAND_MUTED }}>
          {hint}
        </Text>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: BRAND_BORDER, true: BRAND_PRIMARY }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={BRAND_BORDER}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      />
    </View>
  );
}

export function NotificationSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const {
    copy,
    isAuthenticated,
    hydrated,
    syncing,
    errorMessage,
    enabled,
    settings,
    preferenceKeys,
    setEnabled,
    setPreference,
    goBack,
    goLogin,
  } = useNotificationSettingsScreen(navigation);

  const categoryDisabled = !isAuthenticated || !enabled || syncing;

  return (
    <View
      testID={TEST_ID.notificationSettings.screen}
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: BRAND_PAGE_BG }}>
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={copy.screenTitle}
          subtitle={copy.subtitle}
          onBack={goBack}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
        />
      </View>

      {!hydrated ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 p-4"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}>
          {!isAuthenticated ? (
            <Pressable
              accessibilityRole="button"
              onPress={goLogin}
              className="rounded-2xl border bg-white px-4 py-3 active:opacity-80"
              style={{ borderColor: BRAND_BORDER }}>
              <Text className="text-[13px] leading-5" style={{ color: BRAND_MUTED }}>
                {copy.loginRequired}
              </Text>
              <Text className="mt-1 text-[13px] font-bold" style={{ color: BRAND_PRIMARY }}>
                {copy.loginAction}
              </Text>
            </Pressable>
          ) : null}

          {errorMessage ? (
            <EventCallout title={errorMessage} body=" " tone="warning" />
          ) : null}

          <View className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: BRAND_BORDER }}>
            <PreferenceRow
              label={copy.masterLabel}
              hint={copy.masterHint}
              value={enabled}
              disabled={!isAuthenticated || syncing}
              testID={TEST_ID.notificationSettings.master}
              onValueChange={setEnabled}
            />
          </View>

          <View>
            <Text className="mb-2 px-0.5 text-[13px] font-bold" style={{ color: BRAND_TEXT }}>
              {copy.categoriesTitle}
            </Text>
            <View className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: BRAND_BORDER }}>
              {preferenceKeys.map((key: NotificationType, index) => {
                const labels = copy.typeLabels[key];
                return (
                  <PreferenceRow
                    key={key}
                    label={labels.label}
                    hint={labels.hint}
                    value={settings[key]}
                    disabled={categoryDisabled}
                    last={index === preferenceKeys.length - 1}
                    testID={TEST_ID.notificationSettings.type(key)}
                    onValueChange={next => setPreference(key, next)}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
