import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  type LayoutChangeEvent,
} from 'react-native';

import { BUSAN_SVG_VIEWBOX } from '../../constants/eventZone/busanMapPaths';
import type { EventZoneId } from '../../types/eventZone';
import {
  clampFocusRect,
  focusRectToCameraTransform,
  resolveMapFocusRect,
  type MapFocusRect,
} from './zoneMapFocus';

const FOCUS_ANIMATION_MS = 480;
const MIN_ZOOM_WIDTH = 140;

function rectsEqual(a: MapFocusRect, b: MapFocusRect): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

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

export type ZoneMapCameraOptions = {
  selectedZoneId: EventZoneId | null;
  panelOpen?: boolean;
  /** 커스텀 focus rect resolver (홈 위젯 등) */
  resolveFocusRect?: (zoneId: EventZoneId | null) => MapFocusRect;
  /** pan/pinch 허용 */
  interactive?: boolean;
};

/**
 * 고정 SVG viewBox + Animated.View transform 카메라.
 *
 * 포커스 줌: useNativeDriver(true). layout 크기 변화로 애니를 재시작하지 않는다
 * (초기 layoutReady 이후에만 포커스 effect 실행).
 */
export function useZoneMapCamera({
  selectedZoneId,
  panelOpen = false,
  resolveFocusRect,
  interactive = true,
}: ZoneMapCameraOptions) {
  const resolveRect = useCallback(
    (zoneId: EventZoneId | null): MapFocusRect => {
      if (resolveFocusRect) {
        return resolveFocusRect(zoneId);
      }
      return resolveMapFocusRect(zoneId, { layoutForPanel: panelOpen });
    },
    [panelOpen, resolveFocusRect],
  );

  const viewRectRef = useRef<MapFocusRect>(resolveRect(null));
  const focusTargetRef = useRef<MapFocusRect>(viewRectRef.current);
  const focusAnimatingRef = useRef(false);
  const layoutRef = useRef({ width: 1, height: 1 });
  const [layoutSize, setLayoutSize] = useState({ width: 1, height: 1 });
  /** 첫 유효 layout 이후 true — 포커스 effect 는 이 플래그만 보고, 이후 size 변경으로 재시작하지 않음 */
  const [layoutReady, setLayoutReady] = useState(false);
  const pinchRef = useRef<{ startDist: number; startRect: MapFocusRect } | null>(
    null,
  );
  const panStartRef = useRef<MapFocusRect | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const applyTransformValues = useCallback(
    (rect: MapFocusRect, layout = layoutRef.current) => {
      const { scale, translateX, translateY } = focusRectToCameraTransform(
        rect,
        layout,
      );
      scaleAnim.setValue(scale);
      translateXAnim.setValue(translateX);
      translateYAnim.setValue(translateY);
    },
    [scaleAnim, translateXAnim, translateYAnim],
  );

  const applyViewRect = useCallback(
    (rect: MapFocusRect) => {
      const clamped = clampFocusRect(rect);
      viewRectRef.current = clamped;
      focusTargetRef.current = clamped;
      applyTransformValues(clamped);
    },
    [applyTransformValues],
  );

  const stopFocusAnimation = useCallback(
    (commitTarget = true) => {
      scaleAnim.stopAnimation();
      translateXAnim.stopAnimation();
      translateYAnim.stopAnimation();
      if (focusAnimatingRef.current) {
        focusAnimatingRef.current = false;
        if (commitTarget) {
          viewRectRef.current = focusTargetRef.current;
          applyTransformValues(viewRectRef.current);
        }
      }
    },
    [applyTransformValues, scaleAnim, translateXAnim, translateYAnim],
  );

  useEffect(() => {
    if (focusAnimatingRef.current) {
      return;
    }
    applyTransformValues(viewRectRef.current, layoutSize);
  }, [applyTransformValues, layoutSize]);

  useEffect(() => {
    if (!layoutReady) {
      return;
    }

    const from = viewRectRef.current;
    const to = resolveRect(selectedZoneId);
    const layout = layoutRef.current;

    if (rectsEqual(from, to)) {
      focusAnimatingRef.current = false;
      applyTransformValues(to, layout);
      return;
    }

    focusTargetRef.current = to;
    const fromT = focusRectToCameraTransform(from, layout);
    const toT = focusRectToCameraTransform(to, layout);

    scaleAnim.stopAnimation();
    translateXAnim.stopAnimation();
    translateYAnim.stopAnimation();
    scaleAnim.setValue(fromT.scale);
    translateXAnim.setValue(fromT.translateX);
    translateYAnim.setValue(fromT.translateY);

    focusAnimatingRef.current = true;

    const anim = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: toT.scale,
        duration: FOCUS_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: toT.translateX,
        duration: FOCUS_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: toT.translateY,
        duration: FOCUS_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    anim.start(({ finished }) => {
      focusAnimatingRef.current = false;
      if (!finished) {
        return;
      }
      viewRectRef.current = to;
      applyTransformValues(to, layoutRef.current);
    });

    return () => {
      anim.stop();
      focusAnimatingRef.current = false;
    };
  }, [
    applyTransformValues,
    layoutReady,
    resolveRect,
    scaleAnim,
    selectedZoneId,
    translateXAnim,
    translateYAnim,
  ]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      layoutRef.current = { width, height };
      setLayoutSize(prev =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
      setLayoutReady(ready => ready || (width > 1 && height > 1));
    }
  }, []);

  const panResponder = useMemo(() => {
    if (!interactive) {
      return null;
    }
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: event => {
        stopFocusAnimation(true);
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

        if (touches.length >= 2) {
          if (!pinchRef.current || pinchRef.current.startDist <= 0) {
            pinchRef.current = {
              startDist: touchDistance(touches),
              startRect: { ...viewRectRef.current },
            };
          }
          const dist = touchDistance(touches);
          if (pinchRef.current.startDist > 0 && dist > 0) {
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
      },
      onPanResponderTerminate: () => {
        pinchRef.current = null;
        panStartRef.current = null;
      },
    });
  }, [applyViewRect, interactive, stopFocusAnimation]);

  const cameraStyle = useMemo(
    () => ({
      width: '100%' as const,
      height: '100%' as const,
      position: 'relative' as const,
      transform: [
        { translateX: translateXAnim },
        { translateY: translateYAnim },
        { scale: scaleAnim },
      ],
    }),
    [scaleAnim, translateXAnim, translateYAnim],
  );

  return {
    layoutSize,
    cameraStyle,
    panHandlers: panResponder?.panHandlers ?? {},
    onLayout,
    fixedViewBox: `0 0 ${BUSAN_SVG_VIEWBOX.width} ${BUSAN_SVG_VIEWBOX.height}`,
  };
}
