import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusanZoneMap } from '../../components/eventZone/BusanZoneMap';
import {
  EventZoneChatRoomList,
  EventZoneLandmarkList,
} from '../../components/eventZone/EventZoneSections';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  EVENT_ZONE_BY_ID,
  EVENT_ZONE_COPY,
  chatRoomsForZone,
  eventZoneName,
  eventZoneSummary,
} from '../../constants/eventZone/eventZone';
import { useCurrentEventZone } from '../../hooks/useCurrentEventZone';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';
import type { EventZoneId } from '../../types/eventZone';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZone'>;

export function EventZoneScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = EVENT_ZONE_COPY[language];
  const { zoneId: currentZoneId, usedFallback } = useCurrentEventZone();
  const [selectedZoneId, setSelectedZoneId] = useState<EventZoneId | null>(null);

  const activeZoneId = selectedZoneId ?? currentZoneId;
  const activeZone = EVENT_ZONE_BY_ID[activeZoneId];
  const chatRooms = useMemo(() => chatRoomsForZone(activeZoneId), [activeZoneId]);

  return (
    <View
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold text-brand-text">{copy.screenTitle}</Text>
            <View className="rounded-full bg-violet-100 px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-violet-700">
                {copy.planningBadge}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-brand-muted">{copy.mapHint}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-8"
        showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl border border-brand-border bg-brand-surface p-4">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {copy.currentZoneLabel}
          </Text>
          <Text className="text-xl font-bold text-brand-text">
            {eventZoneName(EVENT_ZONE_BY_ID[currentZoneId], language)}
          </Text>
          <Text className="mt-1 text-sm text-brand-muted">
            {eventZoneSummary(EVENT_ZONE_BY_ID[currentZoneId], language)}
          </Text>
          {usedFallback ? (
            <Text className="mt-2 text-xs text-amber-700">{copy.locationFallbackHint}</Text>
          ) : null}
        </View>

        <BusanZoneMap
          selectedZoneId={selectedZoneId}
          currentZoneId={currentZoneId}
          language={language}
          onZonePress={zoneId => {
            setSelectedZoneId(prev => (prev === zoneId ? null : zoneId));
          }}
        />

        {activeZone ? (
          <>
            <EventZoneLandmarkList
              zone={activeZone}
              language={language}
              title={copy.landmarksTitle}
            />
            <EventZoneChatRoomList
              zone={activeZone}
              rooms={chatRooms}
              language={language}
              title={copy.chatRoomsTitle}
              liveBadge={copy.chatLiveBadge}
              memberCountLabel={copy.chatMemberCount}
              featureHintLabel={copy.chatFeatureHint}
              enterLabel={copy.enterChat}
              onPressRoom={roomId =>
                navigation.navigate('EventZoneChat', { roomId })
              }
            />
          </>
        ) : (
          <View className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-6">
            <Text className="text-center text-sm text-brand-muted">{copy.selectZoneHint}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
