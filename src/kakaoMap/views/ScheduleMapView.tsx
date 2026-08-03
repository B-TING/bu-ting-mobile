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
  mapTitle: string;
  mapSubtitle: string;
  showFooter?: boolean;
};

export function ScheduleMapView({
  itinerary,
  selectedDayNumber,
  highlightItemId,
  mapTitle,
  mapSubtitle,
  showFooter = true,
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
      cameraKmSpan={focusPoint ? undefined : dayFocusSpan}
      fitPointsToCamera={!focusPoint}
      size="fill"
      emptySubtitle={mapSubtitle}
      footer={showFooter ? { title: mapTitle, subtitle: mapSubtitle } : undefined}
    />
  );
}
