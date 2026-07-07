import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusanZoneMap } from '../../components/eventZone/BusanZoneMap';
import {
  EventZoneChatList,
  EventZoneMapBadge,
  EventZoneZoneDetailPanel,
} from '../../components/eventZone/EventZoneSections';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  EVENT_ZONE_BY_ID,
  allZoneChatRooms,
  eventZoneName,
  getChatRoomByZoneId,
} from '../../constants/eventZone/eventZone';
import { buildRandomMockZoneEvent } from '../../constants/eventZone/zoneEvents';
import { useCurrentEventZone } from '../../hooks/useCurrentEventZone';
import {
  useAllZoneChatMemberCounts,
} from '../../hooks/useZoneChatRoomSummary';
import type { RootStackParamList } from '../../navigation/types';
import { useAppLanguage, useCopy } from '../../i18n';
import { useZoneEventStore } from '../../stores';
import type { EventZoneId } from '../../types/eventZone';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZone'>;

/** 리스트가 보일 때 지도가 차지하는 화면 비율 */
const MAP_HEIGHT_RATIO = 0.5;

export function EventZoneScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventZone');
  const { zoneId: currentZoneId, usedFallback } = useCurrentEventZone();
  const [selectedZoneId, setSelectedZoneId] = useState<EventZoneId | null>(null);
  const isExpanded = selectedZoneId != null;

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const triggerEvent = useZoneEventStore(s => s.triggerEvent);
  const eventZoneIds = useMemo(
    () => Object.keys(activeEventsByZone) as EventZoneId[],
    [activeEventsByZone],
  );
  const chatRooms = useMemo(() => allZoneChatRooms(), []);

  const [toastText, setToastText] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (text: string) => {
    setToastText(text);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setToastText(null));
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const handleTriggerEvent = () => {
    const event = buildRandomMockZoneEvent();
    triggerEvent(event);
    showToast(
      copy.eventToast(
        eventZoneName(EVENT_ZONE_BY_ID[event.zoneId], language),
        event.titleKo,
      ),
    );
  };

  const currentZone = EVENT_ZONE_BY_ID[currentZoneId];
  const selectedZone = selectedZoneId ? EVENT_ZONE_BY_ID[selectedZoneId] : null;
  const { memberCounts: liveMemberCounts } = useAllZoneChatMemberCounts();
  const currentLiveMemberCount = liveMemberCounts[currentZoneId] ?? null;
  const selectedLiveMemberCount = selectedZoneId
    ? (liveMemberCounts[selectedZoneId] ?? null)
    : null;
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

  const handleCloseExpanded = () => {
    setSelectedZoneId(null);
  };

  return (
    <View className="flex-1 bg-[#EAEAEA]">
      <View
        className="relative"
        style={isExpanded ? { flex: 1 } : { height: `${MAP_HEIGHT_RATIO * 100}%`, paddingTop: MAP_HEIGHT_RATIO * 150 }}>
        <BusanZoneMap
          selectedZoneId={selectedZoneId}
          currentZoneId={currentZoneId}
          language={language}
          eventZoneIds={eventZoneIds}
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

            {!isExpanded ? (
              <EventZoneMapBadge
                zone={currentZone}
                room={currentZoneRoom}
                language={language}
                currentZoneLabel={copy.currentZoneLabel}
                memberCountLabel={copy.chatMemberCount}
                fallbackHint={usedFallback ? copy.locationFallbackHint : undefined}
                liveMemberCount={currentLiveMemberCount}
              />
            ) : null}
          </View>

          <View className="items-end gap-2">
            <View className="rounded-full bg-violet-100 px-2.5 py-1 shadow-sm">
              <Text className="text-[10px] font-semibold text-violet-700">
                {copy.planningBadge}
              </Text>
            </View>
            {__DEV__ ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.devEventTriggerA11y}
                className="rounded-full bg-pink-600 px-3 py-1.5 shadow-sm active:opacity-80"
                onPress={handleTriggerEvent}>
                <Text className="text-[11px] font-bold text-white">{copy.devEventTrigger}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {toastText ? (
          <Animated.View
            className="absolute left-0 right-0 items-center"
            style={{ top: insets.top + 56, opacity: toastOpacity }}
            pointerEvents="none">
            <View className="rounded-full bg-black/80 px-5 py-3">
              <Text className="text-xs font-semibold text-white">🎉 {toastText}</Text>
            </View>
          </Animated.View>
        ) : null}

        {selectedZone ? (
          <View className="absolute inset-0" pointerEvents="box-none">
            <View
              className="absolute right-3"
              style={{ bottom: insets.bottom + 16 }}
              pointerEvents="auto">
              <EventZoneZoneDetailPanel
                zone={selectedZone}
                room={selectedZoneRoom}
                language={language}
                landmarksTitle={copy.landmarksTitle}
                memberCountLabel={copy.chatMemberCount}
                enterLabel={copy.enterChat}
                closeLabel={copy.closePanel}
                currentZoneLabel={copy.currentZoneLabel}
                isCurrentZone={selectedZoneId === currentZoneId}
                activeEvent={selectedZoneId ? activeEventsByZone[selectedZoneId] : undefined}
                eventEndsInLabel={copy.eventEndsIn}
                eventEndedLabel={copy.eventEnded}
                surpriseMissionBadge={copy.surpriseMissionBadge}
                onClose={handleCloseExpanded}
                onEnterChat={() => {
                  if (selectedZoneId) {
                    handleEnterChat(selectedZoneId);
                  }
                }}
                liveMemberCount={selectedLiveMemberCount}
              />
            </View>
          </View>
        ) : null}
      </View>

      {!isExpanded ? (
        <EventZoneChatList
          rooms={chatRooms}
          language={language}
          title={copy.chatRoomsTitle}
          memberCountLabel={copy.chatMemberCount}
          joinLabel={copy.enterChat}
          activeEventsByZone={activeEventsByZone}
          bottomInset={insets.bottom}
          liveMemberCounts={liveMemberCounts}
          onRoomPress={zoneId => setSelectedZoneId(zoneId)}
          onJoinPress={roomId => navigation.navigate('EventZoneChat', { roomId })}
        />
      ) : null}
    </View>
  );
}
