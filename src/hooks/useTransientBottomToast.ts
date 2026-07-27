import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

const DEFAULT_DURATION_MS = 3500;

export function useTransientBottomToast(durationMs = DEFAULT_DURATION_MS) {
  const [text, setText] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setText(null));
  }, [opacity]);

  const showToast = useCallback(
    (message: string) => {
      setText(message);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      hideTimerRef.current = setTimeout(() => {
        hideToast();
      }, durationMs);
    },
    [durationMs, hideToast, opacity],
  );

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return { text, opacity, showToast };
}
