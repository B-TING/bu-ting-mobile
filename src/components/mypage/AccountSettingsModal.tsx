import { Pressable, ScrollView, Text, View } from 'react-native';

import { ICON_COLOR_WHITE } from '../../constants/icons';
import { cn } from '../../utils/common/cn';
import { AppIcon } from '../shared/icons/AppIcon';
import { AppModal } from '../shared/modals';

type AccountSettingsCopy = {
  title: string;
  nickname: string;
  email: string;
  provider: string;
  userId: string;
  rememberMe: string;
  rememberMeOn: string;
  rememberMeOff: string;
  hideUserId: string;
  deleteAccount: string;
};

type AccountSettingsModalProps = {
  visible: boolean;
  copy: AccountSettingsCopy;
  nickname: string;
  email: string;
  providerLabel: string;
  userId: string;
  rememberMe: boolean;
  hideUserId: boolean;
  deletingAccount: boolean;
  onClose: () => void;
  onToggleHideUserId: () => void;
  onDeleteAccount: () => void;
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

export function AccountSettingsModal({
  visible,
  copy,
  nickname,
  email,
  providerLabel,
  userId,
  rememberMe,
  hideUserId,
  deletingAccount,
  onClose,
  onToggleHideUserId,
  onDeleteAccount,
}: AccountSettingsModalProps) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={copy.title}
      maxHeight="85%"
      showHandle
      backdropDismiss={!deletingAccount}>
      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 8 }}>
        <InfoRow label={copy.nickname} value={nickname || '—'} />
        <InfoRow label={copy.email} value={email || '—'} />
        <InfoRow label={copy.provider} value={providerLabel} />
        {!hideUserId ? <InfoRow label={copy.userId} value={userId} /> : null}
        <InfoRow
          label={copy.rememberMe}
          value={rememberMe ? copy.rememberMeOn : copy.rememberMeOff}
        />
        <SettingToggle
          label={copy.hideUserId}
          checked={hideUserId}
          onPress={onToggleHideUserId}
        />
        <Pressable
          onPress={onDeleteAccount}
          disabled={deletingAccount}
          className={cn('mb-2 self-start active:opacity-70', deletingAccount && 'opacity-50')}
          accessibilityRole="button">
          <Text className="text-sm font-semibold text-red-600">{copy.deleteAccount}</Text>
        </Pressable>
      </ScrollView>
    </AppModal>
  );
}
