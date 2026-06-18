import { useMemo } from 'react';

import { useScheduleMapOverlays } from '../../hooks/useScheduleMapOverlays';
import type { DailyItinerary } from '../../types/travelPlan';
import { kakaoOverlaysFromSchedule } from '../../utils/kakaoMapOverlayBuilders';
import {
  buildScheduleMapDays,
  collectScheduleMapPoints,
} from '../../utils/scheduleMapSnapshot';
import { SCHEDULE_DAY_FOCUS_KM_SPAN } from '../../utils/mapRegion';
import { KakaoMapShell } from './KakaoMapShell';

type ScheduleMapViewProps = {
  itinerary: DailyItinerary[];
  selectedDayNumber?: number;
  mapTitle: string;
  mapSubtitle: string;
};

export function ScheduleMapView({
  itinerary,
  selectedDayNumber,
  mapTitle,
  mapSubtitle,
}: ScheduleMapViewProps) {
  const mapDays = useMemo(() => buildScheduleMapDays(itinerary), [itinerary]);
  const visibleDays = useMemo(
    () => mapDays.filter(day => day.routes.length > 0),
    [mapDays],
  );
  const points = useMemo(
    () => collectScheduleMapPoints(visibleDays, selectedDayNumber),
    [visibleDays, selectedDayNumber],
  );
  const { lines, markers } = useScheduleMapOverlays(itinerary, selectedDayNumber);
  const overlays = useMemo(
    () => kakaoOverlaysFromSchedule(lines, markers),
    [lines, markers],
  );

  return (
    <KakaoMapShell
      points={points}
      overlays={overlays}
      cameraKmSpan={selectedDayNumber != null ? SCHEDULE_DAY_FOCUS_KM_SPAN : undefined}
      size="fill"
      emptySubtitle={mapSubtitle}
      footer={{ title: mapTitle, subtitle: mapSubtitle }}
    />
  );
}
