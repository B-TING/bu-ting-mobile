import { memo } from 'react';
import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  BUSAN_DISTRICT_BY_ID,
  EVENT_ZONE_DISTRICT_IDS,
} from '../../constants/eventZone/busanMapPaths';
import {
  EVENT_ZONES,
  EVENT_ZONE_BY_ID,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import { PRETENDARD } from '../../constants/fonts/pretendard';
import type { EventZoneId } from '../../types/eventZone';
import type { AppLanguage } from '../../types/user';
import { resolveLandmarkMapPoint } from '../../utils/eventZone/landmarkMapPoint';

const EVENT_GLOW_COLOR = '#E91E63';

const SELECTED_ZONE_GLOW = [
  { strokeWidth: 12, opacity: 0.22 },
  { strokeWidth: 7, opacity: 0.38 },
] as const;

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

type DistrictLayerProps = {
  selectedZoneId: EventZoneId | null;
  currentZoneId: EventZoneId | null;
  eventZoneIds: readonly EventZoneId[];
  onZonePress: (zoneId: EventZoneId) => void;
};

export const DistrictLayer = memo(function DistrictLayer({
  selectedZoneId,
  currentZoneId,
  eventZoneIds,
  onZonePress,
}: DistrictLayerProps) {
  const hasEvent = (zoneId: EventZoneId) => eventZoneIds.includes(zoneId);

  return (
    <G>
      {EVENT_ZONES.map(zone =>
        EVENT_ZONE_DISTRICT_IDS[zone.id].map(districtId => {
          const district = BUSAN_DISTRICT_BY_ID[districtId];
          if (!district || selectedZoneId === zone.id) {
            return null;
          }
          const stroke = zoneStroke(zone.id, selectedZoneId, currentZoneId);
          const eventActive = hasEvent(zone.id);
          return (
            <Path
              key={`${zone.id}-${districtId}`}
              d={district.d}
              fill={zoneFill(zone.id, zone.baseColor, selectedZoneId, currentZoneId)}
              stroke={eventActive ? EVENT_GLOW_COLOR : stroke.color}
              strokeWidth={eventActive ? 3 : stroke.width}
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
            const eventActive = hasEvent(zone.id);
            return [
              ...glowLayers,
              <Path
                key={`selected-${districtId}`}
                d={district.d}
                fill={zoneFill(zone.id, zone.baseColor, selectedZoneId, currentZoneId)}
                stroke={eventActive ? EVENT_GLOW_COLOR : stroke.color}
                strokeWidth={eventActive ? 3 : stroke.width}
                strokeLinejoin="round"
                onPress={() => onZonePress(zone.id)}
              />,
            ];
          })
        : null}
    </G>
  );
});

type LandmarkLayerProps = {
  selectedZoneId: EventZoneId | null;
  language: AppLanguage;
};

function LandmarkNamePill({
  x,
  y,
  label,
}: {
  x: number;
  y: number;
  label: string;
}) {
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
        fontFamily={PRETENDARD.semibold}
        textAnchor="middle"
        fill="#0F172A">
        {text}
      </SvgText>
    </>
  );
}

export const LandmarkLayer = memo(function LandmarkLayer({
  selectedZoneId,
  language,
}: LandmarkLayerProps) {
  const zones =
    selectedZoneId != null
      ? EVENT_ZONES.filter(zone => zone.id === selectedZoneId)
      : EVENT_ZONES;

  return (
    <G>
      {zones.flatMap(zone =>
        zone.landmarks.map(landmark => {
          const point = resolveLandmarkMapPoint(landmark);
          return (
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
                fontFamily={PRETENDARD.regular}
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
          );
        }),
      )}
    </G>
  );
});

type CompactDistrictLayerProps = {
  highlightedZoneId: EventZoneId;
};

function compactFill(
  zoneId: EventZoneId,
  baseColor: string,
  highlightedZoneId: EventZoneId,
): string {
  if (highlightedZoneId === zoneId) {
    return `${baseColor}DD`;
  }
  return `${baseColor}55`;
}

function compactStroke(
  zoneId: EventZoneId,
  highlightedZoneId: EventZoneId,
): { color: string; width: number } {
  if (highlightedZoneId === zoneId) {
    return { color: '#EAB308', width: 2.5 };
  }
  return { color: '#FFFFFF', width: 1.5 };
}

export const CompactDistrictLayer = memo(function CompactDistrictLayer({
  highlightedZoneId,
}: CompactDistrictLayerProps) {
  return (
    <G>
      {EVENT_ZONES.map(zone =>
        EVENT_ZONE_DISTRICT_IDS[zone.id].map(districtId => {
          const district = BUSAN_DISTRICT_BY_ID[districtId];
          if (!district) {
            return null;
          }
          const stroke = compactStroke(zone.id, highlightedZoneId);
          return (
            <Path
              key={`${zone.id}-${districtId}`}
              d={district.d}
              fill={compactFill(zone.id, zone.baseColor, highlightedZoneId)}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinejoin="round"
            />
          );
        }),
      )}
    </G>
  );
});
