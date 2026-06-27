import { Pressable, ScrollView, Text, View } from 'react-native';

import type { PLAN_DETAIL_COPY } from '../../../constants/plan/planDetail';
import type { AppLanguage } from '../../../types/user';
import type { TravelPlan } from '../../../types/travelPlan';
import { formatWeekdayDate } from '../../../utils/geo/geo';
import { representativeRoute, sortedRoutes } from '../../../utils/plan/planItinerary';
import { getNearestUpcomingStop } from '../../../utils/plan/planSchedule';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type ScheduleOverviewSectionProps = {
  plan: TravelPlan;
  language: AppLanguage;
  copy: Copy;
  onPress: () => void;
};

const DAY_CHIP_WIDTH = 108;

export function ScheduleOverviewSection({
  plan,
  language,
  copy,
  onPress,
}: ScheduleOverviewSectionProps) {
  const upcoming = getNearestUpcomingStop(plan);

  return (
    <View className="mb-3 overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
      <Pressable onPress={onPress} className="active:opacity-90">
        <View className="flex-row items-center justify-between border-b border-brand-border px-3 py-2">
          <Text className="text-sm font-bold text-brand-text">{copy.dailyHighlights}</Text>
          <Text className="text-[10px] font-semibold text-brand-primary">{copy.viewTab}</Text>
        </View>

        {upcoming ? (
          <View className="mx-3 mt-2.5 rounded-lg bg-brand-primary/10 px-3 py-2.5">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-brand-primary">
              {copy.nextScheduleTitle}
            </Text>
            <Text className="mt-0.5 text-sm font-bold text-brand-text" numberOfLines={1}>
              {upcoming.route.placeName}
            </Text>
            <Text className="mt-0.5 text-[10px] text-brand-muted">
              {copy.dayLabel(upcoming.day.dayNumber)} · {formatWeekdayDate(upcoming.day.date, language)}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        className="mt-2.5"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 12 }}>
        {plan.itinerary.map(day => {
          const routes = sortedRoutes(day.routes);
          const rep = representativeRoute(day.routes);
          const extra = routes.length > 1 ? routes.length - 1 : 0;

          return (
            <View
              key={day.dailyId}
              style={{ width: DAY_CHIP_WIDTH }}
              className="rounded-lg border border-brand-border bg-brand-background px-2.5 py-2">
              <View className="mb-1 flex-row items-center gap-1.5">
                <View className="h-5 w-5 items-center justify-center rounded-full bg-brand-primary">
                  <Text className="text-[10px] font-bold text-white">{day.dayNumber}</Text>
                </View>
                <Text className="flex-1 text-[10px] text-brand-muted" numberOfLines={1}>
                  {formatWeekdayDate(day.date, language)}
                </Text>
              </View>
              <Text className="text-xs font-semibold text-brand-text" numberOfLines={2}>
                {rep?.placeName ?? copy.noRouteThatDay}
              </Text>
              {extra > 0 && rep ? (
                <Text className="mt-0.5 text-[10px] text-brand-muted">{copy.morePlaces(extra)}</Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
