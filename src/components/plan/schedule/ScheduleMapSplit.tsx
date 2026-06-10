import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { NaverMapPlaceholder } from '../map/NaverMapPlaceholder';
import type { RouteItem } from '../../../types/travelPlan';

const DEFAULT_MAP_RATIO = 0.32;
const MAX_MAP_RATIO = 0.58;
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

function snapMapHeight(height: number, containerHeight: number): number {
  const closed = 0;
  const defaultHeight = Math.round(containerHeight * DEFAULT_MAP_RATIO);
  const maxHeight = Math.round(containerHeight * MAX_MAP_RATIO);

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
  const [mapHeight, setMapHeight] = useState(0);
  const mapHeightRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const containerHeightRef = useRef(0);

  const applyMapHeight = useCallback((height: number) => {
    const max = Math.round(containerHeightRef.current * MAX_MAP_RATIO);
    const clamped = Math.max(0, Math.min(height, max));
    mapHeightRef.current = clamped;
    setMapHeight(clamped);
  }, []);

  const handleContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight <= 0 || nextHeight === containerHeightRef.current) {
        return;
      }
      containerHeightRef.current = nextHeight;
      if (mapHeightRef.current === 0) {
        applyMapHeight(Math.round(nextHeight * DEFAULT_MAP_RATIO));
      }
    },
    [applyMapHeight],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          dragStartHeightRef.current = mapHeightRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          applyMapHeight(dragStartHeightRef.current + gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          const projected = dragStartHeightRef.current + gesture.dy;
          applyMapHeight(snapMapHeight(projected, containerHeightRef.current));
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [applyMapHeight],
  );

  const mapOpen = mapHeight > SNAP_CLOSE_THRESHOLD;

  return (
    <View className="flex-1" onLayout={handleContainerLayout}>
      <ScrollView
        className="min-h-0 flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        {children}
      </ScrollView>

      <View
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={dragLabel}
        accessibilityHint={mapClosedHint}
        className="items-center justify-center border-y border-brand-border bg-brand-surface py-2"
        style={{ minHeight: HANDLE_HEIGHT }}>
        <View className="rounded-full bg-brand-border" style={{ width: 44, height: 5 }} />
        {!mapOpen ? (
          <Text className="mt-1.5 text-[10px] font-medium text-brand-muted">{mapClosedHint}</Text>
        ) : null}
      </View>

      {mapOpen ? (
        <View
          style={{ height: mapHeight }}
          className="overflow-hidden bg-[#E8F4E8]">
          <NaverMapPlaceholder
            title={mapTitle}
            subtitle={mapSubtitle}
            routes={routes}
            size="fill"
          />
        </View>
      ) : null}
    </View>
  );
}
