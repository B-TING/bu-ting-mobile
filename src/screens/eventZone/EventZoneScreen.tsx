import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusanZoneMap } from '../../components/eventZone/BusanZoneMap';
import {
  EventZoneChatList,
  EventZoneMapBadge,
  EventZoneZoneDetailPanel,
} from '../../components/eventZone/EventZoneSections';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { ICON_COLOR_WHITE } from '../../constants/icons';
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
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { useFeatureUnavailableAlert } from '../../components/shared/modals';
import { FOCUS_ANIMATION_MS } from '../../utils/eventZone/useZoneMapCamera';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZone'>;

export function EventZoneScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const language = useAppLanguage();
  const copy = useCopy('eventZone');
  const { showUnavailable } = useFeatureUnavailableAlert();
  const { zoneId: currentZoneId, usedFallback } = useCurrentEventZone();

  /** 카메라 줌 타겟 + 하단 패널 — 터치 즉시 */
  const [focusZoneId, setFocusZoneId] = useState<EventZoneId | null>(null);
  /** 맵 glow/dim 오버레이 — 줌 애니 이후 (베이스 Path 와 분리·지연) */
  const [highlightZoneId, setHighlightZoneId] = useState<EventZoneId | null>(null);
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFocusedOnZone = focusZoneId != null;

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const triggerEvent = useZoneEventStore(s => s.triggerEvent);
  const eventZoneIds = useMemo(() => {
    if (isAlphaFeatureBlocked('zoneEvent')) {
      return [] as EventZoneId[];
    }
    return Object.keys(activeEventsByZone) as EventZoneId[];
  }, [activeEventsByZone]);
  const chatRooms = useMemo(() => allZoneChatRooms(), []);

  const [toastText, setToastText] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingSelection = useCallback(() => {
    if (selectionTimerRef.current != null) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }
  }, []);

  const selectZone = useCallback(
    (zoneId: EventZoneId) => {
      setFocusZoneId(zoneId);
      cancelPendingSelection();
      selectionTimerRef.current = setTimeout(() => {
        selectionTimerRef.current = null;
        setHighlightZoneId(zoneId);
      }, FOCUS_ANIMATION_MS);
    },
    [cancelPendingSelection],
  );

  const handleCloseExpanded = useCallback(() => {
    setFocusZoneId(null);
    setHighlightZoneId(null);
    cancelPendingSelection();
  }, [cancelPendingSelection]);

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
      cancelPendingSelection();
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, [cancelPendingSelection]);

  const handleTriggerEvent = () => {
    if (isAlphaFeatureBlocked('zoneEvent')) {
      showUnavailable(ALPHA_FEATURE_LABELS.zoneEvent);
      return;
    }
    const event = buildRandomMockZoneEvent();
    triggerEvent(event);
    showToast(
      copy.eventToast(
        eventZoneName(EVENT_ZONE_BY_ID[event.zoneId], language),
        event.titleKo,
      ),
    );
  };

  const currentZone = currentZoneId ? EVENT_ZONE_BY_ID[currentZoneId] : null;
  const selectedZone = focusZoneId ? EVENT_ZONE_BY_ID[focusZoneId] : null;
  const { memberCounts: liveMemberCounts } = useAllZoneChatMemberCounts();
  const currentLiveMemberCount = currentZoneId
    ? (liveMemberCounts[currentZoneId] ?? null)
    : null;
  const selectedLiveMemberCount = focusZoneId
    ? (liveMemberCounts[focusZoneId] ?? null)
    : null;
  const currentZoneRoom = useMemo(
    () => (currentZoneId ? getChatRoomByZoneId(currentZoneId) : undefined),
    [currentZoneId],
  );
  const selectedZoneRoom = useMemo(
    () => (focusZoneId ? getChatRoomByZoneId(focusZoneId) : undefined),
    [focusZoneId],
  );

  const handleEnterChat = (zoneId: EventZoneId) => {
    const room = getChatRoomByZoneId(zoneId);
    if (room) {
      navigation.navigate('EventZoneChat', { roomId: room.id });
    }
  };

  return (
    <View className="flex-1 bg-[#EAEAEA]">
      {/* 상단 맵 — 선택 여부와 무관하게 항상 동일 높이(하단 리스트 슬롯 유지) */}
      <View className="relative flex-1">
        <BusanZoneMap
          focusZoneId={focusZoneId}
          selectedZoneId={highlightZoneId}
          currentZoneId={currentZoneId}
          language={language}
          eventZoneIds={eventZoneIds}
          pulsesActive={isFocused}
          onZonePress={selectZone}
          onDismiss={handleCloseExpanded}
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

            {!isFocusedOnZone ? (
              <EventZoneMapBadge
                zone={currentZone}
                room={currentZoneRoom}
                language={language}
                currentZoneLabel={copy.currentZoneLabel}
                noZoneLabel={copy.noZoneLabel}
                memberCountLabel={copy.chatMemberCount}
                fallbackHint={
                  usedFallback
                    ? copy.locationFallbackHint
                    : currentZoneId == null
                      ? copy.outsideBusanHint
                      : undefined
                }
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
            <View className="flex-row items-center gap-2 rounded-full bg-black/80 px-5 py-3">
              <AppIcon name="partyPopper" size={14} color={ICON_COLOR_WHITE} />
              <Text className="text-xs font-semibold text-white">{toastText}</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>

      {/* 하단 슬롯 — 리스트 ↔ 상세 패널 교체 (맵 높이 고정) */}
      <View className="flex-1">
        {selectedZone ? (
          <EventZoneZoneDetailPanel
            zone={selectedZone}
            room={selectedZoneRoom}
            language={language}
            landmarksTitle={copy.landmarksTitle}
            memberCountLabel={copy.chatMemberCount}
            enterLabel={copy.enterChat}
            closeLabel={copy.closePanel}
            currentZoneLabel={copy.currentZoneLabel}
            isCurrentZone={focusZoneId === currentZoneId}
            activeEvent={
              isAlphaFeatureBlocked('zoneEvent')
                ? undefined
                : focusZoneId
                  ? activeEventsByZone[focusZoneId]
                  : undefined
            }
            eventEndsInLabel={copy.eventEndsIn}
            eventEndedLabel={copy.eventEnded}
            surpriseMissionBadge={copy.surpriseMissionBadge}
            onClose={handleCloseExpanded}
            onEnterChat={() => {
              if (focusZoneId) {
                handleEnterChat(focusZoneId);
              }
            }}
            liveMemberCount={selectedLiveMemberCount}
            bottomInset={insets.bottom}
          />
        ) : (
          <EventZoneChatList
            rooms={chatRooms}
            language={language}
            title={copy.chatRoomsTitle}
            memberCountLabel={copy.chatMemberCount}
            joinLabel={copy.enterChat}
            activeEventsByZone={
              isAlphaFeatureBlocked('zoneEvent') ? {} : activeEventsByZone
            }
            bottomInset={insets.bottom}
            liveMemberCounts={liveMemberCounts}
            onRoomPress={selectZone}
            onJoinPress={roomId => navigation.navigate('EventZoneChat', { roomId })}
          />
        )}
      </View>
    </View>
  );
}
