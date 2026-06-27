import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  BUSAN_DISTRICT_BY_ID,
  BUSAN_SVG_VIEWBOX,
  EVENT_ZONE_DISTRICT_IDS,
} from '../../constants/eventZone/busanMapPaths';
import { EVENT_ZONES, landmarkName } from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import type { EventZoneChatRoom, EventZoneId } from '../../types/eventZone';
import { resolveLandmarkMapPoint } from '../../utils/eventZone/landmarkMapPoint';
import {
  focusRectToViewBox,
  interpolateFocusRect,
  resolveMapFocusRect,
  type MapFocusRect,
} from '../../utils/eventZone/zoneMapFocus';
import { EventZoneZoneSelectList } from './EventZoneSections';

const FOCUS_ANIMATION_MS = 480;

type BusanZoneMapProps = {
  selectedZoneId: EventZoneId | null;
  currentZoneId: EventZoneId;
  language: AppLanguage;
  onZonePress: (zoneId: EventZoneId) => void;
  zoneRooms: EventZoneChatRoom[];
  onEnterChat: () => void;
  zoneSelectCopy: {
    selectZoneTitle: string;
    liveBadge: string;
    memberCountLabel: (n: number) => string;
    enterLabel: string;
    currentZoneLabel: string;
  };
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
    return { color: '#0F172A', width: 3 };
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
  zoneRooms,
  onEnterChat,
  zoneSelectCopy,
}: BusanZoneMapProps) {
  const focusProgress = useRef(new Animated.Value(1)).current;
  const currentFocusRef = useRef<MapFocusRect>(resolveMapFocusRect(null));
  const [viewBox, setViewBox] = useState(focusRectToViewBox(resolveMapFocusRect(null)));

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

  useEffect(() => {
    const from = currentFocusRef.current;
    const to = resolveMapFocusRect(selectedZoneId);

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
      const next = interpolateFocusRect(from, to, value);
      currentFocusRef.current = next;
      setViewBox(focusRectToViewBox(next));
    });

    Animated.timing(focusProgress, {
      toValue: 1,
      duration: FOCUS_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        currentFocusRef.current = to;
        setViewBox(focusRectToViewBox(to));
      }
    });

    return () => {
      focusProgress.removeListener(listenerId);
    };
  }, [focusProgress, selectedZoneId]);

  return (
    <View className="overflow-hidden rounded-3xl border border-brand-border bg-[#EAEAEA]">
      <View style={{ aspectRatio: BUSAN_SVG_VIEWBOX.width / BUSAN_SVG_VIEWBOX.height }}>
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
                r={16}
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth={2}
              />
              <SvgText
                x={point.x}
                y={point.y + 5}
                fontSize={14}
                textAnchor="middle"
                fill="#0F172A">
                {landmark.emoji}
              </SvgText>
              <SvgText
                x={point.x}
                y={point.y + 28}
                fontSize={11}
                fontWeight="600"
                textAnchor="middle"
                fill="#0F172A">
                {landmarkName(landmark, language).slice(0, 10)}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>

      <EventZoneZoneSelectList
        rooms={zoneRooms}
        language={language}
        title={zoneSelectCopy.selectZoneTitle}
        liveBadge={zoneSelectCopy.liveBadge}
        memberCountLabel={zoneSelectCopy.memberCountLabel}
        enterLabel={zoneSelectCopy.enterLabel}
        currentZoneLabel={zoneSelectCopy.currentZoneLabel}
        selectedZoneId={selectedZoneId}
        currentZoneId={currentZoneId}
        onSelectZone={onZonePress}
        onEnterChat={onEnterChat}
      />
    </View>
  );
}
