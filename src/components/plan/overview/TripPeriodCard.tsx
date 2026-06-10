import { Text, View } from 'react-native';

import { dayCountBetween } from '../../../constants/planWizard';
import type { AppLanguage } from '../../../types/user';
import { formatWeekdayDate } from '../../../utils/geo';

type TripPeriodCardProps = {
  startDate: string;
  endDate: string;
  language: AppLanguage;
  periodLabel: string;
  nightsLabel: (n: number) => string;
};

function parseDateParts(iso: string) {
  const d = new Date(iso);
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
    year: d.getFullYear(),
  };
}

export function TripPeriodCard({
  startDate,
  endDate,
  language,
  periodLabel,
  nightsLabel,
}: TripPeriodCardProps) {
  const dayCount = dayCountBetween(startDate, endDate);
  const nights = Math.max(0, dayCount - 1);
  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate);

  return (
    <View className="mb-5 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
      <View className="bg-brand-primary px-4 py-3">
        <Text className="text-xs font-semibold uppercase tracking-wide text-white/80">
          {periodLabel}
        </Text>
        <Text className="mt-0.5 text-lg font-bold text-white">
          {dayCount}
          {language === 'ko' ? '일 여행' : language === 'ja' ? '日間' : language === 'zh' ? '天行程' : '-day trip'}
        </Text>
        {nights > 0 && (
          <Text className="mt-0.5 text-sm text-white/90">{nightsLabel(nights)}</Text>
        )}
      </View>

      <View className="flex-row items-center px-4 py-4">
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-brand-primary">
            {start.month}/{start.day}
          </Text>
          <Text className="mt-0.5 text-xs text-brand-muted">{start.year}</Text>
          <Text className="mt-1 text-sm font-semibold text-brand-text">
            {formatWeekdayDate(startDate, language)}
          </Text>
        </View>

        <View className="mx-3 items-center">
          <View className="h-px w-10 bg-brand-border" />
          <Text className="my-1 text-lg text-brand-muted">→</Text>
          <View className="h-px w-10 bg-brand-border" />
        </View>

        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-brand-primary">
            {end.month}/{end.day}
          </Text>
          <Text className="mt-0.5 text-xs text-brand-muted">{end.year}</Text>
          <Text className="mt-1 text-sm font-semibold text-brand-text">
            {formatWeekdayDate(endDate, language)}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-center gap-1.5 border-t border-brand-border px-4 py-3">
        {Array.from({ length: dayCount }, (_, i) => (
          <View
            key={i}
            className="h-2 flex-1 max-w-8 rounded-full"
            style={{ backgroundColor: i === 0 ? '#0077B6' : '#90E0EF' }}
          />
        ))}
      </View>
    </View>
  );
}
