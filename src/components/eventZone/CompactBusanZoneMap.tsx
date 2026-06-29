import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import {
  BUSAN_DISTRICT_BY_ID,
  EVENT_ZONE_DISTRICT_IDS,
} from '../../constants/eventZone/busanMapPaths';
import { EVENT_ZONES } from '../../constants/eventZone/eventZone';
import type { EventZoneId } from '../../types/eventZone';
import {
  focusRectToViewBox,
  getHomeWidgetZoneFocusRect,
  interpolateFocusRect,
  type MapFocusRect,
} from '../../utils/eventZone/zoneMapFocus';

type CompactBusanZoneMapProps = {
  highlightedZoneId: EventZoneId;
};

const FOCUS_ANIMATION_MS = 480;

function zoneFill(zoneId: EventZoneId, baseColor: string, highlightedZoneId: EventZoneId): string {
  if (highlightedZoneId === zoneId) {
    return `${baseColor}DD`;
  }
  return `${baseColor}55`;
}

function zoneStroke(
  zoneId: EventZoneId,
  highlightedZoneId: EventZoneId,
): { color: string; width: number } {
  if (highlightedZoneId === zoneId) {
    return { color: '#EAB308', width: 2.5 };
  }
  return { color: '#FFFFFF', width: 1.5 };
}

const MAP_SHADOW = { dx: 3, dy: 4, opacity: 0.16 } as const;

export function CompactBusanZoneMap({ highlightedZoneId }: CompactBusanZoneMapProps) {
  const focusProgress = useRef(new Animated.Value(1)).current;
  const viewRectRef = useRef<MapFocusRect>(getHomeWidgetZoneFocusRect(highlightedZoneId));
  const [viewBox, setViewBox] = useState(() => focusRectToViewBox(viewRectRef.current));

  const applyViewRect = useCallback((rect: MapFocusRect) => {
    viewRectRef.current = rect;
    setViewBox(focusRectToViewBox(rect));
  }, []);

  useEffect(() => {
    const from = viewRectRef.current;
    const to = getHomeWidgetZoneFocusRect(highlightedZoneId);

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
      applyViewRect(interpolateFocusRect(from, to, value));
    });

    Animated.timing(focusProgress, {
      toValue: 1,
      duration: FOCUS_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        applyViewRect(to);
      }
    });

    return () => {
      focusProgress.removeListener(listenerId);
    };
  }, [applyViewRect, focusProgress, highlightedZoneId]);

  return (
    <View className="h-full w-full">
      <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        <G
          transform={`translate(${MAP_SHADOW.dx}, ${MAP_SHADOW.dy})`}
          opacity={MAP_SHADOW.opacity}
          pointerEvents="none">
          {EVENT_ZONES.flatMap(zone =>
            EVENT_ZONE_DISTRICT_IDS[zone.id].map(districtId => {
              const district = BUSAN_DISTRICT_BY_ID[districtId];
              if (!district) {
                return null;
              }
              return (
                <Path
                  key={`shadow-${zone.id}-${districtId}`}
                  d={district.d}
                  fill="#0F172A"
                  stroke="none"
                />
              );
            }),
          )}
        </G>

        {EVENT_ZONES.map(zone =>
          EVENT_ZONE_DISTRICT_IDS[zone.id].map(districtId => {
            const district = BUSAN_DISTRICT_BY_ID[districtId];
            if (!district) {
              return null;
            }
            const stroke = zoneStroke(zone.id, highlightedZoneId);
            return (
              <Path
                key={`${zone.id}-${districtId}`}
                d={district.d}
                fill={zoneFill(zone.id, zone.baseColor, highlightedZoneId)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinejoin="round"
              />
            );
          }),
        )}
      </Svg>
    </View>
  );
}
