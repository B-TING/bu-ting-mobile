import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { calcTripDday } from '../../../constants/mainHome';
import { dayCountBetween } from '../../../constants/planWizard';
import { formatWeekdayDate } from '../../../utils/geo';
import type { UpcomingStop } from '../../../utils/planSchedule';
import type { TravelPlan } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';

const heroImage = require('../../../../assets/images/home-hero.jpg');

type ActivePlanHeroBannerProps = {
  plan: TravelPlan;
  upcoming: UpcomingStop | null;
  language: AppLanguage;
  copy: {
    ongoingLabel: string;
    nextStop: string;
    viewItinerary: string;
    dday: (n: number) => string;
    ddayToday: string;
    dayLabel: (n: number) => string;
  };
  onPress: () => void;
};

function ddayText(startDate: string, copy: ActivePlanHeroBannerProps['copy']): string {
  const d = calcTripDday(startDate);
  if (d > 0) {
    return copy.dday(d);
  }
  if (d === 0) {
    return copy.ddayToday;
  }
  return `D+${Math.abs(d)}`;
}

export function ActivePlanHeroBanner({
  plan,
  upcoming,
  language,
  copy,
  onPress,
}: ActivePlanHeroBannerProps) {
  const dayCount = dayCountBetween(plan.startDate, plan.endDate);

  return (
    <Pressable
      onPress={onPress}
      className="mb-5 overflow-hidden rounded-2xl active:opacity-95 mt-5"
      accessibilityRole="button">
      <ImageBackground source={heroImage} style={styles.image} resizeMode="cover">
        <View style={styles.overlay} className="justify-end p-5">
          <View className="mb-2 self-start rounded-full bg-brand-primary px-2.5 py-1">
            <Text className="text-[11px] font-bold text-white">{copy.ongoingLabel}</Text>
          </View>
          <Text className="mb-1 text-lg font-bold leading-snug text-white" numberOfLines={2}>
            {plan.title}
          </Text>
          <Text className="mb-3 text-xs text-white/90">
            {plan.startDate} → {plan.endDate} · {dayCount}
            {language === 'ko' ? '일' : ' days'} · {ddayText(plan.startDate, copy)}
          </Text>
          {upcoming ? (
            <View className="rounded-xl bg-white/15 px-3 py-2.5">
              <Text className="mb-0.5 text-[11px] font-semibold text-white/80">
                {copy.nextStop}
              </Text>
              <Text className="text-sm font-bold text-white" numberOfLines={1}>
                {copy.dayLabel(upcoming.day.dayNumber)} ·{' '}
                {formatWeekdayDate(upcoming.day.date, language)} — {upcoming.route.placeName}
              </Text>
            </View>
          ) : null}
          <Text className="mt-3 text-sm font-bold text-brand-secondary">
            {copy.viewItinerary} →
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    minHeight: 200,
  },
  overlay: {
    flex: 1,
    minHeight: 200,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
});
