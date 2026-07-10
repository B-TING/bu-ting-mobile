import { View } from 'react-native';

type PlanSyncStatusDotProps = {
  offline: boolean;
};

/** API 일정 동기화 상태 — 오프라인: 빨강, 동기화됨: 녹색 */
export function PlanSyncStatusDot({ offline }: PlanSyncStatusDotProps) {
  return (
    <View
      accessibilityLabel={offline ? '오프라인 상태' : '동기화됨'}
      className="h-2.5 w-2.5 rounded-full border border-white"
      style={{ backgroundColor: offline ? '#EF4444' : '#22C55E' }}
    />
  );
}
