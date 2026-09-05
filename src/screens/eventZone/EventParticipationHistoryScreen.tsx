import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventHistoryCard } from '../../components/eventZone/EventHistoryCard';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import { EVENT_ZONE_BY_ID, eventZoneName } from '../../constants/eventZone/eventZone';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useEventParticipationStore } from '../../stores';
import { sortParticipationRecordsNewestFirst } from '../../stores/useEventParticipationStore';
import {
  formatParticipationTimestamp,
  participationStatusLabel,
} from '../../utils/eventZone/participationLabels';
import type { EventParticipationStatus } from '../../types/eventParticipation';

type Props = NativeStackScreenProps<RootStackParamList, 'EventParticipationHistory'>;

function resultToneForStatus(
  status: EventParticipationStatus,
): 'primary' | 'warning' | 'danger' | 'muted' {
  if (status === 'approved') return 'primary';
  if (status === 'rejected') return 'danger';
  if (status === 'pending_review') return 'warning';
  return 'muted';
}

export function EventParticipationHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const rawRecords = useEventParticipationStore(s => s.records);
  const records = useMemo(
    () => sortParticipationRecordsNewestFirst(rawRecords),
    [rawRecords],
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingTop: insets.top }}>
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={copy.historyTitle}
          onBack={() => navigation.goBack()}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          rightAccessory={undefined}
        />
      </View>

      {records.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm leading-relaxed text-[#64748B]">
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
          {records.map(record => {
            const zone = EVENT_ZONE_BY_ID[record.zoneId];
            if (!zone) return null;
            const statusLabel = participationStatusLabel(record.status, copy);
            const typeLabel =
              record.eventType === 'PLACE_AUTH' ? copy.typePlaceAuth : copy.typeObjectSight;
            const timestamp = formatParticipationTimestamp(
              record.submittedAt ?? record.createdAt,
              language,
            );
            const timestampLabel = timestamp
              ? record.submittedAt
                ? copy.historySubmittedAt(timestamp)
                : copy.historyStartedAt(timestamp)
              : undefined;

            return (
              <EventHistoryCard
                key={record.id}
                title={record.eventTitleKo}
                zoneName={eventZoneName(zone, language)}
                result={typeLabel}
                status={record.status}
                statusLabel={statusLabel}
                timestamp={timestampLabel}
                resultTone={resultToneForStatus(record.status)}
                onPress={() =>
                  navigation.navigate('EventGameDetail', { eventId: record.eventId })
                }
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
