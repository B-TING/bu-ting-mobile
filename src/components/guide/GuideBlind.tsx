import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GuideSpotlight } from './GuideSpotlight';
import { GuideTooltip } from './GuideTooltip';
import type { GuideRect } from './guideTypes';

type GuideBlindProps = {
  rect: GuideRect | null;
  title: string;
  description: string;
  /** Next / Skip 등 터치 허용 컨트롤 (블라인드 위에 렌더) */
  controls: ReactNode;
};

/**
 * 전면 터치 차단 블라인드.
 * 하이라이트 cutout은 시각만 — 구멍으로도 터치 통과 금지.
 * `controls`만 형제로서 위에 올라가 터치 가능.
 */
export function GuideBlind({ rect, title, description, controls }: GuideBlindProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={() => undefined}
        style={StyleSheet.absoluteFill}
      />
      <GuideSpotlight rect={rect} />
      <GuideTooltip title={title} description={description} targetRect={rect} />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {controls}
      </View>
    </View>
  );
}
