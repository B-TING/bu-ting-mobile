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

type EventZoneMapBadgeProps = {
  zone: EventZoneDefinition;
  room: EventZoneChatRoom | undefined;
  language: AppLanguage;
  currentZoneLabel: string;
  memberCountLabel: (n: number) => string;
  fallbackHint?: string;
  /** 백엔드 currentMembers (없으면 room.memberCount) */
  liveMemberCount?: number | null;
};

export function EventZoneMapBadge({
  zone,
  room,
  language,
  currentZoneLabel,
  memberCountLabel,
  fallbackHint,
  liveMemberCount,
}: EventZoneMapBadgeProps) {
  return (
    <View className="rounded-2xl border border-brand-border bg-white px-3 py-2 shadow-sm">
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
        {currentZoneLabel}
      </Text>
      <Text className="mt-0.5 text-sm font-bold text-brand-text">
        {eventZoneName(zone, language)}
      </Text>
      {room ? (
        <Text className="mt-0.5 text-xs text-brand-primary">
          {memberCountLabel(liveMemberCount ?? room.memberCount)}
        </Text>
      ) : null}
      {fallbackHint ? (
        <Text className="mt-1 text-[10px] text-amber-700">{fallbackHint}</Text>
      ) : null}
    </View>
  );
}

const panelShadow = StyleSheet.create({
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
}: EventZoneChatListProps) {
  return (
    <View
      style={panelShadow.card}
      className="flex-1 overflow-hidden rounded-t-3xl border border-brand-border bg-white">
      <View className="border-b border-brand-border px-4 pb-3 pt-4">
        <Text className="text-base font-bold text-brand-text">{title}</Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: bottomInset + 12 }}
        showsVerticalScrollIndicator={false}>
        {rooms.map(room => {
          const zone = EVENT_ZONE_BY_ID[room.zoneId];
          const activeEvent = activeEventsByZone[room.zoneId];
          const isEventRoom = activeEvent != null;

          return (
            <View
              key={room.id}
              className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                isEventRoom
                  ? 'border-pink-300 bg-pink-50'
                  : 'border-brand-border bg-brand-background'
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
                      <AppIcon name="zap" size={12} color="#DB2777" />
                    </View>
                  ) : null}
                  <Text className="flex-1 text-xs text-brand-muted" numberOfLines={2}>
                    {isEventRoom
                      ? `${activeEvent.titleKo} - ${activeEvent.descriptionKo}`
                      : chatRoomTopic(room, language)}
                  </Text>
                </View>
                <Text className="mt-1.5 text-xs font-semibold text-brand-primary">
                  {memberCountLabel(liveMemberCounts?.[room.zoneId] ?? room.memberCount)}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={joinLabel}
                onPress={() => onJoinPress(room.id)}
                className={`rounded-xl px-3.5 py-2 active:opacity-90 ${
                  isEventRoom ? 'bg-pink-600' : 'bg-brand-primary'
                }`}>
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
  enterLabel: string;
  closeLabel: string;
  currentZoneLabel: string;
  isCurrentZone: boolean;
  onClose: () => void;
  onEnterChat: () => void;
  liveMemberCount?: number | null;
};

export function EventZoneZoneDetailPanel({
  zone,
  room,
  language,
  landmarksTitle,
  memberCountLabel,
  enterLabel,
  closeLabel,
  currentZoneLabel,
  isCurrentZone,
  onClose,
  onEnterChat,
  liveMemberCount,
}: EventZoneZoneDetailPanelProps) {
  return (
    <View
      style={panelShadow.card}
      className="w-full overflow-hidden rounded-2xl border border-brand-border bg-white">
      <View className="flex-row items-start justify-between border-b border-brand-border px-4 py-3">
        <View className="min-w-0 flex-1 pr-2">
          <Text className="text-lg font-bold text-brand-text">
            {eventZoneName(zone, language)}
          </Text>
          {room ? (
            <Text className="mt-0.5 text-xs font-semibold text-brand-primary">
              {memberCountLabel(liveMemberCount ?? room.memberCount)}
            </Text>
          ) : null}
          {isCurrentZone ? (
            <Text className="mt-0.5 text-[10px] font-semibold text-amber-700">
              {currentZoneLabel}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          hitSlop={8}
          className="rounded-full bg-brand-background px-2 py-1 active:opacity-80">
          <AppIcon name="x" size={14} color={ICON_COLOR_MUTED} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View className="gap-3.5 px-4 py-3.5">
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

        <Pressable
          accessibilityRole="button"
          onPress={onEnterChat}
          disabled={!room}
          className={`items-center rounded-xl py-3 active:opacity-90 ${
            room ? 'bg-brand-primary' : 'bg-brand-border'
          }`}>
          <Text className="text-[15px] font-bold text-white">{enterLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
