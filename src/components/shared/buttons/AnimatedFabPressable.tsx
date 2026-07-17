import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type AnimatedFabPressableProps = {
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** press 시 축소 비율 (기본 0.88) */
  pressedScale?: number;
};

/**
 * FAB 터치 시 스프링 scale + opacity 피드백.
 */
export function AnimatedFabPressable({
  onPress,
  accessibilityLabel,
  children,
  style,
  pressedScale = 0.88,
}: AnimatedFabPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (nextScale: number, nextOpacity: number) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: nextScale,
        friction: 5,
        tension: 320,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: nextOpacity,
        duration: nextScale < 1 ? 70 : 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(pressedScale, 0.9)}
      onPressOut={() => animateTo(1, 1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
