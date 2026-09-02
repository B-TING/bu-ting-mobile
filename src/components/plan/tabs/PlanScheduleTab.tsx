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

import { useAppAlert, useFeatureUnavailableAlert } from '../../shared/modals';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../../constants/common/alphaFeatureBlocks';
import { ScheduleDayChipPanel } from '../schedule/ScheduleDayChipPanel';
import { ScheduleDayHeaderRow } from '../schedule/ScheduleDayHeaderRow';
import { ScheduleMapZoneBadge } from '../schedule/ScheduleMapZoneBadge';
import { ScheduleQuickActions } from '../schedule/ScheduleQuickActions';
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
import { computeDayTotalMinutes, formatDurationMinutes } from '../../../utils/geo/tripDuration';
import {
  isLegDirectionsInputValid,
  openGoogleLegDirections,
  openKakaoLegDirections,
  type LegDirectionsInput,
} from '../../../utils/map/mapDirections';
import { getReviewForPlace } from '../../../utils/review/travelReview';

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
  readOnly?: boolean;
  onReadOnlyPress?: () => void;
  canAddDay?: boolean;
  canRemoveDay?: boolean;
  onAddDay?: () => void;
  onRemoveDay?: () => void;
  actionBarBottomInset?: number;
  /** 일정 탭이 화면에 보일 때만 지도·시트 렌더 (탭 전환 bleed 방지) */
  isActive?: boolean;
  onNotify?: (message: string) => void;
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
      readOnly = false,
      onReadOnlyPress,
      canAddDay = false,
      canRemoveDay = false,
      onAddDay,
      onRemoveDay,
      actionBarBottomInset = 0,
      isActive = true,
      onNotify,
    },
    ref,
  ) {
    const { alert } = useAppAlert();
    const { showUnavailable } = useFeatureUnavailableAlert();
    const reorderRoutes = usePlanStore(s => s.reorderRoutesInPlan);
    const updateLegMode = usePlanStore(s => s.updateRouteLegMode);
    const optimizeDayRouteLocal = usePlanStore(s => s.optimizeDayRoute);

    const [reboot, setReboot] = useState<RebootState>(null);
    const [focusedRoute, setFocusedRoute] = useState<RouteItem | null>(null);
    const [mapSelectedItemId, setMapSelectedItemId] = useState<string | null>(null);
    const [scheduleFullExpanded, setScheduleFullExpanded] = useState(false);
    const [orderedIds, setOrderedIds] = useState<string[]>([]);
    const [swapPickId, setSwapPickId] = useState<string | null>(null);
    const onModalChangeRef = useRef(onScheduleModalChange);
    onModalChangeRef.current = onScheduleModalChange;
    const onReorderActiveRef = useRef(onReorderActiveChange);
    onReorderActiveRef.current = onReorderActiveChange;
    const onReadOnlyPressRef = useRef(onReadOnlyPress);
    onReadOnlyPressRef.current = onReadOnlyPress;
    const dayRoutesRef = useRef<RouteItem[]>([]);

    const guardReadOnly = useCallback(() => {
      if (!readOnly) {
        return false;
      }
      onReadOnlyPressRef.current?.();
      return true;
    }, [readOnly]);

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

    const buildLegDirectionsInput = useCallback(
      (from: RouteItem, to: RouteItem): LegDirectionsInput => ({
        from: {
          lat: from.location.lat,
          lng: from.location.lng,
          name: from.placeName,
          address: from.placeInfo?.address,
        },
        to: {
          lat: to.location.lat,
          lng: to.location.lng,
          name: to.placeName,
          address: to.placeInfo?.address,
        },
        mode: to.legMode ?? 'walk',
      }),
      [],
    );

    const openLegDirectionsWithProvider = useCallback(
      (
        provider: 'google' | 'kakao',
        from: RouteItem,
        to: RouteItem,
      ) => {
        const input = buildLegDirectionsInput(from, to);

        if (!isLegDirectionsInputValid(input)) {
          onNotify?.(copy.directionsUnavailable);
          return;
        }

        const open =
          provider === 'google' ? openGoogleLegDirections : openKakaoLegDirections;

        void open(input).then(result => {
          if (result === 'invalid') {
            onNotify?.(copy.directionsUnavailable);
          } else if (result === 'failed') {
            onNotify?.(copy.directionsFailed);
          }
        });
      },
      [
        buildLegDirectionsInput,
        copy.directionsFailed,
        copy.directionsUnavailable,
        onNotify,
      ],
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
      setMapSelectedItemId(null);
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
      if (guardReadOnly()) {
        return;
      }
      onScheduleModalChange({ kind: 'pick', itemId });
    };

    const phaseFor = (itemId: string): RebootPhase => {
      if (reboot?.itemId !== itemId) {
        return 'idle';
      }
      return reboot.phase;
    };

    const handleDelete = (route: RouteItem) => {
      if (guardReadOnly()) {
        return;
      }
      onDeleteRoute(route);
      onRouteRemoved?.(route.itemId);
      if (focusedRoute?.itemId === route.itemId) {
        setFocusedRoute(null);
      }
      if (mapSelectedItemId === route.itemId) {
        setMapSelectedItemId(null);
      }
      clearReboot();
    };

    const openRouteDetail = useCallback((route: RouteItem) => {
      setReboot(null);
      setSwapPickId(null);
      onModalChangeRef.current({ kind: 'none' });
      setMapSelectedItemId(route.itemId);
      setFocusedRoute(route);
    }, []);

    const handleMapMarkerPress = useCallback(
      (itemId: string) => {
        const route = dayRoutes.find(r => r.itemId === itemId);
        if (!route) {
          return;
        }
        if (mapSelectedItemId === itemId && focusedRoute?.itemId === itemId) {
          setFocusedRoute(null);
          setMapSelectedItemId(null);
          return;
        }
        openRouteDetail(route);
      },
      [dayRoutes, mapSelectedItemId, focusedRoute?.itemId, openRouteDetail],
    );

    const mapHighlightItemId = mapSelectedItemId ?? focusedRoute?.itemId ?? null;

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
        if (guardReadOnly()) {
          return;
        }
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
      [swapPickId, swapRoutes, reboot, guardReadOnly],
    );

    const openNearestReboot = useCallback(() => {
      if (isAlphaFeatureBlocked('reboot')) {
        showUnavailable(ALPHA_FEATURE_LABELS.reboot);
        return;
      }
      if (guardReadOnly()) {
        return;
      }
      if (dayRoutes.length === 0) {
        return;
      }
      const userLoc = estimateUserLocation(dayRoutes);
      const nearest = findNearestScheduleRoute(dayRoutes, userLoc);
      if (nearest) {
        setReboot(null);
        onScheduleModalChange({ kind: 'pick', itemId: nearest.itemId });
      }
    }, [dayRoutes, onScheduleModalChange, guardReadOnly, showUnavailable]);

    const handleRouteOptimize = useCallback(() => {
      if (guardReadOnly()) {
        return;
      }
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
    }, [day, dayRoutes.length, optimizeDayRouteLocal, onOptimizeDayRoute, planId, copy, alert, guardReadOnly]);

    const handleAddPlacePress = useCallback(() => {
      if (guardReadOnly()) {
        return;
      }
      clearReboot();
      onScheduleModalChange({ kind: 'add' });
    }, [onScheduleModalChange, guardReadOnly]);

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

    const zoneLabel =
      dayRoutes.length > 0 ? copy.dayZoneCount(zoneSegmentCount) : null;

    const dayChipPanelProps = {
      days: plan.itinerary,
      selectedDayNumber: day?.dayNumber ?? 1,
      onSelect: onSelectDay,
      language,
      canAddDay: canAddDay && !readOnly,
      addDayLabel: copy.addDay,
      onAddDay,
    };

    const mapQuickActions =
      !readOnly && !focusedRoute ? (
        <ScheduleQuickActions
          compact
          onOptimize={handleRouteOptimize}
          onAddPlace={handleAddPlacePress}
          optimizeLabel={copy.routeOptimize}
          addPlaceLabel={copy.addPlace}
        />
      ) : null;

    const dayHeaderRow = (
      <ScheduleDayHeaderRow
        {...dayChipPanelProps}
        showQuickActions={!readOnly && !focusedRoute}
        onOptimize={handleRouteOptimize}
        onAddPlace={handleAddPlacePress}
        optimizeLabel={copy.routeOptimize}
        addPlaceLabel={copy.addPlace}
        canRemoveDay={canRemoveDay && !readOnly}
        removeDayLabel={copy.removeDay}
        onRemoveDay={
          canRemoveDay && !readOnly && onRemoveDay
            ? () => {
                if (guardReadOnly()) {
                  return;
                }
                onRemoveDay();
              }
            : undefined
        }
      />
    );

    const mapZoneBadge =
      zoneLabel || dayDurationLabel ? (
        <ScheduleMapZoneBadge zoneLabel={zoneLabel} durationLabel={dayDurationLabel} />
      ) : null;

    const renderRouteSlot = (r: RouteItem, index: number) => {
      const indexSelected = swapPickId === r.itemId;
      const isFocused =
        mapSelectedItemId === r.itemId || focusedRoute?.itemId === r.itemId;
      const indexHint = indexSelected
        ? copy.reorderHandleHintSelected
        : copy.reorderHandleHint;
      const review = getReviewForPlace(
        planReviews,
        r.apiPlanPlaceId ?? r.itemId,
      );
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
            if (isAlphaFeatureBlocked('reboot')) {
              showUnavailable(ALPHA_FEATURE_LABELS.reboot);
              return;
            }
            if (guardReadOnly()) {
              return;
            }
            setSwapPickId(null);
            onModalChangeRef.current({ kind: 'none' });
            setReboot({ itemId: r.itemId, phase: 'choose' });
          }}
          indexSelected={indexSelected}
          indexHint={indexHint}
          onIndexPress={() => handleIndexPress(r.itemId)}
          onToggleVisited={() => {
            if (guardReadOnly()) {
              return;
            }
            clearReboot();
            onModalChangeRef.current({ kind: 'none' });
            onToggleVisited(r.itemId);
          }}
          onWriteReview={() => {
            if (guardReadOnly()) {
              return;
            }
            onWriteReview(r);
          }}
          onQuickRating={rating => {
            if (guardReadOnly()) {
              return;
            }
            onQuickRating(r, rating);
          }}
          onLegModeChange={
            readOnly ? undefined : mode => updateLegMode(planId, r.itemId, mode)
          }
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
        layout="sheetHeader"
        placeReview={getReviewForPlace(
          planReviews,
          focusedRoute.apiPlanPlaceId ?? focusedRoute.itemId,
        )}
        onToggleVisited={() => {
          if (guardReadOnly()) {
            return;
          }
          onToggleVisited(focusedRoute.itemId);
        }}
        onWriteReview={() => {
          if (guardReadOnly()) {
            return;
          }
          onWriteReview(focusedRoute);
        }}
        onSaveMemo={readOnly ? undefined : memo => onSaveRouteMemo?.(focusedRoute, memo)}
      />
    ) : null;

    return (
      <View className="flex-1">
        <ScheduleMapSplit
          isActive={isActive}
          itinerary={plan.itinerary}
          selectedDayNumber={day?.dayNumber ?? 1}
          highlightItemId={mapHighlightItemId}
          onMarkerPress={handleMapMarkerPress}
          dragLabel={copy.mapDragLabel}
          mapClosedHint={copy.mapClosedHint}
          detailCloseLabel={copy.close}
          onDetailClose={() => setFocusedRoute(null)}
          onScheduleExpandChange={setScheduleFullExpanded}
          bottomInset={actionBarBottomInset}
          mapTopRight={mapZoneBadge}
          mapOverlayLeading={scheduleFullExpanded ? undefined : mapQuickActions}
          mapOverlay={
            scheduleFullExpanded ? undefined : (
              <ScheduleDayChipPanel {...dayChipPanelProps} variant="overlay" />
            )
          }
          sheetHeader={dayHeaderRow}
          detailContent={detailPanel}>
          {swapPickId != null && (
            <View className="mb-3 rounded-xl border border-brand-primary bg-brand-selected px-3 py-2">
              <Text className="text-xs text-brand-text">{copy.reorderActiveHint}</Text>
            </View>
          )}

          {dayRoutes.map((route, index) => {
            const prevRoute = index > 0 ? dayRoutes[index - 1] : null;
            const zoneColor =
              EVENT_ZONE_BY_ID[resolveEventZoneForRoute(route)].baseColor;
            const directionsInput: LegDirectionsInput | null =
              prevRoute != null
                ? {
                    from: {
                      lat: prevRoute.location.lat,
                      lng: prevRoute.location.lng,
                      name: prevRoute.placeName,
                      address: prevRoute.placeInfo?.address,
                    },
                    to: {
                      lat: route.location.lat,
                      lng: route.location.lng,
                      name: route.placeName,
                      address: route.placeInfo?.address,
                    },
                    mode: route.legMode ?? 'walk',
                  }
                : null;

            return (
              <View key={route.itemId}>
                {prevRoute != null ? (
                  <TravelLegRow
                    googleLabel={copy.directionsGoogleButton}
                    kakaoLabel={copy.directionsKakaoButton}
                    lineColor={zoneColor}
                    directionsDisabled={
                      directionsInput != null &&
                      !isLegDirectionsInputValid(directionsInput)
                    }
                    onGooglePress={() =>
                      openLegDirectionsWithProvider('google', prevRoute, route)
                    }
                    onKakaoPress={() =>
                      openLegDirectionsWithProvider('kakao', prevRoute, route)
                    }
                  />
                ) : null}
                {renderRouteSlot(route, index)}
              </View>
            );
          })}

          <Text className="mt-2 text-xs text-brand-muted">{copy.reorderLongPressHint}</Text>
          <Text className="mb-4 mt-1 text-xs text-brand-muted">{copy.closedHint}</Text>
        </ScheduleMapSplit>
      </View>
    );
  },
);
