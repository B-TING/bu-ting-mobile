import { Pressable, View } from 'react-native';

import { ICON_COLOR_MUTED } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ScheduleDayChipPanel } from './ScheduleDayChipPanel';
import { ScheduleQuickActions } from './ScheduleQuickActions';
import type { DailyItinerary } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';

type ScheduleDayHeaderRowProps = {
  days: DailyItinerary[];
  selectedDayNumber: number;
  onSelect: (dayNumber: number) => void;
  language: AppLanguage;
  canAddDay?: boolean;
  addDayLabel?: string;
  onAddDay?: () => void;
  canRemoveDay?: boolean;
  removeDayLabel?: string;
  onRemoveDay?: () => void;
  showQuickActions?: boolean;
  onOptimize?: () => void;
  onAddPlace?: () => void;
  optimizeLabel?: string;
  addPlaceLabel?: string;
};

export function ScheduleDayHeaderRow({
  days,
  selectedDayNumber,
  onSelect,
  language,
  canAddDay = false,
  addDayLabel,
  onAddDay,
  canRemoveDay = false,
  removeDayLabel,
  onRemoveDay,
  showQuickActions = false,
  onOptimize,
  onAddPlace,
  optimizeLabel,
  addPlaceLabel,
}: ScheduleDayHeaderRowProps) {
  const quickActions =
    showQuickActions && onOptimize && onAddPlace && optimizeLabel && addPlaceLabel ? (
      <ScheduleQuickActions
        onOptimize={onOptimize}
        onAddPlace={onAddPlace}
        optimizeLabel={optimizeLabel}
        addPlaceLabel={addPlaceLabel}
      />
    ) : null;

  const removeDay =
    canRemoveDay && onRemoveDay ? (
      <Pressable
        onPress={onRemoveDay}
        accessibilityRole="button"
        accessibilityLabel={removeDayLabel}
        hitSlop={8}
        className="mr-1.5 rounded-full border border-brand-border bg-brand-surface p-1.5 active:bg-brand-selected">
        <AppIcon name="minus" size={14} color={ICON_COLOR_MUTED} strokeWidth={2.5} />
      </Pressable>
    ) : null;

  return (
    <View className="w-full flex-row items-center justify-between py-1">
      <View className="shrink-0 flex-row items-center">
        {removeDay}
        {quickActions}
      </View>
      <ScheduleDayChipPanel
        days={days}
        selectedDayNumber={selectedDayNumber}
        onSelect={onSelect}
        language={language}
        canAddDay={canAddDay}
        addDayLabel={addDayLabel}
        onAddDay={onAddDay}
        variant="default"
      />
    </View>
  );
}
