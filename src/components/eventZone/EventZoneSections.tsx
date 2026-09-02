import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  EVENT_ZONE_BY_ID,
  chatRoomTopic,
  eventZoneName,
  eventZoneSummary,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import { ICON_COLOR_MUTED } from '../../constants/icons';
import { AppIcon } from '../shared/icons/AppIcon';
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
    <View className="max-w-[220px] rounded-2xl border border-brand-border bg-white px-3 py-2.5 shadow-sm">
      {zone ? (
        <>
          <Text className="text-[10px] font-semibold text-brand-muted">{mapZoneBadgeLabel}</Text>
          <Text className="mt-0.5 text-[13px] font-bold leading-[18px] text-brand-text">
            {eventZoneName(zone, language)}
          </Text>
          {room ? (
            <Text className="mt-0.5 text-[11px] font-semibold text-brand-primary">
              {memberCountLabel(liveMemberCount ?? room.memberCount)}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text className="text-[13px] font-bold leading-[18px] text-brand-text">
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
  embedded = false,
}: EventZoneChatListProps) {
  return (
    <View
      style={embedded ? panelShadow.sheet : panelShadow.card}
      className={
        embedded
          ? 'flex-1 bg-white'
          : 'flex-1 overflow-hidden rounded-3xl border border-brand-border bg-white'
      }>
      <View className={`px-5 pb-3 ${embedded ? 'pt-4' : 'border-b border-brand-border pt-5'}`}>
        <Text className="text-lg font-bold text-brand-text">{title}</Text>
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

          return (
            <View
              key={room.id}
              className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                isEventRoom ? 'border-pink-200 bg-pink-50' : 'border-brand-border bg-brand-background'
              }`}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRoomPress(room.zoneId)}
                className="min-w-0 flex-1 pr-3 active:opacity-80">
                <Text className="text-[15px] font-bold text-brand-text" numberOfLines={1}>
                  {eventZoneName(zone, language)}
                </Text>
                <View className="mt-1 flex-row items-start gap-1">
                  {isEventRoom ? (
                    <View className="mt-0.5">
                      <AppIcon name="zap" size={12} color={EVENT_PINK} />
                    </View>
                  ) : null}
                  <Text
                    className={`flex-1 text-xs leading-[17px] ${
                      isEventRoom ? 'text-pink-900' : 'text-brand-muted'
                    }`}
                    numberOfLines={2}>
                    {isEventRoom
                      ? `${activeEvent.titleKo} · ${activeEvent.descriptionKo}`
                      : chatRoomTopic(room, language)}
                  </Text>
                </View>
                <Text className="mt-1.5 text-[11px] font-semibold text-brand-primary">
                  {memberCountLabel(liveMemberCounts?.[room.zoneId] ?? room.memberCount)}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={joinLabel}
                onPress={() => onJoinPress(room.id)}
                className={`min-w-[68px] items-center rounded-xl px-4 py-3 active:opacity-90 ${
                  isEventRoom ? '' : 'bg-brand-primary'
                }`}
                style={isEventRoom ? { backgroundColor: EVENT_PINK } : undefined}>
                <Text className="text-xs font-bold text-white">{joinLabel}</Text>
              </Pressable>
            </View>
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
          : 'flex-1 overflow-hidden rounded-3xl border border-brand-border bg-white'
      }>
      <View
        className={`flex-row items-start justify-between px-5 pb-3 ${
          embedded ? 'pt-4' : 'border-b border-brand-border pt-5'
        }`}>
        <View className="min-w-0 flex-1 pr-2">
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text className="text-lg font-bold text-brand-text">{eventZoneName(zone, language)}</Text>
            {activeEvent ? (
              <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: EVENT_PINK }}>
                <Text className="text-[10px] font-bold text-white">{surpriseMissionBadge}</Text>
              </View>
            ) : null}
          </View>
          {room ? (
            <Text className="mt-1 text-[11px] font-semibold text-brand-primary">
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
          className="h-7 w-7 items-center justify-center rounded-lg bg-brand-background active:opacity-80">
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
          <View className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="zap" size={14} color={EVENT_PINK_DARK} />
              <Text className="flex-1 text-sm font-bold text-pink-700">{activeEvent.titleKo}</Text>
            </View>
            <Text className="mt-1.5 text-xs leading-[18px] text-pink-900">
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

        <Text className="text-[15px] leading-[22px] text-brand-text">
          {eventZoneSummary(zone, language)}
        </Text>

        <View>
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-muted">
            {landmarksTitle}
          </Text>
          <View className="gap-2">
            {zone.landmarks.map(landmark => (
              <View
                key={landmark.id}
                className="flex-row items-center rounded-xl border border-brand-border bg-brand-background px-3 py-2.5">
                <Text className="mr-2.5 text-base">{landmark.emoji}</Text>
                <Text className="flex-1 text-sm font-medium text-brand-text">
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
              style={{ backgroundColor: EVENT_PINK }}>
              <Text className="text-[15px] font-bold text-white">{joinMissionLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onEnterChat}
              disabled={!room}
              className={`flex-1 items-center rounded-xl py-3.5 active:opacity-90 ${
                room ? 'bg-brand-primary' : 'bg-brand-border'
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
              room ? 'bg-brand-primary' : 'bg-brand-border'
            }`}>
            <Text className="text-[15px] font-bold text-white">{enterChatRoomLabel}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
