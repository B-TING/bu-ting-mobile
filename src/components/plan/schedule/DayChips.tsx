import { Pressable, ScrollView, Text, View } from 'react-native';

import { getScheduleDayColor } from '../../../constants/scheduleDayColors';
import { formatWeekdayDate } from '../../../utils/geo';
import type { DailyItinerary } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';

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
    </ScrollView>
  );
}
