import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { calcTripDday } from '../../../constants/home/mainHome';
import { ICON_COLOR_WHITE } from '../../../constants/icons';
import { dayCountBetween } from '../../../constants/plan/planWizard';
import type { TravelStatusDto } from '../../../types/travelApi';
import type { TravelPlan } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';
import { formatWeekdayDate } from '../../../utils/geo/geo';
import type { UpcomingStop } from '../../../utils/plan/planSchedule';
import { cn } from '../../../utils/common/cn';
import { GUIDE_TARGET } from '../../guide/guideTypes';
import { GuideTarget } from '../../guide/GuideTarget';
import { AppIcon } from '../../shared/icons/AppIcon';

const heroImage = require('../../../../assets/images/home-hero.jpg');

type ActivePlanHeroBannerProps = {
  plan: TravelPlan;
  travelStatus: TravelStatusDto;
  upcoming: UpcomingStop | null;
  language: AppLanguage;
  copy: {
    plannedLabel: string;
    inProgressLabel: string;
    completedLabel: string;
    nextStop: string;
    viewItinerary: string;
    viewCompletedItinerary: string;
    completedTripHint: string;
    dday: (n: number) => string;
    ddayToday: string;
    dayLabel: (n: number) => string;
    switchPlanCount: (n: number) => string;
    switchPlanA11y: string;
  };
  canSwitchPlans?: boolean;
  planCount?: number;
  onPress: () => void;
  onSwitchPress?: () => void;
};

const STATUS_BADGE_CLASS: Record<TravelStatusDto, string> = {
  PLANNED: 'bg-sky-500',
  IN_PROGRESS: 'bg-brand-primary',
  COMPLETED: 'bg-slate-500',
};

const STATUS_OVERLAY_CLASS: Record<TravelStatusDto, string> = {
  PLANNED: 'rgba(15, 23, 42, 0.42)',
  IN_PROGRESS: 'rgba(15, 23, 42, 0.45)',
  COMPLETED: 'rgba(15, 23, 42, 0.58)',
};

function statusLabel(travelStatus: TravelStatusDto, copy: ActivePlanHeroBannerProps['copy']): string {
  if (travelStatus === 'PLANNED') {
    return copy.plannedLabel;
  }
  if (travelStatus === 'COMPLETED') {
    return copy.completedLabel;
  }
  return copy.inProgressLabel;
}

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

function metaLine(
  plan: TravelPlan,
  travelStatus: TravelStatusDto,
  language: AppLanguage,
  copy: ActivePlanHeroBannerProps['copy'],
): string {
  const dayCount = dayCountBetween(plan.startDate, plan.endDate);
  const daySuffix = language === 'ko' ? '일' : ' days';
  const period = `${plan.startDate} → ${plan.endDate} · ${dayCount}${daySuffix}`;

  if (travelStatus === 'PLANNED') {
    return `${period} · ${ddayText(plan.startDate, copy)}`;
  }
  if (travelStatus === 'COMPLETED') {
    return `${period} · ${copy.completedTripHint}`;
  }
  return `${period} · ${ddayText(plan.startDate, copy)}`;
}

export function ActivePlanHeroBanner({
  plan,
  travelStatus,
  upcoming,
  language,
  copy,
  canSwitchPlans = false,
  planCount = 1,
  onPress,
  onSwitchPress,
}: ActivePlanHeroBannerProps) {
  const showNextStop = travelStatus === 'IN_PROGRESS' && upcoming != null;
  const ctaLabel =
    travelStatus === 'COMPLETED' ? copy.viewCompletedItinerary : copy.viewItinerary;

  return (
    <GuideTarget id={GUIDE_TARGET.plannerHeroCta} className="mb-5 mt-5">
      <View className="overflow-hidden rounded-2xl">
        <Pressable
          onPress={onPress}
          className="active:opacity-95"
          accessibilityRole="button">
          <ImageBackground source={heroImage} style={styles.image} resizeMode="cover">
            <View
              style={[styles.overlay, { backgroundColor: STATUS_OVERLAY_CLASS[travelStatus] }]}
              className="justify-end p-5">
              <View
                className={cn(
                  'mb-2 self-start rounded-full px-2.5 py-1',
                  STATUS_BADGE_CLASS[travelStatus],
                )}>
                <Text className="text-[11px] font-bold text-white">
                  {statusLabel(travelStatus, copy)}
                </Text>
              </View>
              <Text
                className={cn(
                  'mb-1 text-lg font-bold leading-snug text-white',
                  canSwitchPlans && 'pr-24',
                )}
                numberOfLines={2}>
                {plan.title}
              </Text>
              <Text className="mb-3 text-xs text-white/90">
                {metaLine(plan, travelStatus, language, copy)}
              </Text>
              {showNextStop ? (
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
              <Text
                className={cn(
                  'mt-3 text-sm font-bold',
                  travelStatus === 'COMPLETED' ? 'text-white/85' : 'text-brand-secondary',
                )}>
                {ctaLabel} →
              </Text>
            </View>
          </ImageBackground>
        </Pressable>
        {canSwitchPlans && onSwitchPress ? (
          <Pressable
            onPress={onSwitchPress}
            hitSlop={8}
            className="absolute right-4 top-4 flex-row items-center rounded-full bg-white/20 px-2.5 py-1 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={copy.switchPlanA11y}>
            <Text className="mr-0.5 text-[11px] font-bold text-white">
              {copy.switchPlanCount(planCount)}
            </Text>
            <AppIcon name="chevronDown" size={14} color={ICON_COLOR_WHITE} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
    </GuideTarget>
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
  },
});
