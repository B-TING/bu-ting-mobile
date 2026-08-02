import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY, ICON_COLOR_WHITE } from '../../constants/icons';
import type { TravelRecord, TravelRecordStatus } from '../../types/travelReview';
import { travelRecordThumbnailIcon } from '../../utils/review/travelReview';
import { AppIcon } from '../shared/icons/AppIcon';
import { ResolvedRemoteImage } from '../shared/media/ResolvedRemoteImage';

const H_PAD = 20;
const GAP = 8;
const COLS = 3;
const RADIUS = 16;

type MyTravelRecordGridProps = {
  records: TravelRecord[];
  statusLabels: Record<TravelRecordStatus, string>;
  onPressRecord: (travelRecordId: string) => void;
};

function statusBadgeClass(status: TravelRecordStatus): string {
  if (status === 'PUBLISHED') {
    return 'bg-brand-primary';
  }
  if (status === 'HIDDEN') {
    return 'bg-brand-muted';
  }
  return 'bg-amber-500';
}

export function MyTravelRecordGrid({
  records,
  statusLabels,
  onPressRecord,
}: MyTravelRecordGridProps) {
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - H_PAD * 2 - GAP * (COLS - 1)) / COLS);

  return (
    <View className="flex-row flex-wrap px-5" style={{ gap: GAP }}>
      {records.map(record => {
        const icon = travelRecordThumbnailIcon(record);
        const cover = record.coverImageUrl;

        return (
          <Pressable
            key={record.travelRecordId}
            onPress={() => onPressRecord(record.travelRecordId)}
            style={{ width: cell, height: cell, borderRadius: RADIUS }}
            className="overflow-hidden bg-brand-selected active:opacity-85"
            accessibilityRole="button">
            {cover && !cover.startsWith('local://') ? (
              <ResolvedRemoteImage
                uri={cover}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-brand-selected">
                <AppIcon name={icon} size={28} color={ICON_COLOR_PRIMARY} />
              </View>
            )}
            {record.status !== 'PUBLISHED' ? (
              <View
                className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 ${statusBadgeClass(record.status)}`}>
                <Text className="text-[9px] font-bold text-white">
                  {statusLabels[record.status]}
                </Text>
              </View>
            ) : null}
            <View className="absolute bottom-1.5 right-1.5 flex-row items-center gap-0.5">
              <AppIcon name="heart" size={10} color={ICON_COLOR_WHITE} filled />
              <Text className="text-[10px] font-bold text-white">{record.likeCount}</Text>
            </View>
            {!cover || cover.startsWith('local://') ? (
              <View className="absolute inset-x-1 bottom-5">
                <Text className="text-center text-[10px] font-semibold text-brand-muted" numberOfLines={2}>
                  {record.title || '—'}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

type EmptyGridProps = {
  title: string;
  subtitle: string;
};

export function MyTravelRecordGridEmpty({ title, subtitle }: EmptyGridProps) {
  return (
    <View className="items-center px-8 py-12">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full border border-brand-border">
        <AppIcon name="map" size={28} color={ICON_COLOR_MUTED} />
      </View>
      <Text className="mb-2 text-base font-bold text-brand-text">{title}</Text>
      <Text className="text-center text-sm leading-5 text-brand-muted">{subtitle}</Text>
    </View>
  );
}
