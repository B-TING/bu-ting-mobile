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

import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ScheduleMapView } from '../../../kakaoMap';
import { APP_MODAL } from '../../shared/modals/appModalStyles';
import type { DailyItinerary } from '../../../types/travelPlan';

const DEFAULT_SCHEDULE_RATIO = 0.48;
const DETAIL_SCHEDULE_RATIO = 0.58;
const MAX_SCHEDULE_RATIO = 1.0;
const SNAP_CLOSE_THRESHOLD = 72;
const SHEET_HANDLE_AREA_HEIGHT = 28;
const COLLAPSED_PEEK_HEIGHT = 52;

type ScheduleMapSplitProps = {
  itinerary: DailyItinerary[];
  selectedDayNumber: number;
  highlightItemId?: string | null;
  onMarkerPress?: (itemId: string) => void;
  dragLabel: string;
  mapClosedHint: string;
  detailContent?: ReactNode;
  detailCloseLabel?: string;
  onDetailClose?: () => void;
  mapOverlay?: ReactNode;
  /** 지도 좌측 끝 오버레이 (경로 최적화·관광지 추가) */
  mapOverlayLeading?: ReactNode;
  /** 지도 우상단 (방문 영역 등) */
  mapTopRight?: ReactNode;
  /** 시트 최대 확장 시 스크롤 위 고정 헤더 (일자 chips) */
  sheetHeader?: ReactNode;
  onScheduleExpandChange?: (fullyExpanded: boolean) => void;
  /** 시트 하단에 붙는 액션 버튼 등 (일정 열림·상세 패널 없을 때) */
  sheetFooter?: ReactNode;
  /** Navbar clearance — 시트 bottom·최대 높이 계산 */
  bottomInset?: number;
  /** false면 시트·지도 레이어 숨김 (다른 탭 전환 시 elevation bleed 방지) */
  isActive?: boolean;
  children: ReactNode;
};

const LIST_BOTTOM_PADDING = 16;
const FULL_EXPAND_THRESHOLD_PX = 8;

function maxScheduleHeightFor(containerHeight: number, bottomInset = 0): number {
  if (containerHeight <= 0) {
    return 0;
  }
  const available = Math.max(0, containerHeight - bottomInset);
  return Math.min(Math.round(available * MAX_SCHEDULE_RATIO), available);
}

function snapScheduleHeight(height: number, containerHeight: number, bottomInset = 0): number {
  const closed = 0;
  const maxHeight = maxScheduleHeightFor(containerHeight, bottomInset);
  const defaultHeight = Math.min(
    Math.round((containerHeight - bottomInset) * DEFAULT_SCHEDULE_RATIO),
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
  onMarkerPress,
  dragLabel,
  mapClosedHint,
  detailContent,
  detailCloseLabel,
  onDetailClose,
  mapOverlay,
  mapOverlayLeading,
  mapTopRight,
  sheetHeader,
  onScheduleExpandChange,
  sheetFooter,
  bottomInset = 0,
  isActive = true,
  children,
}: ScheduleMapSplitProps) {
  const [scheduleHeight, setScheduleHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const scheduleHeightRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const containerHeightRef = useRef(0);
  const bottomInsetRef = useRef(bottomInset);
  bottomInsetRef.current = bottomInset;
  const detailActive = detailContent != null;

  const applyScheduleHeight = useCallback((height: number) => {
    const max = maxScheduleHeightFor(containerHeightRef.current, bottomInsetRef.current);
    const clamped = Math.max(0, Math.min(height, max));
    scheduleHeightRef.current = clamped;
    setScheduleHeight(clamped);
  }, []);

  const expandForDetail = useCallback(() => {
    if (containerHeightRef.current <= 0) {
      return;
    }
    const target = Math.min(
      Math.round((containerHeightRef.current - bottomInsetRef.current) * DETAIL_SCHEDULE_RATIO),
      maxScheduleHeightFor(containerHeightRef.current, bottomInsetRef.current),
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
      setContainerHeight(nextHeight);
      if (scheduleHeightRef.current === 0) {
        applyScheduleHeight(
          Math.round((nextHeight - bottomInsetRef.current) * DEFAULT_SCHEDULE_RATIO),
        );
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
          applyScheduleHeight(
            snapScheduleHeight(projected, containerHeightRef.current, bottomInsetRef.current),
          );
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [applyScheduleHeight],
  );

  const scheduleOpen = scheduleHeight > SNAP_CLOSE_THRESHOLD;
  const maxScheduleHeight = maxScheduleHeightFor(containerHeight, bottomInset);
  const isFullyExpanded =
    scheduleOpen &&
    maxScheduleHeight > 0 &&
    scheduleHeight >= maxScheduleHeight - FULL_EXPAND_THRESHOLD_PX;

  const sheetVisualHeight = scheduleOpen ? scheduleHeight : COLLAPSED_PEEK_HEIGHT;
  const mapObstructionBottom = sheetVisualHeight + bottomInset;
  // 드래그 중 시트 높이마다 pan을 바꾸면 지도가 흔들림 → 스냅 비율만 사용
  const focusPanOffsetY = useMemo(() => {
    if (containerHeight <= 0) {
      return 0;
    }
    const available = Math.max(0, containerHeight - bottomInset);
    const sheetForFocus = Math.round(
      available * (detailActive ? DETAIL_SCHEDULE_RATIO : DEFAULT_SCHEDULE_RATIO),
    );
    return Math.round((sheetForFocus + bottomInset) / 2);
  }, [containerHeight, bottomInset, detailActive]);

  useEffect(() => {
    onScheduleExpandChange?.(isFullyExpanded);
  }, [isFullyExpanded, onScheduleExpandChange]);

  return (
    <View className="flex-1 overflow-hidden" onLayout={handleContainerLayout}>
      <View
        className="absolute inset-0 overflow-hidden bg-[#E8F4E8]"
        pointerEvents={isActive ? 'auto' : 'none'}
        style={isActive ? undefined : styles.inactiveLayer}>
        <ScheduleMapView
          itinerary={itinerary}
          selectedDayNumber={selectedDayNumber}
          highlightItemId={highlightItemId}
          onMarkerPress={onMarkerPress}
          focusPanOffsetY={focusPanOffsetY}
          viewportInsetReady={containerHeight > 0}
          mapTitle=""
          mapSubtitle=""
        />
        {mapTopRight && !isFullyExpanded ? (
          <View className="absolute right-3 top-3 z-10" pointerEvents="box-none">
            {mapTopRight}
          </View>
        ) : null}
        {mapOverlayLeading && !isFullyExpanded ? (
          <View
            className="absolute left-3 z-10"
            style={{ bottom: mapObstructionBottom + 8 }}
            pointerEvents="box-none">
            {mapOverlayLeading}
          </View>
        ) : null}
        {mapOverlay && !isFullyExpanded ? (
          <View
            className="absolute right-3 z-10"
            style={{ bottom: mapObstructionBottom + 8 }}
            pointerEvents="box-none">
            {mapOverlay}
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.sheet,
          { height: sheetVisualHeight, bottom: bottomInset },
          !isActive && styles.inactiveSheet,
        ]}
        pointerEvents={isActive ? 'box-none' : 'none'}>
        <View
          {...panResponder.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel={dragLabel}
          accessibilityHint={mapClosedHint}
          style={styles.sheetHandleArea}
          className="bg-brand-surface">
          <View style={styles.sheetHandle} />
          {!scheduleOpen ? (
            <Text className="mt-1 text-[10px] font-medium text-brand-muted">{mapClosedHint}</Text>
          ) : null}
        </View>

        {scheduleOpen ? (
          <View className="relative min-h-0 flex-1 bg-brand-background">
            {isFullyExpanded && sheetHeader ? (
              <View className="border-b border-brand-border/60 bg-brand-background px-3">
                {sheetHeader}
              </View>
            ) : null}
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
              <View className="absolute inset-0 rounded-t-[24px] bg-brand-background">
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

            {sheetFooter && !detailActive ? sheetFooter : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    borderTopLeftRadius: APP_MODAL.sheetRadius,
    borderTopRightRadius: APP_MODAL.sheetRadius,
    overflow: 'hidden',
    backgroundColor: APP_MODAL.sheetBackground,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandleArea: {
    minHeight: SHEET_HANDLE_AREA_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    borderTopLeftRadius: APP_MODAL.sheetRadius,
    borderTopRightRadius: APP_MODAL.sheetRadius,
  },
  sheetHandle: {
    width: APP_MODAL.handleWidth,
    height: APP_MODAL.handleHeight,
    borderRadius: APP_MODAL.handleHeight / 2,
    backgroundColor: APP_MODAL.handleColor,
  },
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
  inactiveLayer: {
    opacity: 0,
  },
  inactiveSheet: {
    opacity: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
});
