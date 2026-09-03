import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import {
  EVENT_ZONE_BY_ID,
  eventZoneName,
} from '../../constants/eventZone/eventZone';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useEventParticipationStore } from '../../stores';
import type { EventParticipationRecord } from '../../types/eventParticipation';
import {
  formatParticipationTimestamp,
  participationStatusLabel,
  PARTICIPATION_STATUS_STYLES,
} from '../../utils/eventZone/participationLabels';

type Props = NativeStackScreenProps<RootStackParamList, 'EventParticipationHistory'>;

type HistoryRowProps = {
  record: EventParticipationRecord;
  language: ReturnType<typeof useAppLanguage>;
  copy: ReturnType<typeof useCopy<'eventGame'>>;
  onPress: () => void;
};

function HistoryRow({ record, language, copy, onPress }: HistoryRowProps) {
  const zone = EVENT_ZONE_BY_ID[record.zoneId];
  const statusStyle = PARTICIPATION_STATUS_STYLES[record.status];
  const statusText = participationStatusLabel(record.status, copy);
  const typeLabel =
    record.eventType === 'place_auth' ? copy.typePlaceAuth : copy.typeObjectSight;
  const timestamp = formatParticipationTimestamp(
    record.submittedAt ?? record.createdAt,
    language,
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4 active:opacity-90">
      {record.localImageUri ? (
        <Image
          source={{ uri: record.localImageUri }}
          className="h-16 w-16 rounded-xl bg-brand-background"
          resizeMode="cover"
        />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-xl bg-brand-background">
          <AppIcon name="camera" size={22} color="#94A3B8" />
        </View>
      )}

      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: statusStyle.backgroundColor }}>
            <Text
              className="text-[10px] font-bold"
              style={{ color: statusStyle.textColor }}>
              {statusText}
            </Text>
          </View>
          <View className="rounded-full bg-pink-50 px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-pink-700">{typeLabel}</Text>
          </View>
        </View>

        <Text className="mt-2 text-[15px] font-bold text-brand-text" numberOfLines={1}>
          {record.eventTitleKo}
        </Text>
        <Text className="mt-0.5 text-xs text-brand-muted" numberOfLines={1}>
          {eventZoneName(zone, language)}
        </Text>
        {timestamp ? (
          <Text className="mt-1.5 text-[11px] text-brand-muted">
            {record.submittedAt
              ? copy.historySubmittedAt(timestamp)
              : copy.historyStartedAt(timestamp)}
          </Text>
        ) : null}
      </View>

      <AppIcon name="chevronRight" size={18} color="#94A3B8" />
    </Pressable>
  );
}

export function EventParticipationHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const records = useEventParticipationStore(s => s.listAll());

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text">{copy.historyTitle}</Text>
      </View>

      {records.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm leading-relaxed text-brand-muted">
            {copy.historyEmpty}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}>
          {records.map(record => (
            <HistoryRow
              key={record.id}
              record={record}
              language={language}
              copy={copy}
              onPress={() =>
                navigation.navigate('EventGameDetail', { eventId: record.eventId })
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
