import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { EVENT_ZONES } from '../constants/eventZone/eventZone';
import type { EventZoneId } from '../types/eventZone';

const ZONE_IDS = EVENT_ZONES.map(zone => zone.id);
const CYCLE_HOLD_MS = 2800;
const FADE_MS = 360;

export function useEventZoneCarousel(
  isCycling: boolean,
  userZoneId: EventZoneId,
) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [mapZoneId, setMapZoneId] = useState<EventZoneId>(userZoneId);
  const [chatZoneId, setChatZoneId] = useState<EventZoneId>(userZoneId);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isCycling) {
      fadeAnim.setValue(1);
      const userIndex = ZONE_IDS.indexOf(userZoneId);
      indexRef.current = Math.max(0, userIndex);
      setCarouselIndex(Math.max(0, userIndex));
      setMapZoneId(userZoneId);
      setChatZoneId(userZoneId);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const advance = () => {
      if (cancelled) {
        return;
      }

      const nextIndex = (indexRef.current + 1) % ZONE_IDS.length;
      const nextZoneId = ZONE_IDS[nextIndex];

      setMapZoneId(nextZoneId);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) {
          return;
        }

        indexRef.current = nextIndex;
        setCarouselIndex(nextIndex);
        setChatZoneId(nextZoneId);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start(({ finished: fadeInDone }) => {
          if (!fadeInDone || cancelled) {
            return;
          }
          timeoutId = setTimeout(advance, CYCLE_HOLD_MS);
        });
      });
    };

    timeoutId = setTimeout(advance, CYCLE_HOLD_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim, isCycling, userZoneId]);

  return {
    mapZoneId: isCycling ? mapZoneId : userZoneId,
    chatZoneId: isCycling ? chatZoneId : userZoneId,
    fadeAnim,
    carouselIndex,
    zoneCount: ZONE_IDS.length,
    isCycling,
  };
}
