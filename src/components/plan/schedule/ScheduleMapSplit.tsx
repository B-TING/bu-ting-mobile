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

import {
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
} from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ScheduleMapView } from '../../../kakaoMap';
import { APP_MODAL } from '../../shared/modals/appModalStyles';
import type { DailyItinerary } from '../../../types/travelPlan';

const DEFAULT_SCHEDULE_RATIO = 0.4;
const DETAIL_SCHEDULE_RATIO = 0.58;
const MAX_SCHEDULE_RATIO = 1.0;
const MIN_MAP_HEIGHT = 0;
const SNAP_CLOSE_THRESHOLD = 72;
const HANDLE_HEIGHT = 32;

type ScheduleMapSplitProps = {
  itinerary: DailyItinerary[];
  selectedDayNumber: number;
  highlightItemId?: string | null;
  dragLabel: string;
  mapClosedHint: string;
  detailContent?: ReactNode;
  detailCloseLabel?: string;
  onDetailClose?: () => void;
  children: ReactNode;
};

const LIST_BOTTOM_PADDING = 16;

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
  dragLabel,
  mapClosedHint,
  detailContent,
  detailCloseLabel,
  onDetailClose,
  children,
}: ScheduleMapSplitProps) {
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
          mapTitle=""
          mapSubtitle=""
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
        <View
          style={{ height: scheduleHeight }}
          className="relative min-h-0 bg-brand-background">
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: LIST_BOTTOM_PADDING }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            pointerEvents={detailActive ? 'none' : 'auto'}
            style={detailActive ? styles.hiddenList : undefined}>
            {children}
          </ScrollView>

          {detailActive ? (
            <View className="absolute inset-0 bg-brand-background">
              {onDetailClose && detailCloseLabel ? (
                <Pressable
                  onPress={onDetailClose}
                  accessibilityRole="button"
                  accessibilityLabel={detailCloseLabel}
                  style={styles.detailCloseBtn}
                  hitSlop={8}>
                  <AppIcon name="x" size={16} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
                </Pressable>
              ) : null}
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: LIST_BOTTOM_PADDING }}
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
  detailCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
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
