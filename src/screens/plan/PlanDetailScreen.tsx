import { useMemo, useState } from 'react';
import { CommonActions, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayChips } from '../../components/plan/DayChips';
import { HamburgerButton } from '../../components/plan/HamburgerButton';
import { MemberList } from '../../components/plan/MemberList';
import { PlaceDetailModal } from '../../components/plan/PlaceDetailModal';
import { PlanTabPager } from '../../components/plan/PlanTabPager';
import { RouteItemCard } from '../../components/plan/RouteItemCard';
import { TravelLegRow } from '../../components/plan/TravelLegRow';
import { PrimaryButton } from '../../components/setup/PrimaryButton';
import {
  PLAN_DETAIL_COPY,
  type PlanDetailTab,
} from '../../constants/planDetail';
import { PLAN_WIZARD_COPY, dayCountBetween } from '../../constants/planWizard';
import type { RootStackParamList } from '../../navigation/types';
import { hydrateRoutePlaceInfo, useAppStore, usePlanStore } from '../../stores';
import type { BudgetEntry, RouteItem } from '../../types/travelPlan';
import { estimateTravelLeg } from '../../utils/geo';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'>;

const EMPTY_BUDGET: BudgetEntry[] = [];

function sortedRoutes(routes: RouteItem[]): RouteItem[] {
  return [...routes].sort((a, b) => a.sequence - b.sequence);
}

export function PlanDetailScreen({ navigation, route }: Props) {
  const paramPlanId = route.params?.planId;
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const onboarding = useAppStore(s => s.onboarding);
  const resetSetup = useAppStore(s => s.resetSetup);
  const plans = usePlanStore(s => s.plans);
  const activePlanId = usePlanStore(s => s.activePlanId);
  const budgetByPlan = usePlanStore(s => s.budgetByPlan);
  const toggleVisited = usePlanStore(s => s.toggleRouteVisited);
  const addBudgetEntry = usePlanStore(s => s.addBudgetEntry);

  const plan = useMemo(() => {
    if (paramPlanId) {
      return plans.find(p => p.planId === paramPlanId) ?? null;
    }
    if (activePlanId) {
      return plans.find(p => p.planId === activePlanId) ?? null;
    }
    return (
      plans.find(p => p.status === 'DRAFT' || p.status === 'CONFIRMED') ?? null
    );
  }, [paramPlanId, plans, activePlanId]);

  const planId = plan?.planId ?? '';
  const budgetEntries = useMemo(
    () => (planId ? budgetByPlan[planId] : undefined) ?? EMPTY_BUDGET,
    [budgetByPlan, planId],
  );

  const copy = PLAN_DETAIL_COPY[language];
  const wizardCopy = PLAN_WIZARD_COPY[language];
  const [tab, setTab] = useState<PlanDetailTab>('schedule');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);

  const enrichedPlan = useMemo(() => {
    if (!plan) {
      return null;
    }
    return {
      ...plan,
      itinerary: plan.itinerary.map(day => ({
        ...day,
        routes: sortedRoutes(day.routes).map(r =>
          hydrateRoutePlaceInfo(r, language),
        ),
      })),
    };
  }, [plan, language]);

  if (!enrichedPlan) {
    return (
      <View
        className="flex-1 bg-brand-background px-6"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>
        <View className="mb-6 flex-row items-center">
          <HamburgerButton onPress={() => navigation.navigate('MainHome')} />
          <Text className="flex-1 text-2xl font-bold text-brand-primary">부팅</Text>
        </View>
        <Text className="mb-10 text-base text-brand-muted">
          {language === 'ko' ? '나만의 부산 여행 가이드' : 'Your Busan travel guide'}
        </Text>
        <View className="mb-8 flex-1 justify-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface p-8">
          <Text className="mb-2 text-center text-lg font-semibold text-brand-text">
            {wizardCopy.noPlan}
          </Text>
          <Text className="text-center text-sm text-brand-muted">
            {wizardCopy.noPlanSub}
          </Text>
        </View>
        <PrimaryButton
          label={wizardCopy.createPlan}
          onPress={() => navigation.navigate('PlanWizard')}
        />
        {__DEV__ && (
          <Pressable
            className="mt-6 self-center p-3 active:opacity-80"
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

  const day =
    enrichedPlan.itinerary.find(d => d.dayNumber === selectedDay) ??
    enrichedPlan.itinerary[0];
  const dayRoutes = day?.routes ?? [];
  const hasStay = enrichedPlan.itinerary.some(d =>
    d.routes.some(r => r.type === 'ACCOMMODATION'),
  );

  const roleLabels = {
    OWNER: copy.roleOwner,
    EDITOR: copy.roleEditor,
    VIEWER: copy.roleViewer,
  };

  const budgetTotal = budgetEntries.reduce((s, e) => s + e.amount, 0);

  const addSampleExpense = () => {
    addBudgetEntry({
      planId,
      label: language === 'ko' ? '점심 (자갈치)' : 'Lunch',
      amount: 28000,
      currency: 'KRW',
      date: day?.date ?? enrichedPlan.startDate,
      paidByUserId: enrichedPlan.members[0]?.userId ?? 'local-user',
    });
  };

  const renderSchedule = () => (
    <View className="px-4">
      <DayChips
        days={enrichedPlan.itinerary}
        selectedDayNumber={day?.dayNumber ?? 1}
        onSelect={setSelectedDay}
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
          <Text className="text-xs font-semibold text-brand-text">
            {copy.routeOptimize}
          </Text>
        </Pressable>
        <Pressable className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 active:opacity-80">
          <Text className="text-xs font-semibold text-brand-muted">
            {copy.addPlace}
          </Text>
        </Pressable>
      </View>

      <Text className="mb-2 mt-2 text-lg font-bold text-brand-text">
        {day?.date} · Day {day?.dayNumber}
      </Text>

      {dayRoutes.map((r, index) => {
        const prev = dayRoutes[index - 1];
        const leg =
          prev && index > 0
            ? estimateTravelLeg(prev.location, r.location)
            : null;
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
              onPress={() => setSelectedRoute(r)}
              onToggleVisited={() => toggleVisited(planId, r.itemId)}
              visitedLabel={copy.markVisited}
            />
          </View>
        );
      })}

      <Text className="mb-6 mt-2 text-xs text-brand-muted">{copy.closedHint}</Text>
    </View>
  );

  const renderOverview = () => (
    <View className="px-4 pb-8">
      <Text className="mb-1 text-sm text-brand-muted">
        {enrichedPlan.startDate} → {enrichedPlan.endDate} ·{' '}
        {dayCountBetween(enrichedPlan.startDate, enrichedPlan.endDate)}
        {language === 'ko' ? '일' : ' days'}
      </Text>
      <MemberList
        members={enrichedPlan.members}
        title={copy.membersTitle}
        roleLabels={roleLabels}
      />
    </View>
  );

  const renderBudget = () => (
    <View className="px-4 pb-8">
      <Text className="mb-1 text-lg font-bold text-brand-text">{copy.budgetTotal}</Text>
      <Text className="mb-4 text-2xl font-bold text-brand-primary">
        ₩{budgetTotal.toLocaleString()}
      </Text>
      {budgetEntries.length === 0 ? (
        <Text className="mb-4 text-sm text-brand-muted">{copy.budgetEmpty}</Text>
      ) : (
        budgetEntries.map(e => (
          <View
            key={e.entryId}
            className="mb-2 flex-row justify-between rounded-xl border border-brand-border bg-brand-surface px-4 py-3">
            <View>
              <Text className="font-semibold text-brand-text">{e.label}</Text>
              <Text className="text-xs text-brand-muted">{e.date}</Text>
            </View>
            <Text className="font-bold text-brand-text">
              ₩{e.amount.toLocaleString()}
            </Text>
          </View>
        ))
      )}
      <Pressable
        onPress={addSampleExpense}
        className="mt-2 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
        <Text className="font-bold text-white">{copy.budgetAdd}</Text>
      </Pressable>
    </View>
  );

  const renderPlaceholder = (message: string) => (
    <View className="px-6 py-12">
      <Text className="text-center text-sm text-brand-muted">{message}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <HamburgerButton onPress={() => navigation.navigate('MainHome')} />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {enrichedPlan.title}
        </Text>
      </View>

      <PlanTabPager
        active={tab}
        onChange={setTab}
        language={language}
        bottomInset={insets.bottom}
        pages={{
          overview: renderOverview(),
          schedule: renderSchedule(),
          explore: renderPlaceholder(copy.exploreSoon),
          budget: renderBudget(),
          records: renderPlaceholder(copy.recordsSoon),
        }}
      />

      <PlaceDetailModal
        visible={!!selectedRoute}
        route={selectedRoute}
        copy={copy}
        onClose={() => setSelectedRoute(null)}
        onToggleVisited={() => {
          if (selectedRoute) {
            toggleVisited(planId, selectedRoute.itemId);
            setSelectedRoute({
              ...selectedRoute,
              isVisited: !selectedRoute.isVisited,
            });
          }
        }}
      />
    </View>
  );
}
