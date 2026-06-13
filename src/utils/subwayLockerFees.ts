import type { LockerFeeGroup, LockerSize, SubwayLockerStation } from '../types/subwayLocker';
import type { LUGGAGE_STORAGE_COPY } from '../constants/luggageStorage';

type Copy = (typeof LUGGAGE_STORAGE_COPY)['ko'];

const SIZE_ORDER: LockerSize[] = ['extraLarge', 'large', 'medium', 'small'];

export type LockerInventoryRow = {
  size: LockerSize;
  count: number;
  amount: number | null;
  unit: string;
};

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

export function buildLockerInventoryRows(
  station: SubwayLockerStation,
  feeGroup: LockerFeeGroup,
): LockerInventoryRow[] {
  const countBySize: Record<LockerSize, number> = {
    extraLarge: station.lockers.extraLarge,
    large: station.lockers.large,
    medium: station.lockers.medium,
    small: station.lockers.small,
  };
  const feeBySize = Object.fromEntries(feeGroup.items.map(item => [item.size, item]));

  return SIZE_ORDER.filter(size => countBySize[size] > 0).map(size => ({
    size,
    count: countBySize[size],
    amount: feeBySize[size]?.amount ?? null,
    unit: feeBySize[size]?.unit ?? '',
  }));
}

export function formatLockerPrice(
  amount: number | null,
  unit: string,
  copy: Copy,
): string {
  if (amount == null) {
    return '-';
  }
  const unitSuffix = unit === '3시간당' ? copy.feePer3Hours : '';
  return `${amount.toLocaleString()}${copy.feeCurrency}${unitSuffix}`;
}
