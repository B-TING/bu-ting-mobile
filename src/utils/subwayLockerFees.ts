import type { LockerFeeGroup, LockerSize } from '../types/subwayLocker';
import type { LUGGAGE_STORAGE_COPY } from '../constants/luggageStorage';

type Copy = (typeof LUGGAGE_STORAGE_COPY)['ko'];

const SIZE_ORDER: LockerSize[] = ['extraLarge', 'large', 'medium', 'small'];

export function lockerSizeLabel(size: LockerSize, copy: Copy): string {
  switch (size) {
    case 'extraLarge':
      return copy.sizeExtraLarge;
    case 'large':
      return copy.sizeLarge;
    case 'medium':
      return copy.sizeMedium;
    case 'small':
      return copy.sizeSmall;
    default:
      return size;
  }
}

export function feeScheduleLabel(schedule: LockerFeeGroup['schedule'], copy: Copy): string {
  switch (schedule) {
    case 'weekday':
      return copy.feeWeekday;
    case 'weekend':
      return copy.feeWeekend;
    default:
      return copy.feeDefault;
  }
}

export function formatLockerFeeLine(
  size: LockerSize,
  amount: number,
  unit: string,
  copy: Copy,
): string {
  const sizeLabel = lockerSizeLabel(size, copy);
  const unitSuffix = unit === '3시간당' ? copy.feePer3Hours : '';
  return `${sizeLabel} ${amount.toLocaleString()}${copy.feeCurrency}${unitSuffix}`;
}

export function sortedFeeItems(items: LockerFeeGroup['items']) {
  return [...items].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
  );
}
