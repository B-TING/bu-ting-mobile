import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import {
  BUSAN_MAP_VIEWBOX,
  EVENT_ZONES,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import type { EventZoneId } from '../../types/eventZone';
import { projectLatLngToMapPoint } from '../../utils/eventZone/zoneResolver';

type BusanZoneMapProps = {
  selectedZoneId: EventZoneId | null;
  currentZoneId: EventZoneId | null;
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
    return `${baseColor}CC`;
  }
  return `${baseColor}66`;
}

export function BusanZoneMap({
  selectedZoneId,
  currentZoneId,
  language,
  onZonePress,
}: BusanZoneMapProps) {
  const activeZoneId = selectedZoneId ?? currentZoneId;
  const activeZone = EVENT_ZONES.find(zone => zone.id === activeZoneId) ?? null;

  const landmarkPoints = useMemo(() => {
    if (!activeZone) {
      return [];
    }
    return activeZone.landmarks.map(landmark => ({
      landmark,
      point: projectLatLngToMapPoint(landmark.location),
    }));
  }, [activeZone]);

  return (
    <View className="overflow-hidden rounded-3xl border border-brand-border bg-[#0F172A]">
      <Svg
        width="100%"
        height={280}
        viewBox={`0 0 ${BUSAN_MAP_VIEWBOX.width} ${BUSAN_MAP_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet">
        <Path
          d="M 24 420 Q 180 460 336 420 L 356 480 L 4 480 Z"
          fill="#1E293B"
        />

        {EVENT_ZONES.map(zone => {
          const isSelected = selectedZoneId === zone.id;
          const isCurrent = currentZoneId === zone.id;
          return (
            <G key={zone.id}>
              <Path
                d={zone.svgPath}
                fill={zoneFill(zone.id, zone.baseColor, selectedZoneId, currentZoneId)}
                stroke={isSelected ? '#F8FAFC' : isCurrent ? '#FDE047' : '#334155'}
                strokeWidth={isSelected ? 3 : isCurrent ? 2.5 : 1}
                onPress={() => onZonePress(zone.id)}
              />
            </G>
          );
        })}

        {landmarkPoints.map(({ landmark, point }) => (
          <G key={landmark.id}>
            <Circle cx={point.x} cy={point.y} r={14} fill="#0F172A" opacity={0.72} />
            <Circle cx={point.x} cy={point.y} r={10} fill="#FFFFFF" />
            <SvgText
              x={point.x}
              y={point.y + 4}
              fontSize={11}
              textAnchor="middle"
              fill="#0F172A">
              {landmark.emoji}
            </SvgText>
            <SvgText
              x={point.x}
              y={point.y + 24}
              fontSize={9}
              textAnchor="middle"
              fill="#E2E8F0">
              {landmarkName(landmark, language).slice(0, 8)}
            </SvgText>
          </G>
        ))}
      </Svg>

      <View className="absolute bottom-3 left-3 right-3 flex-row flex-wrap gap-2">
        {EVENT_ZONES.map(zone => {
          const active = selectedZoneId === zone.id || currentZoneId === zone.id;
          return (
            <Pressable
              key={zone.id}
              accessibilityRole="button"
              onPress={() => onZonePress(zone.id)}
              className={`rounded-full px-2.5 py-1 ${active ? 'bg-white' : 'bg-white/20'}`}>
              <Text
                className={`text-[11px] ${active ? 'font-bold text-slate-900' : 'font-medium text-white'}`}>
                {language === 'ko' ? zone.nameKo : zone.nameEn}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
