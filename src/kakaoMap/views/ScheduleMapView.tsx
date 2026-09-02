import { useMemo } from 'react';

import { useCurrentEventZone } from '../../hooks/useCurrentEventZone';
import type { DailyItinerary } from '../../types/travelPlan';
import { KakaoMapShell } from '../core/KakaoMapShell';
import { SCHEDULE_DAY_FOCUS_KM_SPAN } from '../core/camera';
import { useScheduleMapOverlays } from '../hooks/useScheduleMapOverlays';
import { kakaoOverlaysFromSchedule } from '../overlays/builders';
import {
  buildScheduleMapDays,
  collectScheduleMapPoints,
} from '../overlays/scheduleSnapshot';

type ScheduleMapViewProps = {
  itinerary: DailyItinerary[];
  selectedDayNumber?: number;
  highlightItemId?: string | null;
  onMarkerPress?: (itemId: string) => void;
  mapTitle: string;
  mapSubtitle: string;
  showFooter?: boolean;
  /** 하단 시트에 가려지지 않도록 포커스 마커를 위로 보정 (px) */
  focusPanOffsetY?: number;
  /** false면 레이아웃 측정 전 — 카메라 동기화 대기 */
  viewportInsetReady?: boolean;
};

export function ScheduleMapView({
  itinerary,
  selectedDayNumber,
  highlightItemId,
  onMarkerPress,
  mapTitle,
  mapSubtitle,
  showFooter = false,
  focusPanOffsetY = 0,
  viewportInsetReady = true,
}: ScheduleMapViewProps) {
  const { location } = useCurrentEventZone();
  const mapDays = useMemo(() => buildScheduleMapDays(itinerary), [itinerary]);
  const visibleDays = useMemo(
    () => mapDays.filter(day => day.routes.length > 0),
    [mapDays],
  );
  const schedulePoints = useMemo(
    () => collectScheduleMapPoints(visibleDays, selectedDayNumber),
    [visibleDays, selectedDayNumber],
  );
  const points = useMemo(
    () => (schedulePoints.length > 0 ? schedulePoints : [location]),
    [schedulePoints, location],
  );
  const { lines, markers } = useScheduleMapOverlays(itinerary, selectedDayNumber);
  const focusRoute = useMemo(() => {
    if (!highlightItemId) {
      return null;
    }
    for (const day of visibleDays) {
      if (selectedDayNumber != null && day.dayNumber !== selectedDayNumber) {
        continue;
      }
      const route = day.routes.find(item => item.itemId === highlightItemId);
      if (route) {
        return route;
      }
    }
    return null;
  }, [highlightItemId, selectedDayNumber, visibleDays]);
  const focusPoint = focusRoute?.location ?? null;
  const overlays = useMemo(
    () => kakaoOverlaysFromSchedule(lines, markers, highlightItemId),
    [lines, markers, highlightItemId],
  );
  const dayFocusSpan =
    schedulePoints.length === 0 || selectedDayNumber != null ? SCHEDULE_DAY_FOCUS_KM_SPAN : undefined;

  return (
    <KakaoMapShell
      points={points}
      focusPoint={focusPoint}
      overlays={overlays}
      onOverlayPress={onMarkerPress}
      cameraKmSpan={focusPoint ? undefined : dayFocusSpan}
      fitPointsToCamera={!focusPoint}
      focusPanOffsetY={focusPanOffsetY}
      viewportInsetReady={viewportInsetReady}
      size="fill"
      emptySubtitle={mapSubtitle}
      footer={showFooter ? { title: mapTitle, subtitle: mapSubtitle } : undefined}
    />
  );
}
