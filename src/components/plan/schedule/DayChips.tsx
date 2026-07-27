import { Pressable, ScrollView, Text, View } from 'react-native';

import { getScheduleDayColor } from '../../../constants/plan/scheduleDayColors';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';
import { formatWeekdayDate } from '../../../utils/geo/geo';
import type { DailyItinerary } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';
import { cn } from '../../../utils/common/cn';

type DayChipsProps = {
  days: DailyItinerary[];
  selectedDayNumber: number;
  onSelect: (dayNumber: number) => void;
  language: AppLanguage;
  canAddDay?: boolean;
  addDayLabel?: string;
  onAddDay?: () => void;
};

export function DayChips({
  days,
  selectedDayNumber,
  onSelect,
  language,
  canAddDay = false,
  addDayLabel,
  onAddDay,
}: DayChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3">
      {days.map(day => {
        const selected = day.dayNumber === selectedDayNumber;
        const color = getScheduleDayColor(day.dayNumber);

        return (
          <Pressable
            key={day.dailyId}
            onPress={() => onSelect(day.dayNumber)}
            className="mr-2 flex-row items-center rounded-full px-3 py-2"
            style={{
              backgroundColor: selected ? color.main : color.light,
              borderWidth: 1.5,
              borderColor: selected ? color.main : color.border,
            }}>
            <View
              className="mr-2 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: selected ? '#FFFFFF' : color.main }}
            />
            <Text
              className="text-sm font-semibold"
              style={{ color: selected ? '#FFFFFF' : color.main }}>
              {formatWeekdayDate(day.date, language)}
            </Text>
          </Pressable>
        );
      })}
      {canAddDay && onAddDay ? (
        <Pressable
          onPress={onAddDay}
          accessibilityRole="button"
          accessibilityLabel={addDayLabel}
          className={cn(
            'mr-2 flex-row items-center rounded-full border border-dashed border-brand-border',
            'bg-brand-surface px-3 py-2 active:bg-brand-selected',
          )}>
          <AppIcon name="plus" size={16} color={ICON_COLOR_PRIMARY} />
          {addDayLabel ? (
            <Text className="ml-1.5 text-sm font-semibold text-brand-primary">{addDayLabel}</Text>
          ) : null}
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
