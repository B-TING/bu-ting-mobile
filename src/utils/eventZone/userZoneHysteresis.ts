import type { EventZoneId } from '../../types/eventZone';

const SWITCH_CONFIRMATIONS = 2;

let committed: EventZoneId | null | undefined;
let pending: EventZoneId | null | undefined;
let pendingCount = 0;
let lastSampleKey: string | null = null;

export function peekCommittedUserZone(): EventZoneId | null {
  return committed === undefined ? null : committed;
}

export function resetUserZoneHysteresis(): void {
  committed = undefined;
  pending = undefined;
  pendingCount = 0;
  lastSampleKey = null;
}

/**
 * 존 전환은 연속 2샘플. 첫 확정은 즉시.
 * 같은 sampleKey는 여러 훅이 호출해도 한 번만 센다.
 */
export function confirmUserZone(
  next: EventZoneId | null,
  sampleKey: string,
): EventZoneId | null {
  if (sampleKey === lastSampleKey) {
    return committed === undefined ? next : committed;
  }
  lastSampleKey = sampleKey;

  if (committed === undefined) {
    committed = next;
    pending = next;
    pendingCount = 0;
    return committed;
  }

  if (next === committed) {
    pending = next;
    pendingCount = 0;
    return committed;
  }

  if (pending === next) {
    pendingCount += 1;
  } else {
    pending = next;
    pendingCount = 1;
  }

  if (pendingCount >= SWITCH_CONFIRMATIONS) {
    committed = next;
    pendingCount = 0;
  }

  return committed;
}
