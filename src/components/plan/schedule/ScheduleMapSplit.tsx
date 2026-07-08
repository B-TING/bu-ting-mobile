import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
} from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';
import { routeFabScrollPadding } from '../fab/RouteOptimizeFab';
import { ScheduleMapView } from '../../../kakaoMap';
import { APP_MODAL } from '../../shared/modals/appModalStyles';
import type { DailyItinerary } from '../../../types/travelPlan';

const DEFAULT_SCHEDULE_RATIO = 0.38;
const DETAIL_SCHEDULE_RATIO = 0.58;
const MAX_SCHEDULE_RATIO = 1.0;
const MIN_MAP_HEIGHT = 0;
const SNAP_CLOSE_THRESHOLD = 72;
const HANDLE_HEIGHT = 32;

type ScheduleMapSplitProps = {
  itinerary: DailyItinerary[];
  selectedDayNumber: number;
  highlightItemId?: string | null;
  mapTitle: string;
  mapSubtitle: string;
  dragLabel: string;
  mapClosedHint: string;
  detailContent?: ReactNode;
  detailCloseLabel?: string;
  onDetailClose?: () => void;
  children: ReactNode;
};

function snapScheduleHeight(height: number, containerHeight: number): number {
  const closed = 0;
  const maxHeight = Math.min(
    Math.round(containerHeight * MAX_SCHEDULE_RATIO),
    containerHeight - HANDLE_HEIGHT - MIN_MAP_HEIGHT,
  );
  const defaultHeight = Math.min(
    Math.round(containerHeight * DEFAULT_SCHEDULE_RATIO),
    maxHeight,
  );

  if (height < SNAP_CLOSE_THRESHOLD) {
    return closed;
  }

  const candidates = [defaultHeight, maxHeight];
  let nearest = defaultHeight;
  let minDist = Math.abs(height - defaultHeight);
  for (const candidate of candidates) {
    const dist = Math.abs(height - candidate);
    if (dist < minDist) {
      minDist = dist;
      nearest = candidate;
    }
  }
  return nearest;
}

export function ScheduleMapSplit({
  itinerary,
  selectedDayNumber,
  highlightItemId,
  mapTitle,
  mapSubtitle,
  dragLabel,
  mapClosedHint,
  detailContent,
  detailCloseLabel,
  onDetailClose,
  children,
}: ScheduleMapSplitProps) {
  const insets = useSafeAreaInsets();
  const [scheduleHeight, setScheduleHeight] = useState(0);
  const scheduleHeightRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const containerHeightRef = useRef(0);
  const detailActive = detailContent != null;

  const applyScheduleHeight = useCallback((height: number) => {
    const max = Math.min(
      Math.round(containerHeightRef.current * MAX_SCHEDULE_RATIO),
      containerHeightRef.current - HANDLE_HEIGHT - MIN_MAP_HEIGHT,
    );
    const clamped = Math.max(0, Math.min(height, max));
    scheduleHeightRef.current = clamped;
    setScheduleHeight(clamped);
  }, []);

  const expandForDetail = useCallback(() => {
    if (containerHeightRef.current <= 0) {
      return;
    }
    const target = Math.min(
      Math.round(containerHeightRef.current * DETAIL_SCHEDULE_RATIO),
      Math.round(containerHeightRef.current * MAX_SCHEDULE_RATIO) -
        HANDLE_HEIGHT -
        MIN_MAP_HEIGHT,
    );
    applyScheduleHeight(target);
  }, [applyScheduleHeight]);

  const handleContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight <= 0 || nextHeight === containerHeightRef.current) {
        return;
      }
      containerHeightRef.current = nextHeight;
      if (scheduleHeightRef.current === 0) {
        applyScheduleHeight(Math.round(nextHeight * DEFAULT_SCHEDULE_RATIO));
      }
    },
    [applyScheduleHeight],
  );

  useEffect(() => {
    if (detailActive) {
      expandForDetail();
    }
  }, [detailActive, expandForDetail]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          dragStartHeightRef.current = scheduleHeightRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          applyScheduleHeight(dragStartHeightRef.current - gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          const projected = dragStartHeightRef.current - gesture.dy;
          applyScheduleHeight(snapScheduleHeight(projected, containerHeightRef.current));
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [applyScheduleHeight],
  );

  const scheduleOpen = scheduleHeight > SNAP_CLOSE_THRESHOLD;

  return (
    <View className="flex-1" onLayout={handleContainerLayout}>
      <View className="min-h-0 flex-1 overflow-hidden bg-[#E8F4E8]">
        <ScheduleMapView
          itinerary={itinerary}
          selectedDayNumber={selectedDayNumber}
          highlightItemId={highlightItemId}
          mapTitle={mapTitle}
          mapSubtitle={mapSubtitle}
        />
      </View>

      <View
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={dragLabel}
        accessibilityHint={mapClosedHint}
        className="items-center justify-center border-y border-brand-border bg-brand-surface py-2"
        style={{ minHeight: HANDLE_HEIGHT }}>
        <View className="rounded-full bg-brand-border" style={{ width: 44, height: 5 }} />
        {!scheduleOpen ? (
          <Text className="mt-1.5 text-[10px] font-medium text-brand-muted">{mapClosedHint}</Text>
        ) : null}
      </View>

      {scheduleOpen ? (
        <View style={{ height: scheduleHeight }} className="relative min-h-0 bg-brand-background">
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: routeFabScrollPadding(insets.bottom) }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            pointerEvents={detailActive ? 'none' : 'auto'}
            style={detailActive ? styles.hiddenList : undefined}>
            {children}
          </ScrollView>

          {detailActive ? (
            <View className="absolute inset-0 bg-brand-background">
              <View className="flex-row items-center bg-brand-background justify-end px-5 py-2 border-b border-brand-border">
                {onDetailClose && detailCloseLabel ? (
                  <Pressable
                    onPress={onDetailClose}
                    accessibilityRole="button"
                    accessibilityLabel={detailCloseLabel}
                    className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 active:opacity-80">
                    <AppIcon name="x" size={14} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
                  </Pressable>
                ) : null}
              </View>
              <View className="py-2">
              </View>
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: routeFabScrollPadding(insets.bottom) }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled>
                {detailContent}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenList: {
    opacity: 0,
  },
  detailSheet: {
    borderTopLeftRadius: APP_MODAL.sheetRadius,
    borderTopRightRadius: APP_MODAL.sheetRadius,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  detailHandle: {
    alignSelf: 'center',
    width: APP_MODAL.handleWidth,
    height: APP_MODAL.handleHeight,
    borderRadius: APP_MODAL.handleHeight / 2,
    backgroundColor: APP_MODAL.handleColor,
    marginTop: 10,
    marginBottom: 4,
  },
});
