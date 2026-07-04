import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const EVENT_GLOW_COLOR = '#E91E63';
const RING_DURATION_MS = 2200;

type EventPulseMarkerProps = {
  x: number;
  y: number;
};

/** 바깥으로 퍼지는 링 1개 (레이더 핑) */
function ExpandingRing({
  x,
  y,
  delayMs,
}: {
  x: number;
  y: number;
  delayMs: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: RING_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delayMs, progress]);

  const radius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 80],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.55, 1],
    outputRange: [0, 0.65, 0.3, 0],
  });
  const strokeWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [2.5, 0.4],
  });

  return (
    <AnimatedCircle
      cx={x}
      cy={y}
      r={radius}
      fill="none"
      stroke={EVENT_GLOW_COLOR}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
    />
  );
}

/**
 * 이벤트 비콘 마커 — 중심 밝은 점 + 방사형 글로우 + 퍼져 나가는 링
 * (path glow 대비 Circle만 애니메이션하여 가볍게 유지)
 */
export function EventPulseMarker({ x, y }: EventPulseMarkerProps) {
  const corePulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(corePulse, {
          toValue: 0.7,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [corePulse]);

  const haloRadius = corePulse.interpolate({
    inputRange: [0.7, 1],
    outputRange: [20, 26],
  });
  const haloOpacity = corePulse.interpolate({
    inputRange: [0.7, 1],
    outputRange: [0.22, 0.38],
  });

  return (
    <G pointerEvents="none">
      <Defs>
        <RadialGradient id={`event-beacon-${x}-${y}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="35%" stopColor={EVENT_GLOW_COLOR} stopOpacity={0.85} />
          <Stop offset="100%" stopColor={EVENT_GLOW_COLOR} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <ExpandingRing x={x} y={y} delayMs={0} />
      <ExpandingRing x={x} y={y} delayMs={RING_DURATION_MS / 2} />

      <AnimatedCircle
        cx={x}
        cy={y}
        r={haloRadius}
        fill={EVENT_GLOW_COLOR}
        fillOpacity={haloOpacity}
      />
      <Circle cx={x} cy={y} r={14} fill={`url(#event-beacon-${x}-${y})`} />
      <Circle cx={x} cy={y} r={4.5} fill="#FFFFFF" />
    </G>
  );
}
