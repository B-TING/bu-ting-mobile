import { useCallback } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';

import type { EventZoneId } from '../../types/eventZone';
import { useZoneMapCamera } from '../../utils/eventZone/useZoneMapCamera';
import {
  getHomeWidgetZoneFocusRect,
  type MapFocusRect,
} from '../../utils/eventZone/zoneMapFocus';
import { CompactDistrictLayer } from './BusanZoneMapLayers';

type CompactBusanZoneMapProps = {
  highlightedZoneId: EventZoneId;
};

export function CompactBusanZoneMap({ highlightedZoneId }: CompactBusanZoneMapProps) {
  const resolveFocusRect = useCallback((zoneId: EventZoneId | null): MapFocusRect => {
    if (!zoneId) {
      return getHomeWidgetZoneFocusRect(highlightedZoneId);
    }
    return getHomeWidgetZoneFocusRect(zoneId);
  }, [highlightedZoneId]);

  const { cameraStyle, onLayout, fixedViewBox } = useZoneMapCamera({
    selectedZoneId: highlightedZoneId,
    interactive: false,
    resolveFocusRect,
  });

  return (
    <View style={styles.root} className="h-full w-full" onLayout={onLayout}>
      <Animated.View style={cameraStyle}>
        <Svg
          width="100%"
          height="100%"
          viewBox={fixedViewBox}
          preserveAspectRatio="xMidYMid meet">
          <CompactDistrictLayer highlightedZoneId={highlightedZoneId} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
