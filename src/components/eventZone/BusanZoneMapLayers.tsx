import { memo } from 'react';
import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  BUSAN_DISTRICT_BY_ID,
  BUSAN_SVG_VIEWBOX,
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

/** 선택 강조 — 선택 구 district + glow 1장 (+ dim Rect) */
const SELECT_GLOW = { strokeWidth: 8, opacity: 0.35 } as const;

function baseFill(zoneId: EventZoneId, baseColor: string, currentZoneId: EventZoneId | null): string {
  if (currentZoneId === zoneId) {
    return `${baseColor}DD`;
  }
  return `${baseColor}88`;
}

function baseStroke(
  zoneId: EventZoneId,
  currentZoneId: EventZoneId | null,
  eventActive: boolean,
): { color: string; width: number } {
  if (eventActive) {
    return { color: EVENT_GLOW_COLOR, width: 3 };
  }
  if (currentZoneId === zoneId) {
    return { color: '#EAB308', width: 2.5 };
  }
  return { color: '#FFFFFF', width: 2 };
}

type BaseDistrictLayerProps = {
  currentZoneId: EventZoneId | null;
  eventZoneIds: readonly EventZoneId[];
  onZonePress: (zoneId: EventZoneId) => void;
};

/**
 * 선택과 무관한 고정 Path 트리.
 * selectedZoneId 가 바뀌어도 리렌더되지 않아 줌 중 SVG 재레이아웃을 막는다.
 */
export const BaseDistrictLayer = memo(function BaseDistrictLayer({
  currentZoneId,
  eventZoneIds,
  onZonePress,
}: BaseDistrictLayerProps) {
  const eventSet = new Set(eventZoneIds);

  return (
    <G>
      {EVENT_ZONES.map(zone =>
        EVENT_ZONE_DISTRICT_IDS[zone.id].map(districtId => {
          const district = BUSAN_DISTRICT_BY_ID[districtId];
          if (!district) {
            return null;
          }
          const eventActive = eventSet.has(zone.id);
          const stroke = baseStroke(zone.id, currentZoneId, eventActive);
          return (
            <Path
              key={`${zone.id}-${districtId}`}
              d={district.d}
              fill={baseFill(zone.id, zone.baseColor, currentZoneId)}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinejoin="round"
              onPress={() => onZonePress(zone.id)}
            />
          );
        }),
      )}
    </G>
  );
});

type SelectionOverlayProps = {
  selectedZoneId: EventZoneId | null;
  onDismiss?: () => void;
};

/**
 * 선택 시에만 올라가는 얇은 오버레이.
 * 전체 구 Path 재페인트 없이 dim Rect + 선택 구만 덧그린다.
 * dim 탭 시 onDismiss (선택 취소).
 */
export const SelectionOverlay = memo(function SelectionOverlay({
  selectedZoneId,
  onDismiss,
}: SelectionOverlayProps) {
  if (!selectedZoneId) {
    return null;
  }

  const zone = EVENT_ZONE_BY_ID[selectedZoneId];
  if (!zone) {
    return null;
  }

  const districtIds = EVENT_ZONE_DISTRICT_IDS[selectedZoneId];

  return (
    <G>
      <Rect
        x={0}
        y={0}
        width={BUSAN_SVG_VIEWBOX.width}
        height={BUSAN_SVG_VIEWBOX.height}
        fill="#0F172A"
        fillOpacity={0.22}
        onPress={onDismiss}
      />
      {districtIds.map(districtId => {
        const district = BUSAN_DISTRICT_BY_ID[districtId];
        if (!district) {
          return null;
        }
        return (
          <G key={`sel-${districtId}`} pointerEvents="none">
            <Path
              d={district.d}
              fill="none"
              stroke={zone.baseColor}
              strokeWidth={SELECT_GLOW.strokeWidth}
              strokeOpacity={SELECT_GLOW.opacity}
              strokeLinejoin="round"
            />
            <Path
              d={district.d}
              fill={zone.baseColor}
              stroke="#0F172A"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </G>
        );
      })}
    </G>
  );
});

/** @deprecated Use BaseDistrictLayer + SelectionOverlay */
export const DistrictLayer = BaseDistrictLayer;

/** 랜드마크 마커 — 선택과 무관하게 항상 동일 트리 */
export const LandmarkLayer = memo(function LandmarkLayer() {
  return (
    <G>
      {EVENT_ZONES.flatMap(zone =>
        zone.landmarks.map(landmark => {
          const point = resolveLandmarkMapPoint(landmark);
          return (
            <G key={landmark.id}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={14}
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth={2}
              />
              <SvgText
                x={point.x}
                y={point.y + 5}
                fontSize={13}
                fontFamily={PRETENDARD.regular}
                textAnchor="middle"
                fill="#0F172A">
                {landmark.emoji}
              </SvgText>
            </G>
          );
        }),
      )}
    </G>
  );
});

type SelectionLandmarkLabelsProps = {
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

/** 선택 구역 랜드마크 이름만 — Path 트리와 분리 */
export const SelectionLandmarkLabels = memo(function SelectionLandmarkLabels({
  selectedZoneId,
  language,
}: SelectionLandmarkLabelsProps) {
  if (!selectedZoneId) {
    return null;
  }
  const zone = EVENT_ZONE_BY_ID[selectedZoneId];
  if (!zone) {
    return null;
  }

  return (
    <G pointerEvents="none">
      {zone.landmarks.map(landmark => {
        const point = resolveLandmarkMapPoint(landmark);
        return (
          <LandmarkNamePill
            key={`label-${landmark.id}`}
            x={point.x}
            y={point.y}
            label={landmarkName(landmark, language)}
          />
        );
      })}
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
