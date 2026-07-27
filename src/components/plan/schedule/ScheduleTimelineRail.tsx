import type { ReactNode } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

export const SCHEDULE_TIMELINE_RAIL_WIDTH = 36;
const LINE_WIDTH = 2;
const RAIL_CENTER = SCHEDULE_TIMELINE_RAIL_WIDTH / 2;

type ScheduleTimelineRailProps = {
  node: ReactNode;
  lineColor?: string;
  extendTop?: number;
  extendBottom?: number;
  dashed?: boolean;
};

export function ScheduleTimelineRail({
  node,
  lineColor = '#CBD5E1',
  extendTop = 0,
  extendBottom = 0,
  dashed = false,
}: ScheduleTimelineRailProps) {
  const [railHeight, setRailHeight] = useState(0);
  const lineHeight = railHeight + extendTop + extendBottom;

  return (
    <View
      className="mr-3 items-center self-stretch justify-center"
      style={{ width: SCHEDULE_TIMELINE_RAIL_WIDTH }}
      onLayout={event => setRailHeight(event.nativeEvent.layout.height)}>
      {dashed && lineHeight > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -extendTop,
            left: 0,
            width: SCHEDULE_TIMELINE_RAIL_WIDTH,
            height: lineHeight,
          }}>
          <Svg width={SCHEDULE_TIMELINE_RAIL_WIDTH} height={lineHeight}>
            <Line
              x1={RAIL_CENTER}
              y1={0}
              x2={RAIL_CENTER}
              y2={lineHeight}
              stroke={lineColor}
              strokeWidth={LINE_WIDTH}
              strokeDasharray="5 5"
            />
          </Svg>
        </View>
      ) : null}
      <View className="z-10">{node}</View>
    </View>
  );
}
