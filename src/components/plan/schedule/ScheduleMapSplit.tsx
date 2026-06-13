import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { routeFabScrollPadding } from '../fab/RouteOptimizeFab';
import { NaverMapPlaceholder } from '../map/NaverMapPlaceholder';
import type { RouteItem } from '../../../types/travelPlan';

const DEFAULT_SCHEDULE_RATIO = 0.38;
const MAX_SCHEDULE_RATIO = 1.0;
const MIN_MAP_HEIGHT = 0;
const SNAP_CLOSE_THRESHOLD = 72;
const HANDLE_HEIGHT = 32;

type ScheduleMapSplitProps = {
  routes: RouteItem[];
  mapTitle: string;
  mapSubtitle: string;
  dragLabel: string;
  mapClosedHint: string;
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
  routes,
  mapTitle,
  mapSubtitle,
  dragLabel,
  mapClosedHint,
  children,
}: ScheduleMapSplitProps) {
  const insets = useSafeAreaInsets();
  const [scheduleHeight, setScheduleHeight] = useState(0);
  const scheduleHeightRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const containerHeightRef = useRef(0);

  const applyScheduleHeight = useCallback((height: number) => {
    const max = Math.min(
      Math.round(containerHeightRef.current * MAX_SCHEDULE_RATIO),
      containerHeightRef.current - HANDLE_HEIGHT - MIN_MAP_HEIGHT,
    );
    const clamped = Math.max(0, Math.min(height, max));
    scheduleHeightRef.current = clamped;
    setScheduleHeight(clamped);
  }, []);

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
        <NaverMapPlaceholder
          title={mapTitle}
          subtitle={mapSubtitle}
          routes={routes}
          size="fill"
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
        <View style={{ height: scheduleHeight }} className="min-h-0 bg-brand-background">
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: routeFabScrollPadding(insets.bottom) }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            {children}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
