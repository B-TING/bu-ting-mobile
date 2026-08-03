import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import type { CopyFor } from '../../i18n';
import type { SubwayLockerStation } from '../../types/subwayLocker';
import {
  ICON_COLOR_STAR_EMPTY,
} from '../../constants/icons';
import {
  getSubwayLineColor,
  getSubwayLineTint,
} from '../../constants/locker/subwayLineColors';
import { AppIcon } from '../shared/icons/AppIcon';
import { AppModal, AppModalActions } from '../shared/modals';
import { LockerInventoryTable } from './LockerInventoryTable';

type Copy = CopyFor<'luggageStorage'>;

const SHEET_HEIGHT_RATIO = 0.55;

type SubwayLockerDetailSheetProps = {
  visible: boolean;
  station: SubwayLockerStation | null;
  copy: Copy;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
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

export function SubwayLockerDetailSheet({
  visible,
  station,
  copy,
  bookmarked = false,
  onToggleBookmark,
  onClose,
}: SubwayLockerDetailSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  if (!station) {
    return null;
  }

  const lineColor = getSubwayLineColor(station.line);
  const lineTint = getSubwayLineTint(station.line);

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
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Text className="text-xl font-bold text-brand-text">{station.name}</Text>
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: lineTint }}>
              <Text className="text-[10px] font-semibold" style={{ color: lineColor }}>
                {copy.lineLabel(station.line)}
              </Text>
            </View>
          </View>
          {onToggleBookmark ? (
            <Pressable
              onPress={onToggleBookmark}
              accessibilityRole="button"
              accessibilityLabel={bookmarked ? copy.unbookmark : copy.bookmark}
              className={`flex-row items-center gap-1 rounded-full px-3 py-2 active:opacity-80 ${
                bookmarked ? 'bg-amber-100' : 'bg-brand-selected'
              }`}>
              <AppIcon
                name={bookmarked ? 'mapPin' : 'star'}
                size={16}
                color={bookmarked ? '#B45309' : ICON_COLOR_STAR_EMPTY}
                filled={bookmarked}
              />
              <Text
                className={`text-xs font-bold ${
                  bookmarked ? 'text-amber-700' : 'text-brand-primary'
                }`}>
                {bookmarked ? copy.unbookmark : copy.bookmark}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text className="mt-1 text-sm text-brand-muted">
          {copy.totalLockers}: {station.lockers.total}
        </Text>

        <DetailRow label={copy.locationDetailLabel} value={station.locationDetail} />
        <DetailRow label={copy.companyLabel} value={station.company} />

        {station.fees.length > 0 ? (
          <View className="mt-4">
            <Text className="text-xs font-bold text-brand-muted">{copy.costLabel}</Text>
            {station.fees.map(group => (
              <LockerInventoryTable
                key={group.schedule}
                station={station}
                feeGroup={group}
                copy={copy}
                showScheduleLabel={station.fees.length > 1}
              />
            ))}
          </View>
        ) : station.costRaw ? (
          <DetailRow label={copy.costLabel} value={station.costRaw} />
        ) : null}
      </ScrollView>
    </AppModal>
  );
}
