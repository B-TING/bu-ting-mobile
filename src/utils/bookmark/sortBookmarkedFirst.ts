export function sortBookmarkedFirst<T extends { id: string }>(
  items: T[],
  bookmarkedIds: readonly string[],
  compare?: (a: T, b: T) => number,
): T[] {
  const bookmarkSet = new Set(bookmarkedIds);

  return [...items].sort((a, b) => {
    const aBookmarked = bookmarkSet.has(a.id);
    const bBookmarked = bookmarkSet.has(b.id);
    if (aBookmarked !== bBookmarked) {
      return aBookmarked ? -1 : 1;
    }
    return compare?.(a, b) ?? 0;
  });
}
