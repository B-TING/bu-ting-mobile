import { useMemo, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DevOnboardingTrigger } from '../components/dev/DevOnboardingTrigger';
import { PrimaryButton } from '../components/setup/PrimaryButton';
import {
  calcTripDday,
  MAIN_HOME_COPY,
  MOCK_FESTIVALS,
  MOCK_PRODUCTS,
} from '../constants/mainHome';
import { dayCountBetween } from '../constants/planWizard';
import { layout } from '../constants/layout';
import type { RootStackParamList } from '../navigation/types';
import { selectActivePlan, useAppStore, usePlanStore } from '../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'MainHome'>;

function HomeCard({
  title,
  subtitle,
  emoji,
  children,
  onPress,
}: {
  title: string;
  subtitle?: string;
  emoji: string;
  children?: ReactNode;
  onPress?: () => void;
}) {
  const body = (
    <View className="mb-3 rounded-2xl border border-brand-border bg-brand-surface p-4">
      <View className="mb-2 flex-row items-center">
        <Text className="mr-2 text-2xl">{emoji}</Text>
        <View className="flex-1">
          <Text className="text-base font-bold text-brand-text">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-brand-muted">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {body}
      </Pressable>
    );
  }
  return body;
}

export function MainHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = MAIN_HOME_COPY[language];
  const activePlan = usePlanStore(selectActivePlan);

  const dday = useMemo(
    () => (activePlan ? calcTripDday(activePlan.startDate) : null),
    [activePlan],
  );

  const ddayLabel = useMemo(() => {
    if (dday === null) {
      return '—';
    }
    if (dday > 0) {
      return copy.dday(dday);
    }
    if (dday === 0) {
      return copy.ddayToday;
    }
    const end = activePlan ? calcTripDday(activePlan.endDate) : -1;
    if (end < 0) {
      return copy.ddayPast;
    }
    return copy.dday(dday);
  }, [dday, copy, activePlan]);

  return (
    <View
      className="flex-1 bg-brand-background"
      style={[layout.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        <DevOnboardingTrigger navigation={navigation}>
          <Text className="mb-1 text-3xl font-bold text-brand-primary">{copy.title}</Text>
        </DevOnboardingTrigger>
        <Text className="mb-6 text-base text-brand-muted">{copy.subtitle}</Text>

        <PrimaryButton
          label={copy.myPlan}
          onPress={() => navigation.navigate('PlanDetail')}
        />

        <View className="mt-6">
          <HomeCard title={copy.calendar} emoji="📅">
            <View className="items-center rounded-xl bg-brand-selected py-6">
              <Text className="text-4xl font-bold text-brand-primary">{ddayLabel}</Text>
              {activePlan ? (
                <Text className="mt-2 text-sm text-brand-muted">
                  {activePlan.startDate} → {activePlan.endDate}
                </Text>
              ) : (
                <Text className="mt-2 text-sm text-brand-muted">{copy.noPlanHint}</Text>
              )}
            </View>
          </HomeCard>

          <HomeCard title={copy.weather} subtitle={copy.weatherToday} emoji="🌤️">
            <Text className="text-sm text-brand-text">{copy.weatherToday}</Text>
            <Text className="mt-1 text-xs text-brand-muted">
              {language === 'ko' ? '기상청 API 연동 예정' : 'Weather API coming soon'}
            </Text>
          </HomeCard>

          <HomeCard
            title={copy.travelInfo}
            emoji="🧳"
            onPress={() => navigation.navigate('PlanDetail')}>
            {activePlan ? (
              <>
                <Text className="text-sm font-semibold text-brand-text">
                  {activePlan.title}
                </Text>
                <Text className="mt-1 text-xs text-brand-muted">
                  {dayCountBetween(activePlan.startDate, activePlan.endDate)}
                  {language === 'ko' ? '일 · ' : ' days · '}
                  {activePlan.members.length}
                  {language === 'ko' ? '명' : ' travelers'}
                </Text>
              </>
            ) : (
              <Text className="text-sm text-brand-muted">{copy.noPlanHint}</Text>
            )}
          </HomeCard>

          <HomeCard title={copy.travelJournal} subtitle={copy.journalSub} emoji="📔">
            <Text className="text-sm text-brand-muted">
              {language === 'ko'
                ? '일정 화면의 기록 탭에서 곧 작성할 수 있어요.'
                : 'Coming in the Records tab on your itinerary.'}
            </Text>
          </HomeCard>

          <HomeCard title={copy.tourismProducts} subtitle={copy.productsSub} emoji="🎫">
            {MOCK_PRODUCTS.map(p => (
              <View
                key={p.en}
                className="mb-2 flex-row justify-between border-b border-brand-border pb-2 last:mb-0">
                <Text className="text-sm text-brand-text">
                  {language === 'ko' ? p.ko : p.en}
                </Text>
                <Text className="text-sm font-semibold text-brand-primary">{p.price}</Text>
              </View>
            ))}
          </HomeCard>

          <HomeCard title={copy.festivals} subtitle={copy.festivalsSub} emoji="🎉">
            {MOCK_FESTIVALS.map(f => (
              <View key={f.en} className="mb-2 last:mb-0">
                <Text className="text-sm font-semibold text-brand-text">
                  {language === 'ko' ? f.ko : f.en}
                </Text>
                <Text className="text-xs text-brand-muted">{f.date}</Text>
              </View>
            ))}
          </HomeCard>
        </View>
      </ScrollView>
    </View>
  );
}
