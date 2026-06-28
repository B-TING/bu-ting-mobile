import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  BUSAN_DISTRICT_BY_ID,
  BUSAN_SVG_VIEWBOX,
  EVENT_ZONE_DISTRICT_IDS,
} from '../../constants/eventZone/busanMapPaths';
import { EVENT_ZONES, landmarkName } from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import type { EventZoneId } from '../../types/eventZone';
import { resolveLandmarkMapPoint } from '../../utils/eventZone/landmarkMapPoint';
import { useZoneMapViewBox } from '../../utils/eventZone/useZoneMapViewBox';

type BusanZoneMapProps = {
  selectedZoneId: EventZoneId | null;
  currentZoneId: EventZoneId;
  language: AppLanguage;
  onZonePress: (zoneId: EventZoneId) => void;
};

function zoneFill(
  zoneId: EventZoneId,
  baseColor: string,
  selectedZoneId: EventZoneId | null,
  currentZoneId: EventZoneId | null,
): string {
  if (selectedZoneId === zoneId) {
    return baseColor;
  }
  if (currentZoneId === zoneId) {
    return `${baseColor}DD`;
  }
  if (selectedZoneId && selectedZoneId !== zoneId) {
    return `${baseColor}44`;
  }
  return `${baseColor}88`;
}

function zoneStroke(
  zoneId: EventZoneId,
  selectedZoneId: EventZoneId | null,
  currentZoneId: EventZoneId | null,
): { color: string; width: number } {
  if (selectedZoneId === zoneId) {
    return { color: '#0F172A', width: 3.5 };
  }
  if (currentZoneId === zoneId) {
    return { color: '#EAB308', width: 2.5 };
  }
  return { color: '#FFFFFF', width: 2 };
}

export function BusanZoneMap({
  selectedZoneId,
  currentZoneId,
  language,
  onZonePress,
}: BusanZoneMapProps) {
  const panelOpen = selectedZoneId != null;
  const { viewBox, panHandlers, onLayout } = useZoneMapViewBox(selectedZoneId, panelOpen);

  const landmarkPoints = useMemo(() => {
    const zones =
      selectedZoneId != null
        ? EVENT_ZONES.filter(zone => zone.id === selectedZoneId)
        : EVENT_ZONES;

    return zones.flatMap(zone =>
      zone.landmarks.map(landmark => ({
        landmark,
        point: resolveLandmarkMapPoint(landmark),
      })),
    );
  }, [selectedZoneId]);

  return (
    <View className="flex-1 bg-[#EAEAEA]" onLayout={onLayout} {...panHandlers}>
      <Svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet">
        <Rect
          x={0}
          y={0}
          width={BUSAN_SVG_VIEWBOX.width}
          height={BUSAN_SVG_VIEWBOX.height}
          fill="#EAEAEA"
        />

        {EVENT_ZONES.map(zone =>
          EVENT_ZONE_DISTRICT_IDS[zone.id].map(districtId => {
            const district = BUSAN_DISTRICT_BY_ID[districtId];
            if (!district) {
              return null;
            }
            const stroke = zoneStroke(zone.id, selectedZoneId, currentZoneId);
            return (
              <Path
                key={`${zone.id}-${districtId}`}
                d={district.d}
                fill={zoneFill(zone.id, zone.baseColor, selectedZoneId, currentZoneId)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinejoin="round"
                onPress={() => onZonePress(zone.id)}
              />
            );
          }),
        )}

        {landmarkPoints.map(({ landmark, point }) => (
          <G key={landmark.id}>
            <Circle
              cx={point.x}
              cy={point.y}
              r={selectedZoneId ? 18 : 14}
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth={2}
            />
            <SvgText
              x={point.x}
              y={point.y + 5}
              fontSize={selectedZoneId ? 16 : 13}
              textAnchor="middle"
              fill="#0F172A">
              {landmark.emoji}
            </SvgText>
            {selectedZoneId ? (
              <SvgText
                x={point.x}
                y={point.y + 30}
                fontSize={11}
                fontWeight="600"
                textAnchor="middle"
                fill="#0F172A">
                {landmarkName(landmark, language).slice(0, 12)}
              </SvgText>
            ) : null}
          </G>
        ))}
      </Svg>
    </View>
  );
}
