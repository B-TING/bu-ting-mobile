import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FestivalCard } from '../../components/festival/FestivalCard';
import { MonthCalendar } from '../../components/festival/MonthCalendar';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  FESTIVAL_CALENDAR_COPY,
  MOCK_BUSAN_FESTIVALS,
  festivalDaysInMonth,
  festivalsOnDate,
  formatSelectedDateLabel,
  parseIsoDate,
  todayIso,
} from '../../constants/festivalCalendar';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'FestivalCalendar'>;

export function FestivalCalendarScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = FESTIVAL_CALENDAR_COPY[language];

  const initialDate = route.params?.initialDate ?? todayIso();
  const initialParsed = parseIsoDate(initialDate);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [year, setYear] = useState(initialParsed.getFullYear());
  const [month, setMonth] = useState(initialParsed.getMonth());

  const festivalDays = useMemo(
    () => festivalDaysInMonth(MOCK_BUSAN_FESTIVALS, year, month),
    [year, month],
  );

  const dayFestivals = useMemo(
    () => festivalsOnDate(MOCK_BUSAN_FESTIVALS, selectedDate),
    [selectedDate],
  );

  const dateLabel = formatSelectedDateLabel(selectedDate, language);

  const handleSelectDate = (iso: string) => {
    setSelectedDate(iso);
    const parsed = parseIsoDate(iso);
    setYear(parsed.getFullYear());
    setMonth(parsed.getMonth());
  };

  const handleMonthChange = (nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  };

  return (
    <View
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text">{copy.screenTitle}</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <View className="py-4">
          <MonthCalendar
            year={year}
            month={month}
            selectedDate={selectedDate}
            festivalDays={festivalDays}
            language={language}
            onSelectDate={handleSelectDate}
            onMonthChange={handleMonthChange}
          />
        </View>

        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="text-base font-bold text-brand-text">
            {copy.selectedDateLabel(dateLabel)}
          </Text>
          {dayFestivals.length > 0 ? (
            <Text className="text-xs font-semibold text-brand-muted">
              {copy.festivalCount(dayFestivals.length)}
            </Text>
          ) : null}
        </View>

        {dayFestivals.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-6 py-10">
            <Text className="text-4xl">📅</Text>
            <Text className="mt-3 text-sm font-semibold text-brand-text">{copy.emptyList}</Text>
            <Text className="mt-1 text-xs text-brand-muted">{copy.emptyListSub}</Text>
          </View>
        ) : (
          dayFestivals.map(festival => (
            <FestivalCard
              key={festival.id}
              festival={festival}
              language={language}
              onPress={() =>
                navigation.navigate('FestivalDetail', { festivalId: festival.id })
              }
            />
          ))
        )}

        <Text className="mt-4 text-center text-[10px] text-brand-muted">{copy.mockHint}</Text>
      </ScrollView>
    </View>
  );
}
