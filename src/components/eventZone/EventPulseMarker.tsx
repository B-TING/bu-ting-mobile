import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const EVENT_GLOW_COLOR = '#E91E63';
const RING_DURATION_MS = 2200;
const RING_SIZE = 160;
const CORE_SIZE = 28;

type EventPulseMarkerProps = {
  /** 레이아웃 픽셀 좌표 (카메라 래퍼 내부, transform 적용 전) */
  left: number;
  top: number;
  /** false 이면 애니메이션 루프 정지 */
  active?: boolean;
};

function ExpandingRingView({
  delayMs,
  active,
}: {
  delayMs: number;
  active: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: RING_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, delayMs, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 1],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.55, 1],
    outputRange: [0, 0.65, 0.3, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

/**
 * 이벤트 비콘 — RN View + native driver (scale/opacity).
 * SVG path 트리와 분리되어 pulse 프레임이 구 Path 를 dirty 하지 않는다.
 */
export const EventPulseMarker = memo(function EventPulseMarker({
  left,
  top,
  active = true,
}: EventPulseMarkerProps) {
  const corePulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!active) {
      corePulse.stopAnimation();
      corePulse.setValue(0.7);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(corePulse, {
          toValue: 0.7,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, corePulse]);

  const haloScale = corePulse.interpolate({
    inputRange: [0.7, 1],
    outputRange: [1, 1.3],
  });
  const haloOpacity = corePulse.interpolate({
    inputRange: [0.7, 1],
    outputRange: [0.22, 0.38],
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        {
          left: left - RING_SIZE / 2,
          top: top - RING_SIZE / 2,
        },
      ]}>
      <ExpandingRingView delayMs={0} active={active} />
      <ExpandingRingView delayMs={RING_DURATION_MS / 2} active={active} />
      <Animated.View
        style={[
          styles.halo,
          {
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      <View style={styles.coreOuter}>
        <View style={styles.coreInner} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: EVENT_GLOW_COLOR,
  },
  halo: {
    position: 'absolute',
    width: CORE_SIZE + 16,
    height: CORE_SIZE + 16,
    borderRadius: (CORE_SIZE + 16) / 2,
    backgroundColor: EVENT_GLOW_COLOR,
  },
  coreOuter: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    backgroundColor: EVENT_GLOW_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
  },
});
