import { Pressable, ScrollView, Text, View } from 'react-native';

import { getScheduleDayColor } from '../../../constants/plan/scheduleDayColors';
import type { AppLanguage } from '../../../types/user';
import { formatWeekdayDate } from '../../../utils/geo/geo';

type BudgetDateChipsProps = {
  dates: string[];
  tripDates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
  language: AppLanguage;
};

function dayIndexForDate(date: string, tripDates: string[]): number {
  const index = tripDates.indexOf(date);
  return index >= 0 ? index + 1 : tripDates.length + 1;
}

export function BudgetDateChips({
  dates,
  tripDates,
  selectedDate,
  onSelect,
  language,
}: BudgetDateChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ alignItems: 'center' }}>
      {dates.map(date => {
        const selected = date === selectedDate;
        const color = getScheduleDayColor(dayIndexForDate(date, tripDates));
        return (
          <Pressable
            key={date}
            onPress={() => onSelect(date)}
            className="mr-1.5 flex-row items-center rounded-full px-2.5 py-1"
            style={{
              backgroundColor: selected ? color.main : color.light,
              borderWidth: 1.5,
              borderColor: selected ? color.main : color.border,
            }}>
            <View
              className="mr-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: selected ? '#FFFFFF' : color.main }}
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: selected ? '#FFFFFF' : color.main }}>
              {formatWeekdayDate(date, language)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
