import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LUGGAGE_STORAGE_COPY } from '../../constants/luggageStorage';
import type { SubwayLockerStation } from '../../types/subwayLocker';
import { LockerInventoryTable } from './LockerInventoryTable';

type Copy = (typeof LUGGAGE_STORAGE_COPY)['ko'];

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
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  if (!station) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.close} />

        <View
          style={[
            styles.sheet,
            {
              maxHeight: sheetMaxHeight,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.handle} />
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View className="flex-row items-center justify-between gap-2">
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <Text className="text-xl font-bold text-brand-text">{station.name}</Text>
                <View className="rounded-full bg-brand-selected px-2.5 py-1">
                  <Text className="text-[10px] font-semibold text-brand-primary">
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
                  <Text className="text-sm">{bookmarked ? '📌' : '☆'}</Text>
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
            ) : null}
          </ScrollView>

          <Pressable
            onPress={onClose}
            className="mx-5 mt-2 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
            <Text className="text-[15px] font-bold text-white">{copy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    zIndex: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
