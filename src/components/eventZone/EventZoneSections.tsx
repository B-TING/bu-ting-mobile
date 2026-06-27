import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  chatRoomTitle,
  eventZoneName,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import type { EventZoneChatRoom, EventZoneDefinition, EventZoneId } from '../../types/eventZone';

type EventZoneCurrentZoneBadgeProps = {
  zone: EventZoneDefinition;
  language: AppLanguage;
  label: string;
  fallbackHint?: string;
};

export function EventZoneCurrentZoneBadge({
  zone,
  language,
  label,
  fallbackHint,
}: EventZoneCurrentZoneBadgeProps) {
  return (
    <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1 px-1">
      <Text className="text-xs text-brand-muted">{label}</Text>
      <Text className="text-xs font-semibold text-brand-text">
        {eventZoneName(zone, language)}
      </Text>
      {fallbackHint ? (
        <Text className="text-[11px] text-amber-700">· {fallbackHint}</Text>
      ) : null}
    </View>
  );
}

type EventZoneLandmarkStripProps = {
  zone: EventZoneDefinition;
  language: AppLanguage;
  title: string;
};

export function EventZoneLandmarkStrip({
  zone,
  language,
  title,
}: EventZoneLandmarkStripProps) {
  return (
    <View className="rounded-2xl border border-brand-border bg-brand-surface p-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-brand-text">{title}</Text>
        <Text className="text-xs text-brand-muted">{eventZoneName(zone, language)}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2">
        {zone.landmarks.map(landmark => (
          <View
            key={landmark.id}
            className="flex-row items-center rounded-full border border-brand-border bg-brand-background px-3 py-2">
            <Text className="mr-1.5 text-base">{landmark.emoji}</Text>
            <Text className="text-xs font-medium text-brand-text">
              {landmarkName(landmark, language)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

type EventZoneZoneSelectListProps = {
  rooms: EventZoneChatRoom[];
  language: AppLanguage;
  title: string;
  liveBadge: string;
  memberCountLabel: (n: number) => string;
  enterLabel: string;
  currentZoneLabel: string;
  selectedZoneId: EventZoneId | null;
  currentZoneId: EventZoneId;
  onSelectZone: (zoneId: EventZoneId) => void;
  onEnterChat: () => void;
};

export function EventZoneZoneSelectList({
  rooms,
  language,
  title,
  liveBadge,
  memberCountLabel,
  enterLabel,
  currentZoneLabel,
  selectedZoneId,
  currentZoneId,
  onSelectZone,
  onEnterChat,
}: EventZoneZoneSelectListProps) {
  return (
    <View className="border-t border-brand-border bg-brand-surface px-3 py-3">
      <Text className="mb-2 text-sm font-bold text-brand-text">{title}</Text>

      <View className="gap-1.5">
        {rooms.map(room => {
          const selected = selectedZoneId === room.zoneId;
          const isCurrent = currentZoneId === room.zoneId;
          return (
            <Pressable
              key={room.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelectZone(room.zoneId)}
              className={`rounded-xl border px-3 py-2.5 ${
                selected
                  ? 'border-brand-primary bg-brand-selected'
                  : 'border-brand-border bg-brand-background'
              }`}>
              <View className="flex-row items-center">
                <View className="min-w-0 flex-1">
                  <View className="flex-row flex-wrap items-center gap-x-2">
                    <Text
                      className={`text-sm ${
                        selected ? 'font-bold text-brand-text' : 'font-medium text-brand-text'
                      }`}>
                      {chatRoomTitle(room, language)}
                    </Text>
                    {room.isLive ? (
                      <View className="rounded-full bg-rose-100 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-rose-600">{liveBadge}</Text>
                      </View>
                    ) : null}
                    {isCurrent ? (
                      <Text className="text-[10px] font-semibold text-amber-700">
                        {currentZoneLabel}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="mt-0.5 text-xs text-brand-muted">
                    {memberCountLabel(room.memberCount)}
                  </Text>
                </View>

                {selected ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={onEnterChat}
                    className="ml-2 shrink-0 rounded-xl bg-brand-primary px-3 py-2 active:opacity-90">
                    <Text className="text-xs font-bold text-white">{enterLabel}</Text>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
