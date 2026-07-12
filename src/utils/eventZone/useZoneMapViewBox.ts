import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, type LayoutChangeEvent } from 'react-native';

import { BUSAN_SVG_VIEWBOX } from '../../constants/eventZone/busanMapPaths';
import type { EventZoneId } from '../../types/eventZone';
import {
  clampFocusRect,
  focusRectToViewBox,
  interpolateFocusRect,
  resolveMapFocusRect,
  type MapFocusRect,
} from './zoneMapFocus';

const FOCUS_ANIMATION_MS = 480;
const MIN_ZOOM_WIDTH = 140;

function touchDistance(
  touches: readonly { pageX: number; pageY: number }[],
): number {
  if (touches.length < 2) {
    return 0;
  }
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.hypot(dx, dy);
}

export function useZoneMapViewBox(
  selectedZoneId: EventZoneId | null,
  panelOpen: boolean,
) {
  const focusProgress = useRef(new Animated.Value(1)).current;
  const viewRectRef = useRef<MapFocusRect>(resolveMapFocusRect(null));
  const layoutRef = useRef({ width: 1, height: 1 });
  const pinchRef = useRef<{ startDist: number; startRect: MapFocusRect } | null>(null);
  const panStartRef = useRef<MapFocusRect | null>(null);
  const pendingViewBoxRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  const [viewBox, setViewBox] = useState(() =>
    focusRectToViewBox(resolveMapFocusRect(null)),
  );

  const flushViewBox = useCallback(() => {
    rafRef.current = null;
    const next = pendingViewBoxRef.current;
    if (next != null) {
      pendingViewBoxRef.current = null;
      setViewBox(next);
    }
  }, []);

  const scheduleViewBoxUpdate = useCallback(
    (rect: MapFocusRect) => {
      pendingViewBoxRef.current = focusRectToViewBox(rect);
      if (rafRef.current != null) {
        return;
      }
      rafRef.current = requestAnimationFrame(flushViewBox);
    },
    [flushViewBox],
  );

  const applyViewRect = useCallback(
    (rect: MapFocusRect, immediate = false) => {
      const clamped = clampFocusRect(rect);
      viewRectRef.current = clamped;
      if (immediate) {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        pendingViewBoxRef.current = null;
        setViewBox(focusRectToViewBox(clamped));
        return;
      }
      scheduleViewBoxUpdate(clamped);
    },
    [scheduleViewBoxUpdate],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const from = viewRectRef.current;
    const to = resolveMapFocusRect(selectedZoneId, { layoutForPanel: panelOpen });

    if (
      from.x === to.x &&
      from.y === to.y &&
      from.width === to.width &&
      from.height === to.height
    ) {
      return;
    }

    focusProgress.stopAnimation();
    focusProgress.setValue(0);

    const listenerId = focusProgress.addListener(({ value }) => {
      scheduleViewBoxUpdate(interpolateFocusRect(from, to, value));
    });

    Animated.timing(focusProgress, {
      toValue: 1,
      duration: FOCUS_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        applyViewRect(to, true);
      }
    });

    return () => {
      focusProgress.removeListener(listenerId);
    };
  }, [applyViewRect, focusProgress, panelOpen, scheduleViewBoxUpdate, selectedZoneId]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      layoutRef.current = { width, height };
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
        onPanResponderGrant: event => {
          panStartRef.current = { ...viewRectRef.current };
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            pinchRef.current = {
              startDist: touchDistance(touches),
              startRect: { ...viewRectRef.current },
            };
          } else {
            pinchRef.current = null;
          }
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;

          if (touches.length >= 2 && pinchRef.current && pinchRef.current.startDist > 0) {
            const dist = touchDistance(touches);
            const ratio = pinchRef.current.startDist / dist;
            const start = pinchRef.current.startRect;
            const centerX = start.x + start.width / 2;
            const centerY = start.y + start.height / 2;
            const nextWidth = Math.max(
              MIN_ZOOM_WIDTH,
              Math.min(BUSAN_SVG_VIEWBOX.width, start.width * ratio),
            );
            const aspect = start.height / start.width;
            const nextHeight = nextWidth * aspect;

            applyViewRect({
              x: centerX - nextWidth / 2,
              y: centerY - nextHeight / 2,
              width: nextWidth,
              height: nextHeight,
            });
            return;
          }

          const start = panStartRef.current ?? viewRectRef.current;
          const { width, height } = layoutRef.current;
          const dx = (gesture.dx / width) * start.width;
          const dy = (gesture.dy / height) * start.height;

          applyViewRect({
            ...start,
            x: start.x - dx,
            y: start.y - dy,
          });
        },
        onPanResponderRelease: () => {
          pinchRef.current = null;
          panStartRef.current = null;
          applyViewRect(viewRectRef.current, true);
        },
        onPanResponderTerminate: () => {
          pinchRef.current = null;
          panStartRef.current = null;
          applyViewRect(viewRectRef.current, true);
        },
      }),
    [applyViewRect],
  );

  return {
    viewBox,
    panHandlers: panResponder.panHandlers,
    onLayout,
  };
}
