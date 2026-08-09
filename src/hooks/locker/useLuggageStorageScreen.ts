import { useCallback, useEffect, useMemo, useState } from 'react';

import type { LockerLineFilter } from '../../components/locker/LockerLineFilterBar';
import { hasKnownSubwayLine } from '../../constants/locker/subwayLineColors';
import { useCopy } from '../../i18n';
import { usePlaceMapUserLocation } from '../../hooks/usePlaceMapUserLocation';
import { fetchSubwayLockerStations } from '../../services/locker/subwayLockerService';
import { useLockerBookmarkStore } from '../../stores';
import { STORAGE_SEARCH_RADIUS_DEFAULT_M } from '../../types/storageApi';
import type { SubwayLockerStation } from '../../types/subwayLocker';
import { sortLockerStations } from '../../utils/locker/subwayLockerSort';

function formatDistanceMeters(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)}km`;
}

function matchesLineFilter(
  station: SubwayLockerStation,
  filter: LockerLineFilter,
): boolean {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'unknown') {
    return !hasKnownSubwayLine(station.line);
  }
  return station.line === filter;
}

export function useLuggageStorageScreen() {
  const copy = useCopy('luggageStorage');
  const { location, status: locationStatus } = usePlaceMapUserLocation();

  const bookmarkedStationIds = useLockerBookmarkStore(s => s.bookmarkedStationIds);
  const toggleBookmark = useLockerBookmarkStore(s => s.toggleBookmark);
  const isBookmarked = useLockerBookmarkStore(s => s.isBookmarked);

  const [stations, setStations] = useState<SubwayLockerStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<SubwayLockerStation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [lineFilter, setLineFilter] = useState<LockerLineFilter>('all');

  useEffect(() => {
    if (locationStatus === 'loading') {
      setLoading(true);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchSubwayLockerStations({
      latitude: location.lat,
      longitude: location.lng,
      radius: STORAGE_SEARCH_RADIUS_DEFAULT_M,
    })
      .then(data => {
        if (!cancelled) {
          setStations(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.lat, location.lng, locationStatus]);

  const availableLines = useMemo(() => {
    const lines = new Set<number>();
    let hasUnknown = false;
    for (const station of stations) {
      if (hasKnownSubwayLine(station.line)) {
        lines.add(station.line);
      } else {
        hasUnknown = true;
      }
    }
    return {
      lines: [...lines].sort((a, b) => a - b),
      hasUnknown,
    };
  }, [stations]);

  const filteredStations = useMemo(() => {
    const sorted = sortLockerStations(stations, bookmarkedStationIds);
    return sorted.filter(station => matchesLineFilter(station, lineFilter));
  }, [stations, bookmarkedStationIds, lineFilter]);

  const totalLockers = useMemo(
    () => filteredStations.reduce((sum, station) => sum + station.lockers.total, 0),
    [filteredStations],
  );

  const handleLineFilterChange = useCallback(
    (next: LockerLineFilter) => {
      setLineFilter(next);
      setSelectedStation(current => {
        if (!current || matchesLineFilter(current, next)) {
          return current;
        }
        setDetailOpen(false);
        return null;
      });
    },
    [],
  );

  const handleSelectStation = useCallback((station: SubwayLockerStation) => {
    setSelectedStation(station);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    if (!selectedStation) {
      return;
    }
    toggleBookmark(selectedStation.id);
  }, [selectedStation, toggleBookmark]);

  return {
    copy,
    loading,
    stations,
    filteredStations,
    selectedStation,
    detailOpen,
    lineFilter,
    availableLines,
    totalLockers,
    bookmarkedStationIds,
    isBookmarked,
    formatDistanceMeters,
    handleLineFilterChange,
    handleSelectStation,
    handleCloseDetail,
    handleToggleBookmark,
  };
}
