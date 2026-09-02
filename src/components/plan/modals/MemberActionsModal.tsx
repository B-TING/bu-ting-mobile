import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { CopyFor } from '../../../i18n';
import type { MemberRole, PlanMember } from '../../../types/travelPlan';
import { AppModal } from '../../shared/modals';

type Copy = CopyFor<'planDetail'>;

type MemberActionsModalProps = {
  visible: boolean;
  copy: Copy;
  roleLabels: Record<MemberRole, string>;
  member: PlanMember | null;
  canTransfer: boolean;
  canKick: boolean;
  busy: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onTransfer: () => void;
  onKick: () => void;
};

function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function MemberActionsModal({
  visible,
  copy,
  roleLabels,
  member,
  canTransfer,
  canKick,
  busy,
  errorMessage,
  onClose,
  onTransfer,
  onKick,
}: MemberActionsModalProps) {
  const hasActions = canTransfer || canKick;

  return (
    <AppModal
      visible={visible && Boolean(member)}
      onClose={busy ? () => undefined : onClose}
      title={member?.nickname ?? copy.membersTitle}
      subtitle={member ? roleLabels[member.role] : undefined}
      closeAccessibilityLabel={copy.close}
      backdropDismiss={!busy}>
      <View className="px-5 pb-4">
        {member ? (
          <View className="mb-4 items-center">
            <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-brand-primary">
              <Text className="text-lg font-bold text-white">
                {initials(member.nickname)}
              </Text>
            </View>
          </View>
        ) : null}

        {!hasActions ? (
          <Text className="mb-2 text-center text-sm text-brand-muted">
            {copy.memberActionsNone}
          </Text>
        ) : (
          <View className="gap-2">
            {canTransfer ? (
              <Pressable
                disabled={busy}
                onPress={onTransfer}
                className="items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90"
                accessibilityRole="button">
                <Text className="font-bold text-white">{copy.transferLeader}</Text>
              </Pressable>
            ) : null}
            {canKick ? (
              <Pressable
                disabled={busy}
                onPress={onKick}
                className="items-center rounded-2xl border border-red-200 bg-red-50 py-3.5 active:opacity-90"
                accessibilityRole="button">
                <Text className="font-bold text-red-600">{copy.kickMember}</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {errorMessage ? (
          <Text className="mt-3 text-center text-xs text-red-600">{errorMessage}</Text>
        ) : null}

        {busy ? (
          <View className="mt-4 items-center">
            <ActivityIndicator color="#0077B6" />
            <Text className="mt-2 text-xs text-brand-muted">{copy.memberActionsWorking}</Text>
          </View>
        ) : (
          <Pressable
            onPress={onClose}
            className="mt-3 items-center rounded-2xl border border-brand-border bg-brand-surface py-3.5 active:opacity-80"
            accessibilityRole="button">
            <Text className="font-bold text-brand-text">{copy.close}</Text>
          </Pressable>
        )}
      </View>
    </AppModal>
  );
}
