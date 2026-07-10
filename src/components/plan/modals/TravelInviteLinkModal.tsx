import {
  ActivityIndicator,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { CopyFor } from '../../../i18n';
import { AppModal, AppModalActions } from '../../shared/modals';

type Copy = CopyFor<'planDetail'>;

type TravelInviteLinkModalProps = {
  visible: boolean;
  copy: Copy;
  inviteLink: string | null;
  expiredAt?: string | null;
  loading: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onRetry?: () => void;
};

export function TravelInviteLinkModal({
  visible,
  copy,
  inviteLink,
  expiredAt,
  loading,
  errorMessage,
  onClose,
  onRetry,
}: TravelInviteLinkModalProps) {
  const handleShare = () => {
    if (!inviteLink) {
      return;
    }
    void Share.share({ message: inviteLink });
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={copy.inviteModalTitle}
      subtitle={copy.inviteModalSubtitle}
      closeAccessibilityLabel={copy.close}>
      <View className="px-5 pb-2">
        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color="#0077B6" />
            <Text className="mt-3 text-sm text-brand-muted">{copy.inviteLinkLoading}</Text>
          </View>
        ) : errorMessage ? (
          <View className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-700">{errorMessage}</Text>
            {onRetry ? (
              <Pressable onPress={onRetry} className="mt-3 self-start active:opacity-80">
                <Text className="text-sm font-semibold text-brand-primary">{copy.inviteRetry}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <TextInput
              value={inviteLink ?? ''}
              editable={false}
              multiline
              selectTextOnFocus
              className="rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-text"
            />
            {expiredAt ? (
              <Text className="mt-2 text-xs text-brand-muted">
                {copy.inviteExpiresAt(expiredAt)}
              </Text>
            ) : null}
            <Pressable
              onPress={handleShare}
              disabled={!inviteLink}
              accessibilityRole="button"
              accessibilityLabel={copy.inviteShareLink}
              className="mt-3 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
              <Text className="text-sm font-bold text-white">{copy.inviteShareLink}</Text>
            </Pressable>
          </>
        )}
      </View>

      {!loading ? (
        <AppModalActions
          className="pb-4 pt-2"
          actions={[{ label: copy.close, onPress: onClose, variant: 'secondary' }]}
        />
      ) : null}
    </AppModal>
  );
}
