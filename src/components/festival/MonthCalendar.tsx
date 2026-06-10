import { Pressable, Text, View } from 'react-native';

import { FESTIVAL_CALENDAR_COPY, isSameIsoDate, toIsoDate, todayIso } from '../../constants/festivalCalendar';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/cn';

const MONTH_NAMES: Record<AppLanguage, string[]> = {
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

type MonthCalendarProps = {
  year: number;
  month: number;
  selectedDate: string;
  festivalDays: Set<number>;
  language: AppLanguage;
  onSelectDate: (iso: string) => void;
  onMonthChange: (year: number, month: number) => void;
};

export function MonthCalendar({
  year,
  month,
  selectedDate,
  festivalDays,
  language,
  onSelectDate,
  onMonthChange,
}: MonthCalendarProps) {
  const copy = FESTIVAL_CALENDAR_COPY[language];
  const today = todayIso();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const goPrevMonth = () => {
    if (month === 0) {
      onMonthChange(year - 1, 11);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 11) {
      onMonthChange(year + 1, 0);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <View className="rounded-2xl border border-brand-border bg-brand-surface p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={goPrevMonth}
          hitSlop={12}
          className="h-8 w-8 items-center justify-center rounded-full active:bg-brand-selected"
          accessibilityRole="button"
          accessibilityLabel="Previous month">
          <Text className="text-lg font-bold text-brand-primary">‹</Text>
        </Pressable>
        <Text className="text-base font-bold text-brand-text">
          {language === 'ko'
            ? `${year}년 ${MONTH_NAMES[language][month]}`
            : `${MONTH_NAMES[language][month]} ${year}`}
        </Text>
        <Pressable
          onPress={goNextMonth}
          hitSlop={12}
          className="h-8 w-8 items-center justify-center rounded-full active:bg-brand-selected"
          accessibilityRole="button"
          accessibilityLabel="Next month">
          <Text className="text-lg font-bold text-brand-primary">›</Text>
        </Pressable>
      </View>

      <View className="mb-1 flex-row">
        {copy.weekDays.map(day => (
          <View key={day} className="flex-1 items-center py-1">
            <Text className="text-[11px] font-semibold text-brand-muted">{day}</Text>
          </View>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }).map((_, rowIndex) => (
        <View key={rowIndex} className="flex-row">
          {cells.slice(rowIndex * 7, rowIndex * 7 + 7).map((day, colIndex) => {
            if (day == null) {
              return <View key={`empty-${rowIndex}-${colIndex}`} className="h-10 flex-1" />;
            }

            const iso = toIsoDate(year, month, day);
            const isSelected = isSameIsoDate(iso, selectedDate);
            const isToday = isSameIsoDate(iso, today);
            const hasFestival = festivalDays.has(day);

            return (
              <Pressable
                key={iso}
                onPress={() => onSelectDate(iso)}
                className="h-10 flex-1 items-center justify-center"
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <View
                  className={cn(
                    'h-8 w-8 items-center justify-center rounded-full',
                    isSelected && 'bg-brand-primary',
                    !isSelected && isToday && 'border border-brand-primary',
                  )}>
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      isSelected ? 'text-white' : isToday ? 'text-brand-primary' : 'text-brand-text',
                    )}>
                    {day}
                  </Text>
                </View>
                {hasFestival ? (
                  <View
                    className={cn(
                      'mt-0.5 h-1 w-1 rounded-full',
                      isSelected ? 'bg-white' : 'bg-brand-primary',
                    )}
                  />
                ) : (
                  <View className="mt-0.5 h-1 w-1" />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
