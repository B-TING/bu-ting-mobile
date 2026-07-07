import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text, View } from 'react-native';

import { useAppAlert } from '../../shared/modals';
import { DayChips } from '../schedule/DayChips';
import { ScheduleMapSplit } from '../schedule/ScheduleMapSplit';
import { ScheduleRouteDetailPanel } from '../schedule/ScheduleRouteDetailPanel';
import { TravelLegRow } from '../schedule/TravelLegRow';
import { ScheduleRouteSlot, type RebootPhase } from '../schedule/ScheduleRouteSlot';
import type { CopyFor } from '../../../i18n';
import { EVENT_ZONE_BY_ID } from '../../../constants/eventZone/eventZone';
import { getScheduleDayColor } from '../../../constants/plan/scheduleDayColors';
import { usePlanStore } from '../../../stores';
import type { AppLanguage } from '../../../types/user';
import type { PlaceReview } from '../../../types/travelReview';
import type { RouteItem, TravelLegMode, TravelPlan } from '../../../types/travelPlan';
import {
  estimateUserLocation,
  findNearestScheduleRoute,
} from '../../../utils/plan/scheduleRoute';
import { sortedRoutes } from '../../../utils/plan/planItinerary';
import { countScheduleZoneSegments } from '../../../utils/plan/scheduleZoneGroups';
import { resolveEventZoneForRoute } from '../../../utils/eventZone/zoneResolver';
import { estimateTravelLeg } from '../../../utils/geo/geo';
import { computeDayTotalMinutes, formatDurationMinutes } from '../../../utils/geo/tripDuration';
import { getReviewForRoute } from '../../../utils/review/travelReview';

type Copy = CopyFor<'planDetail'>;

type RebootState = {
  itemId: string;
  phase: 'choose';
} | null;

export type ScheduleModalState =
  | { kind: 'none' }
  | { kind: 'add'; legMode?: TravelLegMode }
  | { kind: 'pick'; itemId: string };

export type PlanScheduleTabHandle = {
  handleRebootFabPress: () => void;
  handleRouteOptimize: () => void;
  handleAddPlacePress: () => void;
};

type PlanScheduleTabProps = {
  planId: string;
  plan: TravelPlan;
  language: AppLanguage;
  copy: Copy;
  selectedDay: number;
  planReviews: PlaceReview[];
  onSelectDay: (day: number) => void;
  onToggleVisited: (itemId: string) => void;
  onWriteReview: (route: RouteItem) => void;
  onQuickRating: (route: RouteItem, rating: number) => void;
  onDeleteRoute: (route: RouteItem) => void;
  onSaveRouteMemo?: (route: RouteItem, memo: string | undefined) => void | Promise<void>;
  onReorderRoutes?: (dayNumber: number, orderedItemIds: string[]) => void | Promise<void>;
  onOptimizeDayRoute?: (dayNumber: number) => void | Promise<void>;
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
      planReviews,
      onSelectDay,
      onToggleVisited,
      onWriteReview,
      onQuickRating,
      onDeleteRoute,
      onSaveRouteMemo,
      onReorderRoutes,
      onOptimizeDayRoute,
      onRouteRemoved,
      onScheduleModalChange,
      onReorderActiveChange,
    },
    ref,
  ) {
    const { alert } = useAppAlert();
    const reorderRoutes = usePlanStore(s => s.reorderRoutesInPlan);
    const updateLegMode = usePlanStore(s => s.updateRouteLegMode);
    const optimizeDayRouteLocal = usePlanStore(s => s.optimizeDayRoute);

    const [reboot, setReboot] = useState<RebootState>(null);
    const [focusedRoute, setFocusedRoute] = useState<RouteItem | null>(null);
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

    const dayDurationLabel = useMemo(() => {
      if (dayRoutes.length === 0) {
        return null;
      }
      const minutes = computeDayTotalMinutes(dayRoutes);
      return copy.dayDuration(formatDurationMinutes(minutes, language));
    }, [dayRoutes, copy, language]);

    const zoneSegmentCount = useMemo(
      () => countScheduleZoneSegments(dayRoutes),
      [dayRoutes],
    );

    const legCopy = useMemo(
      () => ({
        legWalk: copy.legWalk,
        legDrive: copy.legDrive,
        legTransit: copy.legTransit,
      }),
      [copy.legDrive, copy.legTransit, copy.legWalk],
    );

    const slotCopy = useMemo(
      () => ({
        markVisited: copy.markVisited,
        editRoute: copy.editRoute,
        rebootActionSub: copy.rebootActionSub,
        rebootDelete: copy.rebootDelete,
        rebootReplace: copy.rebootReplace,
        rebootCancel: copy.rebootCancel,
        recordReview: copy.recordReview,
        quickRatingHint: copy.quickRatingHint,
        scheduleDetailLoading: copy.scheduleDetailLoading,
        placeRatingSummary: copy.placeRatingSummary,
        transportModeTitle: copy.transportModeTitle,
        legWalk: copy.legWalk,
        legDrive: copy.legDrive,
        legTransit: copy.legTransit,
      }),
      [copy],
    );

    useEffect(() => {
      setReboot(null);
      setSwapPickId(null);
      setFocusedRoute(null);
      onModalChangeRef.current({ kind: 'none' });
    }, [selectedDay]);

    useEffect(() => {
      const itemId = focusedRoute?.itemId;
      if (!itemId) {
        return;
      }
      const updated = dayRoutes.find(route => route.itemId === itemId);
      if (!updated) {
        setFocusedRoute(null);
        return;
      }
      setFocusedRoute(prev => (prev?.itemId === itemId ? updated : prev));
    }, [dayRoutes, focusedRoute?.itemId]);

    useEffect(() => {
      onReorderActiveRef.current?.(swapPickId != null);
    }, [swapPickId]);

    useEffect(() => {
      if (day) {
        setOrderedIds(sortedRoutes(day.routes).map(r => r.itemId));
      } else {
        setOrderedIds([]);
      }
    }, [selectedDay, routeIdSetKey, day]);

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
      onDeleteRoute(route);
      onRouteRemoved?.(route.itemId);
      if (focusedRoute?.itemId === route.itemId) {
        setFocusedRoute(null);
      }
      clearReboot();
    };

    const openRouteDetail = useCallback((route: RouteItem) => {
      setReboot(null);
      setSwapPickId(null);
      onModalChangeRef.current({ kind: 'none' });
      setFocusedRoute(route);
    }, []);

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
        if (onReorderRoutes) {
          onReorderRoutes(day.dayNumber, next);
        } else {
          reorderRoutes(planId, day.dayNumber, next);
        }
      },
      [day, orderedIds, planId, reorderRoutes, onReorderRoutes],
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

    const handleRouteOptimize = useCallback(() => {
      if (!day || dayRoutes.length < 2) {
        return;
      }
      clearReboot();
      onModalChangeRef.current({ kind: 'none' });
      if (onOptimizeDayRoute) {
        onOptimizeDayRoute(day.dayNumber);
      } else {
        optimizeDayRouteLocal(planId, day.dayNumber);
        alert({ title: copy.routeOptimize, message: copy.routeOptimized });
      }
    }, [day, dayRoutes.length, optimizeDayRouteLocal, onOptimizeDayRoute, planId, copy, alert]);

    const handleAddPlacePress = useCallback(() => {
      clearReboot();
      onScheduleModalChange({ kind: 'add' });
    }, [onScheduleModalChange]);

    useImperativeHandle(
      ref,
      () => ({
        handleRebootFabPress: () => {
          openNearestReboot();
        },
        handleRouteOptimize,
        handleAddPlacePress,
      }),
      [openNearestReboot, handleRouteOptimize, handleAddPlacePress],
    );

    const dayColor = getScheduleDayColor(day?.dayNumber ?? 1);

    const renderRouteSlot = (r: RouteItem, index: number) => {
      const indexSelected = swapPickId === r.itemId;
      const isFocused = focusedRoute?.itemId === r.itemId;
      const indexHint = indexSelected
        ? copy.reorderHandleHintSelected
        : copy.reorderHandleHint;
      const review = getReviewForRoute(planReviews, r.itemId);
      const zoneColor =
        EVENT_ZONE_BY_ID[resolveEventZoneForRoute(r)].baseColor;

      return (
        <ScheduleRouteSlot
          key={r.itemId}
          route={r}
          displayIndex={index + 1}
          dayColor={dayColor.main}
          dayColorLight={dayColor.light}
          zoneColor={zoneColor}
          phase={phaseFor(r.itemId)}
          copy={slotCopy}
          reviewRating={review?.rating ?? 0}
          isFocused={isFocused}
          onPress={() => openRouteDetail(r)}
          onEdit={() => {
            setSwapPickId(null);
            onModalChangeRef.current({ kind: 'none' });
            setReboot({ itemId: r.itemId, phase: 'choose' });
          }}
          indexSelected={indexSelected}
          indexHint={indexHint}
          onIndexPress={() => handleIndexPress(r.itemId)}
          onToggleVisited={() => {
            clearReboot();
            onModalChangeRef.current({ kind: 'none' });
            onToggleVisited(r.itemId);
          }}
          onWriteReview={() => onWriteReview(r)}
          onQuickRating={rating => onQuickRating(r, rating)}
          onLegModeChange={mode => updateLegMode(planId, r.itemId, mode)}
          onDelete={() => handleDelete(r)}
          onReplace={() => openPickModal(r.itemId)}
          onCancel={clearReboot}
        />
      );
    };

    const detailPanel = focusedRoute ? (
      <ScheduleRouteDetailPanel
        route={focusedRoute}
        language={language}
        copy={copy}
        placeReview={getReviewForRoute(planReviews, focusedRoute.itemId)}
        onToggleVisited={() => onToggleVisited(focusedRoute.itemId)}
        onWriteReview={() => onWriteReview(focusedRoute)}
        onSaveMemo={memo => onSaveRouteMemo?.(focusedRoute, memo)}
      />
    ) : null;

    return (
      <ScheduleMapSplit
        itinerary={plan.itinerary}
        selectedDayNumber={day?.dayNumber ?? 1}
        highlightItemId={focusedRoute?.itemId ?? null}
        mapTitle={copy.mapPlaceholder}
        mapSubtitle={copy.mapPlaceholderSub}
        dragLabel={copy.mapDragLabel}
        mapClosedHint={copy.mapClosedHint}
        detailCloseLabel={copy.close}
        onDetailClose={() => setFocusedRoute(null)}
        detailContent={detailPanel}>
          <DayChips
            days={plan.itinerary}
            selectedDayNumber={day?.dayNumber ?? 1}
            onSelect={onSelectDay}
            language={language}
          />

          <View className="mb-2 flex-row items-baseline justify-between">
            <View className="flex-row items-center gap-2">
              <View
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: dayColor.main }}
              />
              <Text className="text-lg font-bold text-brand-text">
                {day?.date} · Day {day?.dayNumber}
              </Text>
            </View>
            <View className="items-end gap-0.5">
              {dayRoutes.length > 0 ? (
                <Text className="text-xs font-semibold text-brand-primary">
                  {copy.dayZoneCount(zoneSegmentCount)}
                </Text>
              ) : null}
              {dayDurationLabel ? (
                <Text className="text-xs font-semibold text-brand-muted">
                  {dayDurationLabel}
                </Text>
              ) : null}
            </View>
          </View>

          {swapPickId != null && (
            <View className="mb-3 rounded-xl border border-brand-primary bg-brand-selected px-3 py-2">
              <Text className="text-xs text-brand-text">{copy.reorderActiveHint}</Text>
            </View>
          )}

          {dayRoutes.map((route, index) => {
            const prevRoute = index > 0 ? dayRoutes[index - 1] : null;
            const leg =
              prevRoute != null
                ? estimateTravelLeg(
                    prevRoute.location,
                    route.location,
                    route.legMode,
                  )
                : null;
            const zoneColor =
              EVENT_ZONE_BY_ID[resolveEventZoneForRoute(route)].baseColor;

            return (
              <View key={route.itemId}>
                {leg ? (
                  <TravelLegRow
                    leg={leg}
                    directionsLabel={copy.directions}
                    copy={legCopy}
                    lineColor={zoneColor}
                  />
                ) : null}
                {renderRouteSlot(route, index)}
              </View>
            );
          })}

          <Text className="mt-2 text-xs text-brand-muted">{copy.reorderLongPressHint}</Text>
          <Text className="mb-4 mt-1 text-xs text-brand-muted">{copy.closedHint}</Text>
      </ScheduleMapSplit>
    );
  },
);
