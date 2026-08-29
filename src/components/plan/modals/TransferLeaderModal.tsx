import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { CopyFor } from '../../../i18n';
import type { MemberRole, PlanMember } from '../../../types/travelPlan';
import { AppModal, AppModalActions } from '../../shared/modals';
import { cn } from '../../../utils/common/cn';

type Copy = CopyFor<'planDetail'>;

type TransferLeaderModalProps = {
  visible: boolean;
  copy: Copy;
  roleLabels: Record<MemberRole, string>;
  candidates: PlanMember[];
  submitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (newLeaderUserId: string) => void;
};

function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function TransferLeaderModal({
  visible,
  copy,
  roleLabels,
  candidates,
  submitting,
  errorMessage,
  onClose,
  onConfirm,
}: TransferLeaderModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedUserId(null);
    }
  }, [visible]);

  return (
    <AppModal
      visible={visible}
      onClose={submitting ? () => undefined : onClose}
      title={copy.transferLeaderTitle}
      subtitle={copy.transferLeaderSubtitle}
      closeAccessibilityLabel={copy.close}
      backdropDismiss={!submitting}>
      <View className="px-5 pb-2">
        {candidates.length === 0 ? (
          <Text className="py-6 text-center text-sm text-brand-muted">
            {copy.transferLeaderEmpty}
          </Text>
        ) : (
          <View className="gap-2">
            {candidates.map(member => {
              const selected = selectedUserId === member.userId;
              return (
                <Pressable
                  key={member.userId}
                  disabled={submitting}
                  onPress={() => setSelectedUserId(member.userId)}
                  className={cn(
                    'flex-row items-center rounded-2xl border px-3 py-3 active:opacity-80',
                    selected
                      ? 'border-brand-primary bg-brand-selected'
                      : 'border-brand-border bg-brand-surface',
                    submitting && 'opacity-50',
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-primary">
                    <Text className="text-sm font-bold text-white">
                      {initials(member.nickname)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-brand-text" numberOfLines={1}>
                      {member.nickname}
                    </Text>
                    <Text className="mt-0.5 text-xs text-brand-muted">
                      {roleLabels[member.role]}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'h-5 w-5 rounded-full border-2',
                      selected
                        ? 'border-brand-primary bg-brand-primary'
                        : 'border-brand-border bg-white',
                    )}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        {errorMessage ? (
          <Text className="mt-3 text-center text-xs text-red-600">{errorMessage}</Text>
        ) : null}

        {submitting ? (
          <View className="mt-4 items-center">
            <ActivityIndicator color="#0077B6" />
            <Text className="mt-2 text-xs text-brand-muted">{copy.transferLeaderWorking}</Text>
          </View>
        ) : null}
      </View>

      <AppModalActions
        className="mt-2 px-5 pb-4"
        actions={[
          {
            label: copy.transferLeaderConfirm,
            onPress: () => {
              if (!selectedUserId || submitting) {
                return;
              }
              onConfirm(selectedUserId);
            },
            variant: 'primary',
            disabled: !selectedUserId || submitting || candidates.length === 0,
          },
          {
            label: copy.close,
            onPress: onClose,
            variant: 'secondary',
            disabled: submitting,
          },
        ]}
      />
    </AppModal>
  );
}
