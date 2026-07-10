import { useEffect, useRef } from 'react';

import { usePlanStore, selectIsPlanOfflineSync } from '../stores/usePlanStore';
import { useTransientBottomToast } from './useTransientBottomToast';

type UsePlanOfflineSyncFeedbackOptions = {
  planId: string;
  enabled: boolean;
  message: string;
};

/** 오프라인 전환 시 하단 토스트를 띄우고, 동기화 상태를 반환합니다. */
export function usePlanOfflineSyncFeedback({
  planId,
  enabled,
  message,
}: UsePlanOfflineSyncFeedbackOptions) {
  const isOffline = usePlanStore(selectIsPlanOfflineSync(planId));
  const wasOfflineRef = useRef(false);
  const { text, opacity, showToast } = useTransientBottomToast();

  useEffect(() => {
    if (!enabled || !planId) {
      wasOfflineRef.current = false;
      return;
    }

    if (isOffline && !wasOfflineRef.current) {
      showToast(message);
    }

    wasOfflineRef.current = isOffline;
  }, [enabled, isOffline, message, planId, showToast]);

  return { isOffline, toastText: text, toastOpacity: opacity };
}
