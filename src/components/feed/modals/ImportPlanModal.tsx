import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TRAVEL_REVIEW_COPY } from '../../../constants/travelReview';
import type { Travelogue } from '../../../types/travelReview';
import type { TravelPlan } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';

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
  const insets = useSafeAreaInsets();

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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.cancel} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

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

          <View className="mt-6 flex-row gap-3 px-5">
            {phase === 'confirm' ? (
              <>
                <Pressable
                  onPress={onClose}
                  className="flex-1 items-center rounded-2xl border border-brand-border bg-brand-surface py-3.5 active:opacity-80">
                  <Text className="font-bold text-brand-text">{copy.cancel}</Text>
                </Pressable>
                <Pressable
                  onPress={onConfirm}
                  className="flex-1 items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90">
                  <Text className="font-bold text-white">{copy.importPlan}</Text>
                </Pressable>
              </>
            ) : phase === 'activePlanConfirm' ? (
              <>
                <Pressable
                  onPress={onClose}
                  className="flex-1 items-center rounded-2xl border border-brand-border bg-brand-surface py-3.5 active:opacity-80">
                  <Text className="font-bold text-brand-text">{copy.cancel}</Text>
                </Pressable>
                <Pressable
                  onPress={onConfirmOverwrite}
                  className="flex-1 items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90">
                  <Text className="font-bold text-white">{copy.importPlanActivePlanConfirm}</Text>
                </Pressable>
              </>
            ) : phase === 'success' ? (
              <>
                <Pressable
                  onPress={onClose}
                  className="flex-1 items-center rounded-2xl border border-brand-border bg-brand-surface py-3.5 active:opacity-80">
                  <Text className="font-bold text-brand-text">{copy.cancel}</Text>
                </Pressable>
                <Pressable
                  onPress={onViewPlan}
                  className="flex-1 items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90">
                  <Text className="font-bold text-white">{copy.importPlanGo}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={onClose}
                className="flex-1 items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90">
                <Text className="font-bold text-white">{copy.importPlanClose}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 8,
  },
});
