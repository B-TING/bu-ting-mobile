import { Pressable, Text, View } from 'react-native';

import { DayChips } from '../DayChips';
import { RouteItemCard } from '../RouteItemCard';
import { TravelLegRow } from '../TravelLegRow';
import type { PLAN_DETAIL_COPY } from '../../../constants/planDetail';
import type { AppLanguage } from '../../../types/user';
import type { RouteItem, TravelPlan } from '../../../types/travelPlan';
import { sortedRoutes } from '../../../utils/planItinerary';
import { estimateTravelLeg } from '../../../utils/geo';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type PlanScheduleTabProps = {
  plan: TravelPlan;
  language: AppLanguage;
  copy: Copy;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSelectRoute: (route: RouteItem) => void;
  onToggleVisited: (itemId: string) => void;
};

export function PlanScheduleTab({
  plan,
  language,
  copy,
  selectedDay,
  onSelectDay,
  onSelectRoute,
  onToggleVisited,
}: PlanScheduleTabProps) {
  const day =
    plan.itinerary.find(d => d.dayNumber === selectedDay) ?? plan.itinerary[0];
  const dayRoutes = day ? sortedRoutes(day.routes) : [];
  const hasStay = plan.itinerary.some(d =>
    d.routes.some(r => r.type === 'ACCOMMODATION'),
  );

  return (
    <View className="px-4">
      <DayChips
        days={plan.itinerary}
        selectedDayNumber={day?.dayNumber ?? 1}
        onSelect={onSelectDay}
        language={language}
      />

      {!hasStay && (
        <View className="mb-4 rounded-2xl border border-[#C4B5FD] bg-[#F5F3FF] p-4">
          <Text className="mb-2 text-sm text-brand-text">{copy.hotelHint}</Text>
          <Pressable className="self-start rounded-full bg-[#7C3AED] px-4 py-2 active:opacity-90">
            <Text className="text-sm font-semibold text-white">{copy.hotelCta}</Text>
          </Pressable>
        </View>
      )}

      <View className="mb-3 flex-row gap-2">
        <Pressable className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 active:opacity-80">
          <Text className="text-xs font-semibold text-brand-text">{copy.routeOptimize}</Text>
        </Pressable>
        <Pressable className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 active:opacity-80">
          <Text className="text-xs font-semibold text-brand-muted">{copy.addPlace}</Text>
        </Pressable>
      </View>

      <Text className="mb-2 mt-2 text-lg font-bold text-brand-text">
        {day?.date} · Day {day?.dayNumber}
      </Text>

      {dayRoutes.map((r, index) => {
        const prev = dayRoutes[index - 1];
        const leg =
          prev && index > 0 ? estimateTravelLeg(prev.location, r.location) : null;
        return (
          <View key={r.itemId}>
            {leg && (
              <TravelLegRow
                leg={leg}
                directionsLabel={copy.directions}
                copy={{
                  legWalk: copy.legWalk,
                  legDrive: copy.legDrive,
                  legTransit: copy.legTransit,
                }}
              />
            )}
            <RouteItemCard
              route={r}
              displayIndex={index + 1}
              onPress={() => onSelectRoute(r)}
              onToggleVisited={() => onToggleVisited(r.itemId)}
              visitedLabel={copy.markVisited}
            />
          </View>
        );
      })}

      <Text className="mb-6 mt-2 text-xs text-brand-muted">{copy.closedHint}</Text>
    </View>
  );
}
