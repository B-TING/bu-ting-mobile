import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  EVENT_ZONE_BY_ID,
  eventZoneName,
  eventZoneSummary,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import { ICON_COLOR_MUTED } from '../../constants/icons';
import { AppIcon } from '../shared/icons/AppIcon';
import { EventZoneCard } from './EventZoneCard';
import type { AppLanguage } from '../../types/user';
import type {
  EventZoneChatRoom,
  EventZoneDefinition,
  EventZoneId,
  ZoneEvent,
} from '../../types/eventZone';
import {
  formatZoneEventRemaining,
  useZoneEventRemaining,
} from '../../utils/eventZone/zoneEventRemaining';

export const PLANNING_CHIP_BG = '#EDE9FE';
export const PLANNING_CHIP_TEXT = '#6E36DB';
export const EVENT_PINK = '#DB2777';
const EVENT_PINK_DARK = '#BE185D';

type EventRemainingLabelProps = {
  event: ZoneEvent;
  language: AppLanguage;
  endsInLabel: (remaining: string) => string;
  endedLabel: string;
};

function EventRemainingLabel({
  event,
  language,
  endsInLabel,
  endedLabel,
}: EventRemainingLabelProps) {
  const remainingMs = useZoneEventRemaining(event);
  const remainingText = formatZoneEventRemaining(remainingMs, language);

  return (
    <View className="mt-2 flex-row items-center gap-1.5">
      <AppIcon name="timer" size={12} color={EVENT_PINK} />
      <Text className="text-xs font-semibold" style={{ color: EVENT_PINK }}>
        {remainingMs > 0 ? endsInLabel(remainingText) : endedLabel}
      </Text>
    </View>
  );
}

type EventZoneMapBadgeProps = {
  zone?: EventZoneDefinition | null;
  room: EventZoneChatRoom | undefined;
  language: AppLanguage;
  mapZoneBadgeLabel: string;
  noZoneLabel?: string;
  memberCountLabel: (n: number) => string;
  fallbackHint?: string;
  liveMemberCount?: number | null;
};

export function EventZoneMapBadge({
  zone,
  room,
  language,
  mapZoneBadgeLabel,
  noZoneLabel,
  memberCountLabel,
  fallbackHint,
  liveMemberCount,
}: EventZoneMapBadgeProps) {
  return (
    <View className="max-w-[220px] rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2.5 shadow-sm">
      {zone ? (
        <>
          <Text className="text-[10px] font-bold leading-[14px] text-[#64748B]">{mapZoneBadgeLabel}</Text>
          <Text className="mt-0.5 text-[13px] font-bold leading-[18px] text-[#1E293B]">
            {eventZoneName(zone, language)}
          </Text>
          {room ? (
            <Text className="mt-0.5 text-[11px] font-bold leading-[15px] text-[#0077B6]">
              {memberCountLabel(liveMemberCount ?? room.memberCount)}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text className="text-[13px] font-bold leading-[18px] text-[#1E293B]">
            {noZoneLabel ?? mapZoneBadgeLabel}
          </Text>
          {fallbackHint ? (
            <Text className="mt-1 text-[11px] leading-[15px] text-amber-600">{fallbackHint}</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const panelShadow = StyleSheet.create({
  sheet: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 14,
  },
});

type EventZoneChatListProps = {
  rooms: EventZoneChatRoom[];
  language: AppLanguage;
  title: string;
  memberCountLabel: (n: number) => string;
  joinLabel: string;
  activeEventsByZone: Partial<Record<EventZoneId, ZoneEvent>>;
  bottomInset: number;
  liveMemberCounts?: Partial<Record<EventZoneId, number>>;
  onRoomPress: (zoneId: EventZoneId) => void;
  onJoinPress: (roomId: string) => void;
  historyLabel?: string;
  onHistoryPress?: () => void;
  surpriseMissionBadge?: string;
  embedded?: boolean;
};

export function EventZoneChatList({
  rooms,
  language,
  title,
  memberCountLabel,
  joinLabel,
  activeEventsByZone,
  bottomInset,
  liveMemberCounts,
  onRoomPress,
  onJoinPress,
  historyLabel,
  onHistoryPress,
  surpriseMissionBadge,
  embedded = false,
}: EventZoneChatListProps) {
  return (
    <View
      style={embedded ? panelShadow.sheet : panelShadow.card}
      className={
        embedded
          ? 'flex-1 bg-white'
          : 'flex-1 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white'
      }>
      {embedded ? (
        <View className="items-center py-2" pointerEvents="none">
          <View className="h-1 w-9 rounded-full bg-[#CBD5E1]" />
        </View>
      ) : null}
      <View className={`px-4 pb-3 ${embedded ? 'pt-1' : 'border-b border-[#E2E8F0] pt-5'}`}>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-base font-bold text-[#1E293B]">{title}</Text>
          {historyLabel && onHistoryPress ? (
            <Pressable
              accessibilityRole="button"
              onPress={onHistoryPress}
              className="flex-row items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 active:opacity-80">
              <AppIcon name="clipboardList" size={14} color={ICON_COLOR_MUTED} />
              <Text className="text-xs font-semibold text-[#0077B6]">{historyLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: bottomInset + 16,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}>
        {rooms.map(room => {
          const zone = EVENT_ZONE_BY_ID[room.zoneId];
          const activeEvent = activeEventsByZone[room.zoneId];
          const isEventRoom = activeEvent != null;

          const landmarkPills = zone.landmarks
            .slice(0, 2)
            .map(l => `${l.emoji ?? '📍'} ${landmarkName(l, language)}`)
            .join('  ');
          const summary = eventZoneSummary(zone, language);
          const landmarksText = landmarkPills;

          return (
            <EventZoneCard
              key={room.id}
              zoneName={eventZoneName(zone, language)}
              summary={summary}
              landmarks={landmarksText}
              membersLabel={memberCountLabel(liveMemberCounts?.[room.zoneId] ?? room.memberCount)}
              joinLabel={joinLabel}
              isEvent={isEventRoom}
              eventChipLabel={surpriseMissionBadge}
              onPress={() => onRoomPress(room.zoneId)}
              onJoin={() => onJoinPress(room.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

type EventZoneZoneDetailPanelProps = {
  zone: EventZoneDefinition;
  room: EventZoneChatRoom | undefined;
  language: AppLanguage;
  landmarksTitle: string;
  memberCountLabel: (n: number) => string;
  enterChatRoomLabel: string;
  joinMissionLabel: string;
  closeLabel: string;
  mapZoneBadgeLabel: string;
  isCurrentZone: boolean;
  activeEvent?: ZoneEvent;
  eventEndsInLabel: (remaining: string) => string;
  eventEndedLabel: string;
  surpriseMissionBadge: string;
  onClose: () => void;
  onEnterChat: () => void;
  onJoinMission: () => void;
  liveMemberCount?: number | null;
  bottomInset?: number;
  embedded?: boolean;
};

export function EventZoneZoneDetailPanel({
  zone,
  room,
  language,
  landmarksTitle,
  memberCountLabel,
  enterChatRoomLabel,
  joinMissionLabel,
  closeLabel,
  mapZoneBadgeLabel,
  isCurrentZone,
  activeEvent,
  eventEndsInLabel,
  eventEndedLabel,
  surpriseMissionBadge,
  onClose,
  onEnterChat,
  onJoinMission,
  liveMemberCount,
  bottomInset = 0,
  embedded = false,
}: EventZoneZoneDetailPanelProps) {
  return (
    <View
      style={embedded ? panelShadow.sheet : panelShadow.card}
      className={
        embedded
          ? 'flex-1 bg-white'
          : 'flex-1 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white'
      }>
      <View
        className={`flex-row items-start justify-between px-4 pb-3 ${
          embedded ? 'pt-3' : 'border-b border-[#E2E8F0] pt-5'
        }`}>
        <View className="min-w-0 flex-1 pr-2">
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text className="text-[15px] font-bold text-[#1E293B]">{eventZoneName(zone, language)}</Text>
            {activeEvent ? (
              <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: '#DB2777' }}>
                <Text className="text-[10px] font-bold text-white">{surpriseMissionBadge}</Text>
              </View>
            ) : null}
          </View>
          {room ? (
            <Text className="mt-1 text-[11px] font-bold text-[#0077B6]">
              {memberCountLabel(liveMemberCount ?? room.memberCount)}
            </Text>
          ) : null}
          {isCurrentZone ? (
            <Text className="mt-1 text-[10px] font-semibold text-amber-700">{mapZoneBadgeLabel}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          hitSlop={8}
          className="h-7 w-7 items-center justify-center rounded-lg bg-[#F1F5F9] active:opacity-80">
          <AppIcon name="x" size={14} color={ICON_COLOR_MUTED} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: bottomInset + 16,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}>
        {activeEvent ? (
          <View className="rounded-2xl border border-[#F9A8D4] bg-[#FDF2F8] px-4 py-3">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[13px] leading-[18px] text-[#BE185D]">⚡</Text>
              <Text className="flex-1 text-[14px] font-bold text-[#BE185D]">{activeEvent.titleKo}</Text>
            </View>
            <Text className="mt-1.5 text-xs leading-[17px] text-[#9D174D]">
              {activeEvent.descriptionKo}
            </Text>
            <EventRemainingLabel
              event={activeEvent}
              language={language}
              endsInLabel={eventEndsInLabel}
              endedLabel={eventEndedLabel}
            />
          </View>
        ) : null}

        <View>
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">
            {landmarksTitle}
          </Text>
          <View className="gap-2">
            {zone.landmarks.map(landmark => (
              <View
                key={landmark.id}
                className="flex-row items-center rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5">
                <Text className="mr-2.5 text-[14px]">{landmark.emoji}</Text>
                <Text className="flex-1 text-[13px] font-medium text-[#1E293B]">
                  {landmarkName(landmark, language)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {activeEvent ? (
          <View className="flex-row gap-2.5">
            <Pressable
              accessibilityRole="button"
              onPress={onJoinMission}
              className="flex-1 items-center rounded-xl py-3.5 active:opacity-90"
              style={{ backgroundColor: '#DB2777' }}>
              <Text className="text-[15px] font-bold text-white">{joinMissionLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onEnterChat}
              disabled={!room}
              className={`flex-1 items-center rounded-xl py-3.5 active:opacity-90 ${
                room ? 'bg-[#0077B6]' : 'bg-[#E2E8F0]'
              }`}>
              <Text className="text-[15px] font-bold text-white">{enterChatRoomLabel}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onEnterChat}
            disabled={!room}
            className={`items-center rounded-xl py-3.5 active:opacity-90 ${
              room ? 'bg-[#0077B6]' : 'bg-[#E2E8F0]'
            }`}>
            <Text className="text-[15px] font-bold text-white">{enterChatRoomLabel}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
