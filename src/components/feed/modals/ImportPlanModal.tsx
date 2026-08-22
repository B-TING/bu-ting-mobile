import { Text, TextInput, View } from 'react-native';

import {
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
  type LucideIconName,
} from '../../../constants/icons';
import { TRAVEL_TITLE_MAX_LENGTH } from '../../../constants/plan/planWizard';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import { AppIcon } from '../../shared/icons/AppIcon';
import { AppModal, AppModalActions } from '../../shared/modals';

type Copy = CopyFor<'travelReview'>;

export type ImportPlanModalPhase =
  | 'confirm'
  | 'datePick'
  | 'activePlanWarning'
  | 'success'
  | 'error';

export type ImportPlanModalProps = {
  phase: ImportPlanModalPhase | null;
  copy: Copy;
  language: AppLanguage;
  travelRecordTitle: string;
  activePlanTitle?: string;
  /** 가져올 일정 일수 (종료일 미리보기) */
  dayCount: number;
  startDate: string;
  planTitle: string;
  computedEndDate: string | null;
  startDateValid: boolean;
  importing?: boolean;
  /** error 단계 커스텀 메시지 (없으면 일정 없음 문구) */
  errorMessage?: string | null;
  onChangeStartDate: (value: string) => void;
  onChangePlanTitle: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmDate: () => void;
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
  dayCount,
  startDate,
  planTitle,
  computedEndDate,
  startDateValid,
  importing = false,
  errorMessage = null,
  onChangeStartDate,
  onChangePlanTitle,
  onClose,
  onConfirm,
  onConfirmDate,
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
          : phase === 'datePick'
            ? 'calendar'
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
          : phase === 'datePick'
            ? copy.importPlanDateTitle
            : copy.importPlanConfirmTitle;
  const message =
    phase === 'success'
      ? copy.importPlanSuccessSub
      : phase === 'error'
        ? errorMessage?.trim() || copy.importPlanNoItinerary
        : phase === 'activePlanWarning' && activePlanTitle
          ? copy.importPlanActivePlanMessage(activePlanTitle)
          : phase === 'datePick'
            ? copy.importPlanDateMessage(dayCount)
            : copy.importPlanConfirmMessage(travelRecordTitle);

  const footerActions =
    phase === 'confirm'
      ? [
          { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
          { label: copy.importPlan, onPress: onConfirm, variant: 'primary' as const },
        ]
      : phase === 'datePick'
        ? [
            { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
            {
              label: importing ? copy.importPlanImporting : copy.importPlan,
              onPress: onConfirmDate,
              variant: 'primary' as const,
              disabled: !startDateValid || importing,
            },
          ]
      : phase === 'activePlanWarning'
        ? [
            { label: copy.cancel, onPress: onClose, variant: 'secondary' as const },
            {
              label: importing
                ? copy.importPlanImporting
                : copy.importPlanActivePlanConfirm,
              onPress: onConfirmActivePlan,
              variant: 'primary' as const,
              disabled: importing,
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
          {dayCount > 0 ? (
            <InfoRow label={copy.importPlanDayCountLabel} value={copy.importPlanDayCount(dayCount)} />
          ) : null}
        </View>
      ) : null}

      {phase === 'datePick' ? (
        <View className="mx-5 mt-5 gap-3">
          <View>
            <Text className="mb-1.5 text-xs font-semibold text-brand-muted">
              {copy.importPlanTitleLabel}
            </Text>
            <TextInput
              className="rounded-2xl border border-brand-border bg-brand-background px-4 py-3 text-sm text-brand-text"
              value={planTitle}
              onChangeText={value =>
                onChangePlanTitle(value.slice(0, TRAVEL_TITLE_MAX_LENGTH))
              }
              placeholder={travelRecordTitle || copy.importPlanTitlePlaceholder}
              maxLength={TRAVEL_TITLE_MAX_LENGTH}
              editable={!importing}
              autoCapitalize="sentences"
              autoCorrect={false}
              accessibilityLabel={copy.importPlanTitleLabel}
            />
            <Text className="mt-1 text-right text-xs text-brand-muted">
              {planTitle.length}/{TRAVEL_TITLE_MAX_LENGTH}
            </Text>
          </View>
          <View>
            <Text className="mb-1.5 text-xs font-semibold text-brand-muted">
              {copy.importPlanStartDateLabel}
            </Text>
            <TextInput
              className={`rounded-2xl border bg-brand-background px-4 py-3 text-sm text-brand-text ${
                startDate.length > 0 && !startDateValid
                  ? 'border-amber-400'
                  : 'border-brand-border'
              }`}
              value={startDate}
              onChangeText={onChangeStartDate}
              placeholder="2026-09-10"
              editable={!importing}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel={copy.importPlanStartDateLabel}
            />
            {startDate.length > 0 && !startDateValid ? (
              <Text className="mt-1.5 text-xs text-amber-600">
                {copy.importPlanInvalidDate}
              </Text>
            ) : null}
          </View>
          {computedEndDate ? (
            <View className="rounded-2xl border border-brand-border bg-brand-selected/40 px-4 py-3">
              <InfoRow
                label={copy.importPlanEndDateLabel}
                value={computedEndDate}
              />
              <Text className="mt-1 text-xs leading-5 text-brand-muted">
                {copy.importPlanEndDateHint}
              </Text>
            </View>
          ) : null}
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
