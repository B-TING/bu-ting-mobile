import type { SubwayLockerStation } from '../../types/subwayLocker';

export function sortLockerStations(
  stations: SubwayLockerStation[],
  bookmarkedIds: readonly string[],
): SubwayLockerStation[] {
  const bookmarkSet = new Set(bookmarkedIds);
  const hasDistance = stations.some(station => station.distanceMeters != null);

  return [...stations].sort((a, b) => {
    const aBookmarked = bookmarkSet.has(a.id);
    const bBookmarked = bookmarkSet.has(b.id);
    if (aBookmarked !== bBookmarked) {
      return aBookmarked ? -1 : 1;
    }
    if (hasDistance) {
      const distanceDiff =
        (a.distanceMeters ?? Number.POSITIVE_INFINITY) -
        (b.distanceMeters ?? Number.POSITIVE_INFINITY);
      if (distanceDiff !== 0) {
        return distanceDiff;
      }
    }
    return a.line - b.line || a.name.localeCompare(b.name, 'ko');
  });
}
