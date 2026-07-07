import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import type { CopyFor } from '../../i18n';
import type { LockerFeeGroup, SubwayLockerStation } from '../../types/subwayLocker';
import {
  buildLockerInventoryRows,
  feeScheduleLabel,
  formatLockerPrice,
  lockerSizeLabel,
} from '../../utils/locker/subwayLockerFees';

type Copy = CopyFor<'luggageStorage'>;

type LockerInventoryTableProps = {
  station: SubwayLockerStation;
  feeGroup: LockerFeeGroup;
  copy: Copy;
  showScheduleLabel?: boolean;
};

function TableCell({
  children,
  className = '',
  header = false,
}: {
  children: ReactNode;
  className?: string;
  header?: boolean;
}) {
  return (
    <View className={`flex-1 px-2 py-2 ${className}`}>
      <Text
        className={`text-center ${header ? 'text-xs font-bold text-brand-muted' : 'text-sm text-brand-text'}`}>
        {children}
      </Text>
    </View>
  );
}

export function LockerInventoryTable({
  station,
  feeGroup,
  copy,
  showScheduleLabel = false,
}: LockerInventoryTableProps) {
  const rows = buildLockerInventoryRows(station, feeGroup);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View className="mt-2 overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
      {showScheduleLabel ? (
        <View className="border-b border-brand-border bg-brand-selected px-3 py-2">
          <Text className="text-xs font-bold text-brand-primary">
            {feeScheduleLabel(feeGroup.schedule, copy)}
          </Text>
        </View>
      ) : null}

      <View className="flex-row border-b border-brand-border bg-brand-background">
        <TableCell header>{copy.lockerTableType}</TableCell>
        <TableCell header>{copy.lockerTableCount}</TableCell>
        <TableCell header>{copy.lockerTablePrice}</TableCell>
      </View>

      {rows.map((row, index) => (
        <View
          key={row.size}
          className={`flex-row ${index < rows.length - 1 ? 'border-b border-brand-border' : ''}`}>
          <TableCell>{lockerSizeLabel(row.size, copy)}</TableCell>
          <TableCell>{row.count}</TableCell>
          <TableCell>{formatLockerPrice(row.amount, row.unit, copy)}</TableCell>
        </View>
      ))}
    </View>
  );
}
