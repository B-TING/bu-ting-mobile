import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import type { LUGGAGE_STORAGE_COPY } from '../../constants/luggageStorage';
import type { SubwayLockerStation } from '../../types/subwayLocker';
import {
  feeScheduleLabel,
  formatLockerFeeLine,
  sortedFeeItems,
} from '../../utils/subwayLockerFees';
import { AppModal, AppModalActions } from '../shared/modals';

type Copy = (typeof LUGGAGE_STORAGE_COPY)['ko'];

const SHEET_HEIGHT_RATIO = 0.55;

type SubwayLockerDetailSheetProps = {
  visible: boolean;
  station: SubwayLockerStation | null;
  copy: Copy;
  onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) {
    return null;
  }
  return (
    <View className="mt-3 flex-row">
      <Text className="w-20 text-xs font-bold text-brand-muted">{label}</Text>
      <Text className="flex-1 text-sm leading-5 text-brand-text">{value}</Text>
    </View>
  );
}

function SizeChip({ label, count }: { label: string; count: number }) {
  if (count <= 0) {
    return null;
  }
  return (
    <View className="rounded-xl border border-brand-border bg-brand-surface px-3 py-2">
      <Text className="text-[10px] font-semibold text-brand-muted">{label}</Text>
      <Text className="mt-0.5 text-lg font-bold text-brand-primary">{count}</Text>
    </View>
  );
}

export function SubwayLockerDetailSheet({
  visible,
  station,
  copy,
  onClose,
}: SubwayLockerDetailSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  if (!station) {
    return null;
  }

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      maxHeight={sheetMaxHeight}
      closeAccessibilityLabel={copy.close}
      footer={
        <AppModalActions
          className="mt-2"
          actions={[{ label: copy.close, onPress: onClose, variant: 'primary' }]}
        />
      }>
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold text-brand-text">{station.name}</Text>
          <View className="rounded-full bg-brand-selected px-2.5 py-1">
            <Text className="text-[10px] font-semibold text-brand-primary">
              {copy.lineLabel(station.line)}
            </Text>
          </View>
        </View>

        <Text className="mt-1 text-sm text-brand-muted">
          {copy.totalLockers}: {station.lockers.total}
        </Text>

        <DetailRow label={copy.locationDetailLabel} value={station.locationDetail} />

        <View className="mt-4 flex-row flex-wrap gap-2">
          <SizeChip label={copy.sizeExtraLarge} count={station.lockers.extraLarge} />
          <SizeChip label={copy.sizeLarge} count={station.lockers.large} />
          <SizeChip label={copy.sizeMedium} count={station.lockers.medium} />
          <SizeChip label={copy.sizeSmall} count={station.lockers.small} />
        </View>

        <DetailRow label={copy.companyLabel} value={station.company} />

        {station.fees.length > 0 ? (
          <View className="mt-4">
            <Text className="text-xs font-bold text-brand-muted">{copy.costLabel}</Text>
            {station.fees.map(group => (
              <View
                key={group.schedule}
                className="mt-2 rounded-xl border border-brand-border bg-brand-surface p-3">
                {station.fees.length > 1 ? (
                  <Text className="mb-1 text-xs font-bold text-brand-primary">
                    {feeScheduleLabel(group.schedule, copy)}
                  </Text>
                ) : null}
                {sortedFeeItems(group.items).map(item => (
                  <Text key={`${group.schedule}-${item.size}`} className="mt-1 text-sm text-brand-text">
                    · {formatLockerFeeLine(item.size, item.amount, item.unit, copy)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </AppModal>
  );
}
