import type { EventZoneLandmark, EventZoneMapPoint } from '../../types/eventZone';

export function resolveLandmarkMapPoint(landmark: EventZoneLandmark): EventZoneMapPoint {
  return landmark.mapPoint;
}
