import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { getScheduleDayColor } from '../../constants/scheduleDayColors';
import type { ScheduleMapMarkerOverlay } from '../../utils/scheduleMapOverlays';

type ScheduleMapOrderMarkerProps = {
  marker: ScheduleMapMarkerOverlay;
};

/**
 * 커스텀 Marker 뷰는 tracksViewChanges=false면 숫자 등 내용이 갱신되지 않습니다.
 * order·선택 상태가 바뀔 때 잠시 true로 켠 뒤 다시 끕니다.
 */
export function ScheduleMapOrderMarker({ marker }: ScheduleMapOrderMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const color = getScheduleDayColor(marker.dayNumber);
  const pinSize = marker.isActiveDay ? 30 : 26;

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 400);
    return () => clearTimeout(timer);
  }, [marker.key, marker.order, marker.isActiveDay, marker.isSelectedDay]);

  return (
    <Marker
      identifier={marker.key}
      coordinate={marker.coordinate}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={marker.isActiveDay ? 10 : 5}
      opacity={marker.isSelectedDay ? 1 : 0.72}>
      <View
        className="items-center justify-center rounded-full border-2 border-white"
        style={{
          width: pinSize,
          height: pinSize,
          backgroundColor: color.main,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        }}>
        <Text className="font-bold text-white" style={{ fontSize: marker.isActiveDay ? 13 : 11 }}>
          {marker.order}
        </Text>
      </View>
    </Marker>
  );
}
