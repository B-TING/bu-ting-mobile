import type { ReactNode } from 'react';

import type { MapPoint } from '../../utils/mapRegion';

type MapPinMarkerProps = {
  point: MapPoint;
  active?: boolean;
  color?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  caption?: string;
  children?: ReactNode;
};

/** 카카오맵 마커 연동 전 placeholder — 현재 미사용 */
export function MapPinMarker(_props: MapPinMarkerProps) {
  return null;
}
