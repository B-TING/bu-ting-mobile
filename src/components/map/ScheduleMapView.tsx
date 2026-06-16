import { useMemo } from 'react';
import { Polyline } from 'react-native-maps';

import { useScheduleMapOverlays } from '../../hooks/useScheduleMapOverlays';
import type { DailyItinerary } from '../../types/travelPlan';
import {
  buildScheduleMapDays,
  collectScheduleMapPoints,
} from '../../utils/scheduleMapSnapshot';
import { GoogleMapShell } from './GoogleMapShell';
import { ScheduleMapOrderMarker } from './ScheduleMapOrderMarker';

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
  const points = useMemo(() => collectScheduleMapPoints(visibleDays), [visibleDays]);
  const { lines, markers } = useScheduleMapOverlays(itinerary, selectedDayNumber);

  return (
    <GoogleMapShell
      points={points}
      size="fill"
      emptySubtitle={mapSubtitle}
      footer={{ title: mapTitle, subtitle: mapSubtitle }}
      followPoints>
      {lines.map(line =>
        line.coordinates.length >= 2 ? (
          <Polyline
            key={line.key}
            coordinates={line.coordinates}
            strokeColor={line.strokeColor}
            strokeWidth={line.strokeWidth}
            zIndex={line.zIndex}
            tappable={false}
            geodesic
          />
        ) : null,
      )}
      {markers.map(marker => (
        <ScheduleMapOrderMarker key={marker.key} marker={marker} />
      ))}
    </GoogleMapShell>
  );
}
