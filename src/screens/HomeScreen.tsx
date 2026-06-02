import { Pressable, ScrollView, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PrimaryButton } from '../components/setup/PrimaryButton';
import { PLAN_WIZARD_COPY, dayCountBetween } from '../constants/planWizard';
import { layout } from '../constants/layout';
import type { RootStackParamList } from '../navigation/types';
import { selectActivePlan, useAppStore, usePlanStore } from '../stores';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const language = useAppStore(state => state.language) ?? 'ko';
  const onboarding = useAppStore(state => state.onboarding);
  const resetSetup = useAppStore(state => state.resetSetup);
  const activePlan = usePlanStore(selectActivePlan);
  const copy = PLAN_WIZARD_COPY[language];

  const dayCount = activePlan
    ? dayCountBetween(activePlan.startDate, activePlan.endDate)
    : 0;
  const totalSpots = activePlan
    ? activePlan.itinerary.reduce((n, d) => n + d.routes.length, 0)
    : 0;

  return (
    <View
      className="flex-1 bg-brand-background"
      style={[layout.screen, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-3xl font-bold text-brand-primary">부팅</Text>
        <Text className="mb-8 text-base text-brand-muted">
          {language === 'ko' ? '나만의 부산 여행 가이드' : 'Your Busan travel guide'}
        </Text>

        <Text className="mb-3 text-lg font-bold text-brand-text">{copy.activePlan}</Text>

        {activePlan ? (
          <View className="mb-6 rounded-2xl border-2 border-brand-primary bg-brand-selected p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="flex-1 text-xl font-bold text-brand-primary">
                {activePlan.title}
              </Text>
              <Text className="rounded-lg bg-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
                {activePlan.status === 'CONFIRMED'
                  ? language === 'ko'
                    ? '확정'
                    : 'Confirmed'
                  : copy.statusDraft}
              </Text>
            </View>
            <Text className="mb-3 text-sm text-brand-muted">
              {activePlan.startDate} → {activePlan.endDate} · {copy.days(dayCount)} ·{' '}
              {totalSpots}
              {language === 'ko' ? '곳' : ' places'}
            </Text>
            {activePlan.itinerary.map(day => (
              <View key={day.dailyId} className="mb-3">
                <Text className="mb-1 text-sm font-semibold text-brand-text">
                  Day {day.dayNumber}
                </Text>
                {day.routes.slice(0, 4).map(r => (
                  <Text key={r.itemId} className="text-sm text-brand-muted">
                    {r.sequence + 1}. {r.placeName}
                  </Text>
                ))}
                {day.routes.length > 4 && (
                  <Text className="text-xs text-brand-muted">
                    +{day.routes.length - 4} …
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="mb-6 rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface p-6">
            <Text className="mb-2 text-center text-base font-semibold text-brand-text">
              {copy.noPlan}
            </Text>
            <Text className="text-center text-sm text-brand-muted">{copy.noPlanSub}</Text>
          </View>
        )}

        <PrimaryButton
          label={copy.createPlan}
          onPress={() => navigation.navigate('PlanWizard')}
        />
      </ScrollView>

      {__DEV__ && (
        <Pressable
          className="self-center p-3 active:opacity-80"
          style={{ marginBottom: insets.bottom + 8 }}
          onPress={() => {
            resetSetup();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'LanguageSelection' }],
              }),
            );
          }}>
          <Text className="text-[13px] text-brand-primary underline">
            {onboarding?.language === 'ko'
              ? '[DEV] 초기 설정 초기화'
              : '[DEV] Reset setup'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
