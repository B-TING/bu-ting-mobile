import { useMemo } from 'react';

import type { DailyItinerary } from '../../types/travelPlan';
import {
  buildScheduleMapDays,
  collectScheduleMapPoints,
} from '../../utils/scheduleMapSnapshot';
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

  return (
    <KakaoMapShell
      points={points}
      size="fill"
      emptySubtitle={mapSubtitle}
      footer={{ title: mapTitle, subtitle: mapSubtitle }}
    />
  );
}
