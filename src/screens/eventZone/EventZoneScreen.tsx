import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusanZoneMap } from '../../components/eventZone/BusanZoneMap';
import {
  EventZoneCurrentZoneBadge,
  EventZoneLandmarkStrip,
} from '../../components/eventZone/EventZoneSections';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  EVENT_ZONE_BY_ID,
  EVENT_ZONE_COPY,
  allZoneChatRooms,
  getChatRoomByZoneId,
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
  const zoneRooms = useMemo(() => allZoneChatRooms(), []);

  return (
    <View
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="border-b border-brand-border bg-brand-surface px-4 py-3">
        <View className="flex-row items-center">
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
        <View className="mt-2 pl-11">
          <EventZoneCurrentZoneBadge
            zone={EVENT_ZONE_BY_ID[currentZoneId]}
            language={language}
            label={copy.currentZoneLabel}
            fallbackHint={usedFallback ? copy.locationFallbackHint : undefined}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-8"
        showsVerticalScrollIndicator={false}>
        {activeZone ? (
          <EventZoneLandmarkStrip
            zone={activeZone}
            language={language}
            title={copy.landmarksTitle}
          />
        ) : null}

        <BusanZoneMap
          selectedZoneId={selectedZoneId}
          currentZoneId={currentZoneId}
          language={language}
          zoneRooms={zoneRooms}
          onEnterChat={() => {
            if (!selectedZoneId) {
              return;
            }
            const room = getChatRoomByZoneId(selectedZoneId);
            if (room) {
              navigation.navigate('EventZoneChat', { roomId: room.id });
            }
          }}
          zoneSelectCopy={{
            selectZoneTitle: copy.selectZoneTitle,
            liveBadge: copy.chatLiveBadge,
            memberCountLabel: copy.chatMemberCount,
            enterLabel: copy.enterChat,
            currentZoneLabel: copy.currentZoneLabel,
          }}
          onZonePress={zoneId => {
            setSelectedZoneId(prev => (prev === zoneId ? null : zoneId));
          }}
        />
      </ScrollView>
    </View>
  );
}
