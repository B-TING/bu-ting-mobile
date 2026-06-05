import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, View } from 'react-native';

import { DayChips } from '../DayChips';
import { TravelLegRow } from '../TravelLegRow';
import { ScheduleRouteSlot, type RebootPhase } from './ScheduleRouteSlot';
import type { PLAN_DETAIL_COPY } from '../../../constants/planDetail';
import { usePlanStore } from '../../../stores';
import type { AppLanguage } from '../../../types/user';
import type { RouteItem, TravelPlan } from '../../../types/travelPlan';
import {
  estimateUserLocation,
  findNearestScheduleRoute,
} from '../../../utils/scheduleRoute';
import { sortedRoutes } from '../../../utils/planItinerary';
import { estimateTravelLeg } from '../../../utils/geo';

type Copy = (typeof PLAN_DETAIL_COPY)[AppLanguage];

type RebootState = {
  itemId: string;
  phase: 'choose';
} | null;

export type ScheduleModalState =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'pick'; itemId: string };

export type PlanScheduleTabHandle = {
  handleRebootFabPress: () => void;
};

type PlanScheduleTabProps = {
  planId: string;
  plan: TravelPlan;
  language: AppLanguage;
  copy: Copy;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSelectRoute: (route: RouteItem) => void;
  onToggleVisited: (itemId: string) => void;
  onRouteRemoved?: (itemId: string) => void;
  onScheduleModalChange: (modal: ScheduleModalState) => void;
  onReorderActiveChange?: (active: boolean) => void;
};

export const PlanScheduleTab = forwardRef<PlanScheduleTabHandle, PlanScheduleTabProps>(
  function PlanScheduleTab(
    {
      planId,
      plan,
      language,
      copy,
      selectedDay,
      onSelectDay,
      onSelectRoute,
      onToggleVisited,
      onRouteRemoved,
      onScheduleModalChange,
      onReorderActiveChange,
    },
    ref,
  ) {
    const removeRoute = usePlanStore(s => s.removeRouteFromPlan);
    const reorderRoutes = usePlanStore(s => s.reorderRoutesInPlan);

    const [reboot, setReboot] = useState<RebootState>(null);
    const [orderedIds, setOrderedIds] = useState<string[]>([]);
    const [swapPickId, setSwapPickId] = useState<string | null>(null);
    const onModalChangeRef = useRef(onScheduleModalChange);
    onModalChangeRef.current = onScheduleModalChange;
    const onReorderActiveRef = useRef(onReorderActiveChange);
    onReorderActiveRef.current = onReorderActiveChange;
    const dayRoutesRef = useRef<RouteItem[]>([]);

    const day =
      plan.itinerary.find(d => d.dayNumber === selectedDay) ?? plan.itinerary[0];

    const routeIdSetKey = useMemo(() => {
      if (!day) {
        return '';
      }
      return [...day.routes.map(r => r.itemId)].sort().join('|');
    }, [day]);

    const dayRoutes = useMemo(() => {
      if (!day) {
        return [];
      }
      const sorted = sortedRoutes(day.routes);
      if (orderedIds.length === 0) {
        return sorted;
      }
      const byId = Object.fromEntries(sorted.map(r => [r.itemId, r]));
      const ordered = orderedIds
        .map(id => byId[id])
        .filter((r): r is RouteItem => r != null);
      const missing = sorted.filter(r => !orderedIds.includes(r.itemId));
      return [...ordered, ...missing];
    }, [day, orderedIds]);

    dayRoutesRef.current = dayRoutes;

    const hasStay = plan.itinerary.some(d =>
      d.routes.some(r => r.type === 'ACCOMMODATION'),
    );

    const slotCopy = useMemo(
      () => ({
        markVisited: copy.markVisited,
        editRoute: copy.editRoute,
        rebootActionSub: copy.rebootActionSub,
        rebootDelete: copy.rebootDelete,
        rebootReplace: copy.rebootReplace,
        rebootCancel: copy.rebootCancel,
      }),
      [copy],
    );

    useEffect(() => {
      setReboot(null);
      setSwapPickId(null);
      onModalChangeRef.current({ kind: 'none' });
    }, [selectedDay]);

    useEffect(() => {
      onReorderActiveRef.current?.(swapPickId != null);
    }, [swapPickId]);

    useEffect(() => {
      if (day) {
        setOrderedIds(sortedRoutes(day.routes).map(r => r.itemId));
      } else {
        setOrderedIds([]);
      }
    }, [selectedDay, routeIdSetKey]);

    const clearReboot = () => {
      setReboot(null);
    };

    const openPickModal = (itemId: string) => {
      onScheduleModalChange({ kind: 'pick', itemId });
    };

    const phaseFor = (itemId: string): RebootPhase => {
      if (reboot?.itemId !== itemId) {
        return 'idle';
      }
      return reboot.phase;
    };

    const handleDelete = (route: RouteItem) => {
      removeRoute(planId, route.itemId);
      onRouteRemoved?.(route.itemId);
      clearReboot();
    };

    const swapRoutes = useCallback(
      (idA: string, idB: string) => {
        if (!day) {
          return;
        }
        const base =
          orderedIds.length > 0
            ? orderedIds
            : dayRoutesRef.current.map(r => r.itemId);
        const indexA = base.indexOf(idA);
        const indexB = base.indexOf(idB);
        if (indexA < 0 || indexB < 0) {
          return;
        }
        const next = [...base];
        next[indexA] = idB;
        next[indexB] = idA;
        setOrderedIds(next);
        reorderRoutes(planId, day.dayNumber, next);
      },
      [day, orderedIds, planId, reorderRoutes],
    );

    const handleIndexPress = useCallback(
      (itemId: string) => {
        if (reboot?.itemId === itemId && reboot.phase === 'choose') {
          return;
        }
        setReboot(null);
        onModalChangeRef.current({ kind: 'none' });

        if (swapPickId === itemId) {
          setSwapPickId(null);
          return;
        }
        if (swapPickId == null) {
          setSwapPickId(itemId);
          return;
        }
        swapRoutes(swapPickId, itemId);
        setSwapPickId(null);
      },
      [swapPickId, swapRoutes, reboot],
    );

    const openNearestReboot = useCallback(() => {
      if (dayRoutes.length === 0) {
        return;
      }
      const userLoc = estimateUserLocation(dayRoutes);
      const nearest = findNearestScheduleRoute(dayRoutes, userLoc);
      if (nearest) {
        setReboot(null);
        onScheduleModalChange({ kind: 'pick', itemId: nearest.itemId });
      }
    }, [dayRoutes, onScheduleModalChange]);

    useImperativeHandle(
      ref,
      () => ({
        handleRebootFabPress: () => {
          openNearestReboot();
        },
      }),
      [openNearestReboot],
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
          <Pressable
            onPress={() => {
              clearReboot();
              onScheduleModalChange({ kind: 'add' });
            }}
            className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 active:opacity-80">
            <Text className="text-xs font-semibold text-brand-muted">{copy.addPlace}</Text>
          </Pressable>
        </View>

        <Text className="mb-2 mt-2 text-lg font-bold text-brand-text">
          {day?.date} · Day {day?.dayNumber}
        </Text>

        {swapPickId != null && (
          <View className="mb-3 rounded-xl border border-brand-primary bg-brand-selected px-3 py-2">
            <Text className="text-xs text-brand-text">{copy.reorderActiveHint}</Text>
          </View>
        )}

        {dayRoutes.map((r, index) => {
          const prev = dayRoutes[index - 1];
          const leg =
            prev && index > 0 ? estimateTravelLeg(prev.location, r.location) : null;
          const indexSelected = swapPickId === r.itemId;
          const indexHint = indexSelected
            ? copy.reorderHandleHintSelected
            : copy.reorderHandleHint;
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
              <ScheduleRouteSlot
                route={r}
                displayIndex={index + 1}
                phase={phaseFor(r.itemId)}
                copy={slotCopy}
                onPress={() => onSelectRoute(r)}
                onEdit={() => {
                  setSwapPickId(null);
                  onModalChangeRef.current({ kind: 'none' });
                  setReboot({ itemId: r.itemId, phase: 'choose' });
                }}
                indexSelected={indexSelected}
                indexHint={indexHint}
                onIndexPress={() => handleIndexPress(r.itemId)}
                onToggleVisited={() => onToggleVisited(r.itemId)}
                onDelete={() => handleDelete(r)}
                onReplace={() => openPickModal(r.itemId)}
                onCancel={clearReboot}
              />
            </View>
          );
        })}

        <Text className="mt-2 text-xs text-brand-muted">{copy.reorderLongPressHint}</Text>
        <Text className="mb-20 mt-1 text-xs text-brand-muted">{copy.closedHint}</Text>
      </View>
    );
  },
);
