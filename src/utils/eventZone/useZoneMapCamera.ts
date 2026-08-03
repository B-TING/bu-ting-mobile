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
 * 포커스 줌인/아웃: useNativeDriver(true) — UI 스레드, 프레임당 setValue 없음.
 * pan/pinch: setValue 만 (React 리렌더/viewBox 변경 없음).
 *
 * 패널 확장으로 layout 이 바뀌면 애니를 최신 layout 기준으로 다시 시작해
 * onLayout setValue 가 네이티브 포커스 애니를 덮어쓰지 않게 한다.
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
    // 포커스 네이티브 애니 중에는 layout 보정 setValue 로 덮지 않음
    if (focusAnimatingRef.current) {
      return;
    }
    applyTransformValues(viewRectRef.current, layoutSize);
  }, [applyTransformValues, layoutSize]);

  useEffect(() => {
    const from = viewRectRef.current;
    const to = resolveRect(selectedZoneId);

    // layout 미측정: 다음 layoutSize 변경 때 재실행
    if (layoutSize.width <= 1 || layoutSize.height <= 1) {
      return;
    }

    if (rectsEqual(from, to)) {
      // 애니 중단 후 논리 rect 는 같은데 transform 만 어긋난 경우 보정
      focusAnimatingRef.current = false;
      applyTransformValues(to, layoutSize);
      return;
    }

    focusTargetRef.current = to;
    const fromT = focusRectToCameraTransform(from, layoutSize);
    const toT = focusRectToCameraTransform(to, layoutSize);

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
      // viewRectRef 는 커밋하지 않음 — layout 변경으로 재시작 시 from 을 유지해야 줌 트랜지션이 보인다
      anim.stop();
      focusAnimatingRef.current = false;
    };
  }, [
    applyTransformValues,
    layoutSize,
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
