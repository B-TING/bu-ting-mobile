import type { SubwayLockerStation } from '../types/subwayLocker';

export function sortLockerStations(
  stations: SubwayLockerStation[],
  bookmarkedIds: readonly string[],
): SubwayLockerStation[] {
  const bookmarkSet = new Set(bookmarkedIds);

  return [...stations].sort((a, b) => {
    const aBookmarked = bookmarkSet.has(a.id);
    const bBookmarked = bookmarkSet.has(b.id);
    if (aBookmarked !== bBookmarked) {
      return aBookmarked ? -1 : 1;
    }
    return a.line - b.line || a.name.localeCompare(b.name, 'ko');
  });
}
