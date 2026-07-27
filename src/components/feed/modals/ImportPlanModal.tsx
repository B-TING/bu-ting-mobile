import { Text, View } from 'react-native';

import {
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
  type LucideIconName,
} from '../../../constants/icons';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import { AppIcon } from '../../shared/icons/AppIcon';
import { AppModal, AppModalActions } from '../../shared/modals';

type Copy = CopyFor<'travelReview'>;

export type ImportPlanModalPhase =
  | 'confirm'
  | 'activePlanWarning'
  | 'success'
  | 'error';

export type ImportPlanModalProps = {
  phase: ImportPlanModalPhase | null;
  copy: Copy;
  language: AppLanguage;
  travelRecordTitle: string;
  activePlanTitle?: string;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmActivePlan: () => void;
  onGoToPlan: () => void;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start py-1.5">
      <Text className="w-16 text-xs font-semibold text-brand-muted">{label}</Text>
      <Text className="flex-1 text-sm text-brand-text">{value}</Text>
    </View>
  );
}

export function ImportPlanModal({
  phase,
  copy,
  travelRecordTitle,
  activePlanTitle,
  onClose,
  onConfirm,
  onConfirmActivePlan,
  onGoToPlan,
}: ImportPlanModalProps) {
  const visible = phase != null;

  const iconName: LucideIconName =
    phase === 'success'
      ? 'checkCircle'
      : phase === 'error'
        ? 'alertTriangle'
        : phase === 'activePlanWarning'
          ? 'luggage'
          : 'clipboardList';
  const iconColor =
    phase === 'success'
      ? ICON_COLOR_PRIMARY
      : phase === 'error'
        ? '#F59E0B'
        : ICON_COLOR_MUTED;
  const title =
    phase === 'success'
      ? copy.importPlanSuccess
      : phase === 'error'
        ? copy.importPlanConfirmTitle
        : phase === 'activePlanWarning'
          ? copy.importPlanActivePlanTitle
          : copy.importPlanConfirmTitle;
  const message =
    phase === 'success'
      ? copy.importPlanSuccessSub
      : phase === 'error'
        ? copy.importPlanNoItinerary
        : phase === 'activePlanWarning' && activePlanTitle
          ? copy.importPlanActivePlanMessage(activePlanTitle)
          : copy.importPlanConfirmMessage(travelRecordTitle);

  const footerActions =
    phase === 'confirm'
      ? [
          { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
          { label: copy.importPlan, onPress: onConfirm, variant: 'primary' as const },
        ]
      : phase === 'activePlanWarning'
        ? [
            { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
            {
              label: copy.importPlanActivePlanConfirm,
              onPress: onConfirmActivePlan,
              variant: 'primary' as const,
            },
          ]
        : phase === 'success'
          ? [
              { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
              { label: copy.importPlanGo, onPress: onGoToPlan, variant: 'primary' as const },
            ]
          : [{ label: copy.importPlanClose, onPress: onClose, variant: 'primary' as const }];

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      closeAccessibilityLabel={copy.cancel}
      footer={<AppModalActions className="mt-6" actions={footerActions} />}>
      <View className="items-center px-5 pt-2">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-brand-selected">
          <AppIcon name={iconName} size={36} color={iconColor} />
        </View>
        <Text className="text-center text-xl font-bold text-brand-text">{title}</Text>
        <Text className="mt-2 text-center text-sm leading-6 text-brand-muted">{message}</Text>
      </View>

      {phase === 'confirm' ? (
        <View className="mx-5 mt-5 rounded-2xl border border-brand-border bg-brand-background px-4 py-3">
          <InfoRow label={copy.travelogueTitle} value={travelRecordTitle} />
        </View>
      ) : null}

      {phase === 'activePlanWarning' && activePlanTitle ? (
        <View className="mx-5 mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <InfoRow label={copy.activePlanLabel} value={activePlanTitle} />
          <InfoRow label={copy.travelogueTitle} value={travelRecordTitle} />
        </View>
      ) : null}
    </AppModal>
  );
}
