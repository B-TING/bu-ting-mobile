import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  eventZoneName,
  eventZoneSummary,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import type { EventZoneChatRoom, EventZoneDefinition } from '../../types/eventZone';

type EventZoneMapBadgeProps = {
  zone: EventZoneDefinition;
  room: EventZoneChatRoom | undefined;
  language: AppLanguage;
  currentZoneLabel: string;
  memberCountLabel: (n: number) => string;
  fallbackHint?: string;
};

export function EventZoneMapBadge({
  zone,
  room,
  language,
  currentZoneLabel,
  memberCountLabel,
  fallbackHint,
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
          {memberCountLabel(room.memberCount)}
        </Text>
      ) : null}
      {fallbackHint ? (
        <Text className="mt-1 text-[10px] text-amber-700">{fallbackHint}</Text>
      ) : null}
    </View>
  );
}

type EventZoneZoneDetailPanelProps = {
  zone: EventZoneDefinition;
  room: EventZoneChatRoom | undefined;
  language: AppLanguage;
  landmarksTitle: string;
  liveBadge: string;
  memberCountLabel: (n: number) => string;
  enterLabel: string;
  closeLabel: string;
  currentZoneLabel: string;
  isCurrentZone: boolean;
  onClose: () => void;
  onEnterChat: () => void;
};

const panelShadow = StyleSheet.create({
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 14,
  },
});

export function EventZoneZoneDetailPanel({
  zone,
  room,
  language,
  landmarksTitle,
  liveBadge,
  memberCountLabel,
  enterLabel,
  closeLabel,
  currentZoneLabel,
  isCurrentZone,
  onClose,
  onEnterChat,
}: EventZoneZoneDetailPanelProps) {
  return (
    <View
      style={panelShadow.card}
      className="w-[68%] min-w-[272px] max-w-[340px] overflow-hidden rounded-2xl border border-brand-border bg-white">
      <View className="flex-row items-start justify-between border-b border-brand-border px-4 py-3">
        <View className="min-w-0 flex-1 pr-2">
          <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
            <Text className="text-lg font-bold text-brand-text">
              {eventZoneName(zone, language)}
            </Text>
            {room?.isLive ? (
              <View className="rounded-full bg-rose-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-rose-600">{liveBadge}</Text>
              </View>
            ) : null}
          </View>
          {room ? (
            <Text className="mt-0.5 text-xs font-semibold text-brand-primary">
              {memberCountLabel(room.memberCount)}
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
          <Text className="text-xs font-bold text-brand-muted">✕</Text>
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
