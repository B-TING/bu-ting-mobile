import { Text, View } from 'react-native';

import type { TRAVEL_REVIEW_COPY } from '../../../constants/travelReview';
import type { Travelogue } from '../../../types/travelReview';
import type { TravelPlan } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';
import { AppModal, AppModalActions } from '../../shared/modals';

type Copy = (typeof TRAVEL_REVIEW_COPY)[AppLanguage];

export type ImportPlanModalPhase = 'confirm' | 'activePlanConfirm' | 'success' | 'error';

export type ImportPlanModalProps = {
  visible: boolean;
  phase: ImportPlanModalPhase;
  copy: Copy;
  travelogue: Travelogue;
  activePlan?: TravelPlan | null;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmOverwrite: () => void;
  onViewPlan: () => void;
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
  visible,
  phase,
  copy,
  travelogue,
  activePlan,
  onClose,
  onConfirm,
  onConfirmOverwrite,
  onViewPlan,
}: ImportPlanModalProps) {
  const tripPeriod =
    travelogue.startDate && travelogue.endDate
      ? copy.tripPeriod(travelogue.startDate, travelogue.endDate)
      : null;

  const activePlanPeriod =
    activePlan?.startDate && activePlan?.endDate
      ? copy.tripPeriod(activePlan.startDate, activePlan.endDate)
      : null;

  const icon =
    phase === 'success'
      ? '✅'
      : phase === 'error'
        ? '⚠️'
        : phase === 'activePlanConfirm'
          ? '🧳'
          : '📋';
  const title =
    phase === 'success'
      ? copy.importPlanSuccess
      : phase === 'error'
        ? copy.importPlanConfirmTitle
        : phase === 'activePlanConfirm'
          ? copy.importPlanActivePlanTitle
          : copy.importPlanConfirmTitle;
  const message =
    phase === 'success'
      ? copy.importPlanSuccessSub
      : phase === 'error'
        ? copy.importPlanNoItinerary
        : phase === 'activePlanConfirm' && activePlan
          ? copy.importPlanActivePlanMessage(activePlan.title)
          : copy.importPlanConfirmMessage(travelogue.title);

  const footerActions =
    phase === 'confirm'
      ? [
          { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
          { label: copy.importPlan, onPress: onConfirm, variant: 'primary' as const },
        ]
      : phase === 'activePlanConfirm'
        ? [
            { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
            {
              label: copy.importPlanActivePlanConfirm,
              onPress: onConfirmOverwrite,
              variant: 'primary' as const,
            },
          ]
        : phase === 'success'
          ? [
              { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
              { label: copy.importPlanGo, onPress: onViewPlan, variant: 'primary' as const },
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
          <Text className="text-3xl">{icon}</Text>
        </View>
        <Text className="text-center text-xl font-bold text-brand-text">{title}</Text>
        <Text className="mt-2 text-center text-sm leading-6 text-brand-muted">{message}</Text>
      </View>

      {phase === 'confirm' ? (
        <View className="mx-5 mt-5 rounded-2xl border border-brand-border bg-brand-background px-4 py-3">
          <InfoRow label={copy.travelogueTitle} value={travelogue.title} />
          <InfoRow label={copy.authorLabel} value={travelogue.authorName} />
          <InfoRow label={copy.placeLabel} value={travelogue.destinationLabel} />
          {tripPeriod ? <InfoRow label={copy.tripPeriodLabel} value={tripPeriod} /> : null}
        </View>
      ) : null}

      {phase === 'activePlanConfirm' && activePlan ? (
        <View className="mx-5 mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <InfoRow label={copy.activePlanLabel} value={activePlan.title} />
          {activePlanPeriod ? (
            <InfoRow label={copy.tripPeriodLabel} value={activePlanPeriod} />
          ) : null}
          <InfoRow label={copy.travelogueTitle} value={travelogue.title} />
        </View>
      ) : null}
    </AppModal>
  );
}
