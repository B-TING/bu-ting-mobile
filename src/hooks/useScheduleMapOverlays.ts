import { useEffect, useMemo, useState } from 'react';

import type { DailyItinerary } from '../types/travelPlan';
import {
  buildScheduleMapOverlays,
  type ScheduleMapLineOverlay,
  type ScheduleMapMarkerOverlay,
} from '../utils/scheduleMapOverlays';

/**
 * Polyline·Marker 좌표를 useState로 관리합니다.
 * 일정이 바뀌면 먼저 빈 배열로 지운 뒤(언마운트) 새 좌표를 주입합니다.
 */
export function useScheduleMapOverlays(
  itinerary: DailyItinerary[],
  selectedDayNumber?: number,
) {
  const [lines, setLines] = useState<ScheduleMapLineOverlay[]>([]);
  const [markers, setMarkers] = useState<ScheduleMapMarkerOverlay[]>([]);

  const overlaySnapshot = useMemo(
    () => buildScheduleMapOverlays(itinerary, selectedDayNumber),
    [itinerary, selectedDayNumber],
  );

  useEffect(() => {
    setLines([]);
    setMarkers([]);

    const frame = requestAnimationFrame(() => {
      setLines(overlaySnapshot.lines);
      setMarkers(overlaySnapshot.markers);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [overlaySnapshot]);

  return { lines, markers };
}
