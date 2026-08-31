import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  Text,
  TurboModuleRegistry,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import type { CopyFor } from '../../../i18n';
import { AppModal, AppModalActions } from '../../shared/modals';

type Copy = CopyFor<'planDetail'>;

type ClipboardTurboModule = {
  setString: (text: string) => void;
};

const clipboardTurbo = TurboModuleRegistry.get('RNCClipboard') as ClipboardTurboModule | null;

const QR_SIZE = 196;

async function copyInviteLink(link: string): Promise<void> {
  if (clipboardTurbo) {
    clipboardTurbo.setString(link);
    return;
  }

  await Share.share({ message: link });
}

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCopied(false);
    }
  }, [visible, inviteLink]);

  const handleCopy = () => {
    if (!inviteLink) {
      return;
    }
    void copyInviteLink(inviteLink).then(() => setCopied(true));
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
            {inviteLink ? (
              <View className="mb-4 items-center">
                <View className="rounded-2xl border border-brand-border bg-white p-4">
                  <QRCode value={inviteLink} size={QR_SIZE} backgroundColor="#FFFFFF" color="#0B1F33" />
                </View>
                <Text className="mt-3 px-2 text-center text-xs leading-5 text-brand-muted">
                  {copy.inviteQrHint}
                </Text>
              </View>
            ) : null}
            {expiredAt ? (
              <Text className="mb-2 text-xs text-brand-muted">
                {copy.inviteExpiresAt(expiredAt)}
              </Text>
            ) : null}
            <Pressable
              onPress={handleCopy}
              disabled={!inviteLink}
              className="items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
              <Text className="text-sm font-bold text-white">
                {copied ? copy.inviteCopied : copy.inviteCopyLink}
              </Text>
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
