import { StyleSheet, View } from 'react-native';

import { DayChips } from './DayChips';
import type { DailyItinerary } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';

/** 일자 chip 패널 고정 너비 */
export const SCHEDULE_CHIP_PANEL_WIDTH = 200;

type ScheduleDayChipPanelProps = {
  days: DailyItinerary[];
  selectedDayNumber: number;
  onSelect: (dayNumber: number) => void;
  language: AppLanguage;
  canAddDay?: boolean;
  addDayLabel?: string;
  onAddDay?: () => void;
  variant?: 'default' | 'overlay';
};

export function ScheduleDayChipPanel({
  days,
  selectedDayNumber,
  onSelect,
  language,
  canAddDay = false,
  addDayLabel,
  onAddDay,
  variant = 'default',
}: ScheduleDayChipPanelProps) {
  const isOverlay = variant === 'overlay';

  return (
    <View
      style={[
        styles.chipPanel,
        isOverlay ? styles.chipPanelOverlay : undefined,
      ]}>
      <DayChips
        days={days}
        selectedDayNumber={selectedDayNumber}
        onSelect={onSelect}
        language={language}
        canAddDay={canAddDay}
        addDayLabel={addDayLabel}
        onAddDay={onAddDay}
        variant={isOverlay ? 'overlay' : 'default'}
        chipAlign="start"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chipPanel: {
    width: SCHEDULE_CHIP_PANEL_WIDTH,
    overflow: 'hidden',
  },
  chipPanelOverlay: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
});
