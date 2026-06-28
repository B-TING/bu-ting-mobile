import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  BUSAN_DISTRICT_BY_ID,
  BUSAN_SVG_VIEWBOX,
  EVENT_ZONE_DISTRICT_IDS,
} from '../../constants/eventZone/busanMapPaths';
import { EVENT_ZONES, EVENT_ZONE_BY_ID, landmarkName } from '../../constants/eventZone/eventZone';
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
    return { color: '#0F172A', width: 1.5 };
  }
  if (currentZoneId === zoneId) {
    return { color: '#EAB308', width: 2.5 };
  }
  return { color: '#FFFFFF', width: 2 };
}

const MAP_SHADOW = { dx: 5, dy: 7, opacity: 0.2 } as const;

const SELECTED_ZONE_GLOW = [
  { strokeWidth: 12, opacity: 0.22 },
  { strokeWidth: 7, opacity: 0.38 },
] as const;

type LandmarkNamePillProps = {
  x: number;
  y: number;
  label: string;
};

function LandmarkNamePill({ x, y, label }: LandmarkNamePillProps) {
  const text = label.slice(0, 10);
  const pillWidth = text.length * 6 + 15;
  const pillHeight = 14;
  const pillX = x - pillWidth / 2;
  const pillY = y + 12;

  return (
    <>
      <Rect
        x={pillX}
        y={pillY}
        width={pillWidth}
        height={pillHeight}
        rx={7}
        ry={7}
        fill="#FFFFFF"
        fillOpacity={0.94}
        stroke="#0F172A"
        strokeWidth={1}
        strokeOpacity={0.2}
      />
      <SvgText
        x={x}
        y={y + 22}
        fontSize={9}
        fontWeight="600"
        textAnchor="middle"
        fill="#0F172A">
        {text}
      </SvgText>
    </>
  );
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
            if (selectedZoneId === zone.id) {
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

        {selectedZoneId
          ? EVENT_ZONE_DISTRICT_IDS[selectedZoneId].flatMap(districtId => {
              const district = BUSAN_DISTRICT_BY_ID[districtId];
              const zone = EVENT_ZONE_BY_ID[selectedZoneId];
              if (!district || !zone) {
                return [];
              }
              const glowLayers = SELECTED_ZONE_GLOW.map(({ strokeWidth, opacity }, index) => (
                <Path
                  key={`glow-${districtId}-${index}`}
                  d={district.d}
                  fill="none"
                  stroke={zone.baseColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  strokeLinejoin="round"
                  pointerEvents="none"
                />
              ));
              const stroke = zoneStroke(zone.id, selectedZoneId, currentZoneId);
              return [
                ...glowLayers,
                <Path
                  key={`selected-${districtId}`}
                  d={district.d}
                  fill={zoneFill(zone.id, zone.baseColor, selectedZoneId, currentZoneId)}
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  strokeLinejoin="round"
                  onPress={() => onZonePress(zone.id)}
                />,
              ];
            })
          : null}

        {landmarkPoints.map(({ landmark, point }) => (
          <G key={landmark.id}>
            <Circle
              cx={point.x}
              cy={point.y}
              r={selectedZoneId ? 10 : 14}
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth={selectedZoneId ? 1.5 : 2}
            />
            <SvgText
              x={point.x}
              y={point.y + (selectedZoneId ? 3.5 : 5)}
              fontSize={selectedZoneId ? 10 : 13}
              textAnchor="middle"
              fill="#0F172A">
              {landmark.emoji}
            </SvgText>
            {selectedZoneId ? (
              <LandmarkNamePill
                x={point.x}
                y={point.y}
                label={landmarkName(landmark, language)}
              />
            ) : null}
          </G>
        ))}
      </Svg>
    </View>
  );
}
