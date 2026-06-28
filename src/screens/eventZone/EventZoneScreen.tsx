import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusanZoneMap } from '../../components/eventZone/BusanZoneMap';
import {
  EventZoneMapBadge,
  EventZoneZoneDetailPanel,
} from '../../components/eventZone/EventZoneSections';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  EVENT_ZONE_BY_ID,
  EVENT_ZONE_COPY,
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

  const currentZone = EVENT_ZONE_BY_ID[currentZoneId];
  const selectedZone = selectedZoneId ? EVENT_ZONE_BY_ID[selectedZoneId] : null;
  const currentZoneRoom = useMemo(
    () => getChatRoomByZoneId(currentZoneId),
    [currentZoneId],
  );
  const selectedZoneRoom = useMemo(
    () => (selectedZoneId ? getChatRoomByZoneId(selectedZoneId) : undefined),
    [selectedZoneId],
  );

  const handleEnterChat = (zoneId: EventZoneId) => {
    const room = getChatRoomByZoneId(zoneId);
    if (room) {
      navigation.navigate('EventZoneChat', { roomId: room.id });
    }
  };

  return (
    <View className="flex-1 bg-[#EAEAEA]">
      <BusanZoneMap
        selectedZoneId={selectedZoneId}
        currentZoneId={currentZoneId}
        language={language}
        onZonePress={zoneId => setSelectedZoneId(zoneId)}
      />

      <View
        className="absolute left-0 right-0 flex-row items-start justify-between px-3"
        style={{ top: insets.top + 8 }}
        pointerEvents="box-none">
        <View className="flex-row items-start gap-2">
          <View className="rounded-full border border-brand-border bg-white shadow-sm">
            <BackButton
              accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
              onPress={() => navigation.goBack()}
            />
          </View>

          {!selectedZone ? (
            <EventZoneMapBadge
              zone={currentZone}
              room={currentZoneRoom}
              language={language}
              currentZoneLabel={copy.currentZoneLabel}
              memberCountLabel={copy.chatMemberCount}
              fallbackHint={usedFallback ? copy.locationFallbackHint : undefined}
            />
          ) : null}
        </View>

        <View className="rounded-full bg-violet-100 px-2.5 py-1 shadow-sm">
          <Text className="text-[10px] font-semibold text-violet-700">
            {copy.planningBadge}
          </Text>
        </View>
      </View>

      {selectedZone ? (
        <View className="absolute inset-0" pointerEvents="box-none">
          <Pressable
            className="absolute inset-0"
            accessibilityRole="button"
            accessibilityLabel={copy.closePanel}
            onPress={() => setSelectedZoneId(null)}
          />
          <View
            className="absolute right-3"
            style={{ bottom: insets.bottom + 16 }}
            pointerEvents="auto">
            <EventZoneZoneDetailPanel
              zone={selectedZone}
              room={selectedZoneRoom}
              language={language}
              landmarksTitle={copy.landmarksTitle}
              liveBadge={copy.chatLiveBadge}
              memberCountLabel={copy.chatMemberCount}
              enterLabel={copy.enterChat}
              closeLabel={copy.closePanel}
              currentZoneLabel={copy.currentZoneLabel}
              isCurrentZone={selectedZoneId === currentZoneId}
              onClose={() => setSelectedZoneId(null)}
              onEnterChat={() => {
                if (selectedZoneId) {
                  handleEnterChat(selectedZoneId);
                }
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
