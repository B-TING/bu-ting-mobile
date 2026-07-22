import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';

import type { GuideRect } from './guideTypes';

const PAD = 6;
const RADIUS = 14;
const DIM = 'rgba(15, 23, 42, 0.62)';

type GuideSpotlightProps = {
  rect: GuideRect | null;
};

/** Dim 마스크 + 둥근 cutout (시각만, 터치 통과 없음) */
export function GuideSpotlight({ rect }: GuideSpotlightProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  if (!rect || rect.width <= 0 || rect.height <= 0 || size.width <= 0) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          setSize({ width, height });
        }}
      />
    );
  }

  const { width, height } = size;
  const x = Math.max(0, rect.x - PAD);
  const y = Math.max(0, rect.y - PAD);
  const w = Math.min(width - x, rect.width + PAD * 2);
  const h = Math.min(height - y, rect.height + PAD * 2);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={e => {
        const next = e.nativeEvent.layout;
        if (next.width !== size.width || next.height !== size.height) {
          setSize({ width: next.width, height: next.height });
        }
      }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="guide-cutout">
            <Rect x={0} y={0} width={width} height={height} fill="#fff" />
            <Rect x={x} y={y} width={w} height={h} rx={RADIUS} ry={RADIUS} fill="#000" />
          </Mask>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={DIM}
          mask="url(#guide-cutout)"
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: RADIUS,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.92)',
        }}
      />
    </View>
  );
}
