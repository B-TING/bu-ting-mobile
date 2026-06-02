import { Pressable, ScrollView, Text } from 'react-native';

import { formatWeekdayDate } from '../../utils/geo';
import type { DailyItinerary } from '../../types/travelPlan';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/cn';

type DayChipsProps = {
  days: DailyItinerary[];
  selectedDayNumber: number;
  onSelect: (dayNumber: number) => void;
  language: AppLanguage;
};

export function DayChips({
  days,
  selectedDayNumber,
  onSelect,
  language,
}: DayChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-3">
      {days.map(day => {
        const selected = day.dayNumber === selectedDayNumber;
        return (
          <Pressable
            key={day.dailyId}
            onPress={() => onSelect(day.dayNumber)}
            className={cn(
              'mr-2 rounded-full px-4 py-2',
              selected ? 'bg-brand-primary' : 'bg-brand-border',
            )}>
            <Text
              className={cn(
                'text-sm font-semibold',
                selected ? 'text-white' : 'text-brand-text',
              )}>
              {formatWeekdayDate(day.date, language)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
