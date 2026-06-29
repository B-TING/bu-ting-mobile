import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** tailwind `brand.background` */
const MAP_EDGE_FADE_COLOR = '#F8FAFC';

type MapEdgeFadeOverlayProps = {
  /** 각 변 페이드 밴드 크기 (0–1, 컨테이너 대비) */
  fadeRatio?: number;
};

export function MapEdgeFadeOverlay({ fadeRatio = 0.24 }: MapEdgeFadeOverlayProps) {
  const band = `${Math.round(fadeRatio * 100)}%`;
  const sideBand = `${Math.round(fadeRatio * 0.9 * 100)}%`;
  const bottomY = `${Math.round((1 - fadeRatio) * 100)}%`;
  const rightX = `${Math.round((1 - fadeRatio * 0.9) * 100)}%`;

  return (
    <View className="pointer-events-none absolute inset-0" accessibilityElementsHidden>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="mapFadeTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={1} />
            <Stop offset="0.55" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0.35} />
            <Stop offset="1" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="mapFadeBottom" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={1} />
            <Stop offset="0.55" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0.35} />
            <Stop offset="1" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="mapFadeLeft" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={1} />
            <Stop offset="0.6" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0.3} />
            <Stop offset="1" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="mapFadeRight" x1="1" y1="0" x2="0" y2="0">
            <Stop offset="0" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0.85} />
            <Stop offset="0.5" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0.25} />
            <Stop offset="1" stopColor={MAP_EDGE_FADE_COLOR} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height={band} fill="url(#mapFadeTop)" />
        <Rect x="0" y={bottomY} width="100%" height={band} fill="url(#mapFadeBottom)" />
        <Rect x="0" y="0" width={sideBand} height="100%" fill="url(#mapFadeLeft)" />
        <Rect x={rightX} y="0" width={sideBand} height="100%" fill="url(#mapFadeRight)" />
      </Svg>
    </View>
  );
}
