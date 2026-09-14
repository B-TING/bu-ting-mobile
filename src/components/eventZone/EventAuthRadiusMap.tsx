import { useMemo } from 'react';
import { Text, View } from 'react-native';

import type { ZoneEventAuthTarget } from '../../types/eventZone';
import { KakaoMapShell } from '../../kakaoMap';
import { kakaoOverlaysFromAuthTarget } from '../../kakaoMap/overlays/builders';

type EventAuthRadiusMapProps = {
  target: ZoneEventAuthTarget;
  title: string;
  subtitle: string;
  accentColor?: string;
};

/** 반경 원이 맵에 크게 보이도록 span 계산 (작을수록 확대) */
function cameraKmForRadius(radiusM: number): number {
  const diameterKm = (Math.max(radiusM, 30) * 2) / 1000;
  // 원 지름의 ~1.4배 시야 → 150m 반경이면 약 0.4km → 카카오 level 4
  return Math.max(0.15, Math.min(2, diameterKm * 1.4));
}

/** 이벤트 인증 타겟 + 반경을 카카오맵에 표시 */
export function EventAuthRadiusMap({
  target,
  title,
  subtitle,
  accentColor = '#0077B6',
}: EventAuthRadiusMapProps) {
  const point = useMemo(
    () => ({ lat: target.latitude, lng: target.longitude }),
    [target.latitude, target.longitude],
  );
  const overlays = useMemo(
    () =>
      kakaoOverlaysFromAuthTarget({
        targetId: target.targetId,
        lat: target.latitude,
        lng: target.longitude,
        radiusM: target.radiusM,
        label: target.placeNameKo,
        color: accentColor,
      }),
    [target, accentColor],
  );
  const cameraKmSpan = useMemo(
    () => cameraKmForRadius(target.radiusM),
    [target.radiusM],
  );

  return (
    <View className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
      <View className="px-3.5 pb-2 pt-3">
        <Text className="text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">
          {title}
        </Text>
        <Text className="mt-1 text-[13px] leading-[18px] text-[#475569]">{subtitle}</Text>
      </View>
      <View style={{ height: 200 }}>
        <KakaoMapShell
          points={[point]}
          focusPoint={point}
          overlays={overlays}
          size="fill"
          cameraKmSpan={cameraKmSpan}
          fitPointsToCamera={false}
          eventZoneToggle={false}
          showUserLocation
          emptySubtitle={subtitle}
        />
      </View>
    </View>
  );
}
