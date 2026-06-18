import { useMemo } from 'react';

import type { RouteItem } from '../../types/travelPlan';
import { kakaoOverlaysFromRoutes } from '../../utils/kakaoMapOverlayBuilders';
import { KakaoMapShell } from './KakaoMapShell';

type RouteMapViewProps = {
  title: string;
  subtitle: string;
  routes: RouteItem[];
  highlightItemId?: string | null;
  size?: 'compact' | 'fullscreen' | 'fill';
  onPress?: () => void;
  tapHint?: string;
  /** false면 지도 하단 타이틀 바 숨김 (상세 모달 등) */
  showFooter?: boolean;
};

export function RouteMapView({
  title,
  subtitle,
  routes,
  highlightItemId,
  size = 'compact',
  onPress,
  tapHint,
  showFooter = true,
}: RouteMapViewProps) {
  const points = routes.map(route => route.location);
  const focusPoint = highlightItemId
    ? routes.find(route => route.itemId === highlightItemId)?.location
    : undefined;
  const overlays = useMemo(
    () => kakaoOverlaysFromRoutes(routes, highlightItemId),
    [routes, highlightItemId],
  );

  return (
    <KakaoMapShell
      points={points}
      focusPoint={focusPoint}
      overlays={overlays}
      size={size}
      onPress={onPress}
      tapHint={tapHint}
      emptySubtitle={subtitle}
      footer={showFooter ? { title, subtitle } : undefined}
    />
  );
}
