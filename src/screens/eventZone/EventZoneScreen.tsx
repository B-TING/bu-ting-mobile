import { Animated, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EventGameActiveBanner,
  EventGameBanner,
} from '../../components/eventGame';
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
  EVENT_MAP_BG,
  EVENT_MAP_DIM_FILL,
} from '../../constants/eventZone/mapChrome';
import { useEventZoneScreen } from '../../hooks/eventZone/useEventZoneScreen';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventZone'>;

const BOTTOM_SHEET_MARGIN = 12;

export function EventZoneScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    language,
    copy,
    gameCopy,
    isFocused,
    focusZoneId,
    highlightZoneId,
    isFocusedOnZone,
    isSlotDimmed,
    currentZoneId,
    usedFallback,
    currentZone,
    selectedZone,
    currentZoneRoom,
    selectedZoneRoom,
    currentLiveMemberCount,
    selectedLiveMemberCount,
    eventZoneIds,
    chatRooms,
    toastText,
    toastOpacity,
    liveMemberCounts,
    selectedActiveEvent,
    listActiveEventsByZone,
    currentZoneGameEvent,
    selectedZoneGameEvent,
    selectZone,
    handleCloseExpanded,
    handleTriggerEvent,
    handleEnterChat,
    handleJoinChat,
    handleOpenGameDetail,
  } = useEventZoneScreen({ navigation });

  return (
    <View className="flex-1" style={{ backgroundColor: EVENT_MAP_BG }}>
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

        {isFocusedOnZone && selectedZoneGameEvent ? (
          <View
            className="absolute left-0 right-0"
            style={{ top: insets.top + 56 }}
            pointerEvents="box-none">
            <EventGameBanner
              event={selectedZoneGameEvent}
              language={language}
              actionLabel={gameCopy.joinEvent}
              endsInLabel={copy.eventEndsIn}
              endedLabel={copy.eventEnded}
              onPress={() => handleOpenGameDetail(selectedZoneGameEvent.id)}
            />
          </View>
        ) : null}
      </View>

      {/* 하단 슬롯 — 목록 / 상세 / 인근 게임 배너 */}
      <View
        className="flex-1"
        style={{
          backgroundColor: isSlotDimmed ? EVENT_MAP_DIM_FILL : EVENT_MAP_BG,
          paddingHorizontal: BOTTOM_SHEET_MARGIN,
          paddingBottom: Math.max(BOTTOM_SHEET_MARGIN, insets.bottom),
          paddingTop: BOTTOM_SHEET_MARGIN,
        }}>
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
            activeEvent={selectedActiveEvent}
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
            bottomInset={12}
          />
        ) : (
          <View className="flex-1">
            {currentZoneGameEvent ? (
              <View className="mb-2">
                <EventGameActiveBanner
                  message={gameCopy.nearbyEventBanner}
                  actionLabel={gameCopy.joinEvent}
                  onPress={() => handleOpenGameDetail(currentZoneGameEvent.id)}
                />
              </View>
            ) : null}
            <EventZoneChatList
              rooms={chatRooms}
              language={language}
              title={copy.chatRoomsTitle}
              memberCountLabel={copy.chatMemberCount}
              joinLabel={copy.enterChat}
              activeEventsByZone={listActiveEventsByZone}
              bottomInset={12}
              liveMemberCounts={liveMemberCounts}
              onRoomPress={selectZone}
              onJoinPress={handleJoinChat}
            />
          </View>
        )}
      </View>
    </View>
  );
}
