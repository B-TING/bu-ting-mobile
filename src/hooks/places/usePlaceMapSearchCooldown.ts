import { useEffect, useState } from 'react';

import { PLACE_SEARCH_REFRESH_COOLDOWN_MS } from '../../constants/places/placeSearch';

export function usePlaceMapSearchCooldown(lastSearchRequestedAt: number | null) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  const remainingMs = Math.max(
    0,
    lastSearchRequestedAt == null
      ? 0
      : PLACE_SEARCH_REFRESH_COOLDOWN_MS - (nowMs - lastSearchRequestedAt),
  );
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const isActive = remainingMs > 0;

  useEffect(() => {
    if (!isActive) {
      return;
    }
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 250);
    return () => clearInterval(timer);
  }, [isActive, lastSearchRequestedAt]);

  return {
    remainingMs,
    seconds,
    isActive,
  };
}
