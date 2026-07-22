import { View } from 'react-native';

import { GUIDE_TARGET } from '../guide/guideTypes';
import { GuideTarget } from '../guide/GuideTarget';

type PlanSyncStatusDotProps = {
  offline: boolean;
};

/** API 일정 동기화 상태 — 오프라인: 빨강, 동기화됨: 녹색 */
export function PlanSyncStatusDot({ offline }: PlanSyncStatusDotProps) {
  return (
    <GuideTarget id={GUIDE_TARGET.syncDot} className="items-center justify-center p-1">
      <View
        accessibilityLabel={offline ? '오프라인 상태' : '동기화됨'}
        className="h-2.5 w-2.5 rounded-full border border-white"
        style={{ backgroundColor: offline ? '#EF4444' : '#22C55E' }}
      />
    </GuideTarget>
  );
}
