import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FestivalCard } from '../../components/festival/FestivalCard';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  FESTIVAL_CALENDAR_COPY,
  MOCK_BUSAN_FESTIVALS,
  festivalsInMonth,
  parseIsoDate,
  todayIso,
} from '../../constants/festival/festivalCalendar';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'FestivalCalendar'>;

export function FestivalCalendarScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = FESTIVAL_CALENDAR_COPY[language];

  const initialDate = route.params?.initialDate ?? todayIso();
  const initialParsed = parseIsoDate(initialDate);

  const [year, setYear] = useState(initialParsed.getFullYear());
  const [month, setMonth] = useState(initialParsed.getMonth());

  const monthFestivals = useMemo(
    () => festivalsInMonth(MOCK_BUSAN_FESTIVALS, year, month),
    [year, month],
  );

  const goPrevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
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

      <View className="flex-row items-center justify-between border-b border-brand-border bg-brand-surface px-4 py-3">
        <Pressable
          onPress={goPrevMonth}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-brand-selected"
          accessibilityRole="button"
          accessibilityLabel={copy.prevMonth}>
          <Text className="text-xl font-bold text-brand-primary">‹</Text>
        </Pressable>
        <View className="items-center">
          <Text className="text-base font-bold text-brand-text">
            {copy.monthFestivalsLabel(year, month)}
          </Text>
          {monthFestivals.length > 0 ? (
            <Text className="mt-0.5 text-xs text-brand-muted">
              {copy.festivalCount(monthFestivals.length)}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={goNextMonth}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-brand-selected"
          accessibilityRole="button"
          accessibilityLabel={copy.nextMonth}>
          <Text className="text-xl font-bold text-brand-primary">›</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        {monthFestivals.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-6 py-12">
            <Text className="text-4xl">🎪</Text>
            <Text className="mt-3 text-sm font-semibold text-brand-text">{copy.emptyMonthList}</Text>
            <Text className="mt-1 text-xs text-brand-muted">{copy.emptyMonthListSub}</Text>
          </View>
        ) : (
          monthFestivals.map(festival => (
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

        <Text className="mt-2 text-center text-[10px] text-brand-muted">{copy.mockHint}</Text>
      </ScrollView>
    </View>
  );
}
