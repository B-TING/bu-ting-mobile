import type { RootStackParamList } from '../../navigation/types';
import type { EventZoneCoordinate } from '../../types/eventZone';
import {
  currentMonthDateRangeYyyymmdd,
  upcomingFestivalDateRangeYyyymmdd,
} from './festivalApiMapper';
import { haversineKm } from '../geo/geo';

export function centersDifferBeyondThreshold(
  a: EventZoneCoordinate,
  b: EventZoneCoordinate,
  thresholdM: number,
): boolean {
  const distanceM = haversineKm(a.lat, a.lng, b.lat, b.lng) * 1000;
  return distanceM > thresholdM;
}

export function resolveFestivalDateRange(
  params: RootStackParamList['PlaceMapSearch'],
): { eventStartDate: string; eventEndDate: string } {
  if (params?.festivalEventStartDate) {
    return {
      eventStartDate: params.festivalEventStartDate,
      eventEndDate: params.festivalEventEndDate ?? params.festivalEventStartDate,
    };
  }
  if (params?.selectedContentId) {
    return upcomingFestivalDateRangeYyyymmdd();
  }
  return currentMonthDateRangeYyyymmdd();
}
