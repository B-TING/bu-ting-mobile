import { Pressable, Text, View } from 'react-native';

import {
  chatRoomTitle,
  eventZoneName,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import type { AppLanguage } from '../../types/user';
import type { EventZoneChatRoom, EventZoneDefinition } from '../../types/eventZone';

type EventZoneLandmarkListProps = {
  zone: EventZoneDefinition;
  language: AppLanguage;
  title: string;
};

export function EventZoneLandmarkList({
  zone,
  language,
  title,
}: EventZoneLandmarkListProps) {
  return (
    <View className="rounded-2xl border border-brand-border bg-brand-surface p-4">
      <Text className="mb-3 text-base font-bold text-brand-text">{title}</Text>
      <Text className="mb-3 text-sm text-brand-muted">
        {language === 'ko' ? zone.nameKo : zone.nameEn}
      </Text>
      <View className="gap-2">
        {zone.landmarks.map(landmark => (
          <View
            key={landmark.id}
            className="flex-row items-center rounded-xl bg-brand-background px-3 py-2.5">
            <Text className="mr-3 text-lg">{landmark.emoji}</Text>
            <Text className="flex-1 text-sm font-medium text-brand-text">
              {landmarkName(landmark, language)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type EventZoneChatRoomListProps = {
  zone: EventZoneDefinition;
  rooms: EventZoneChatRoom[];
  language: AppLanguage;
  title: string;
  liveBadge: string;
  memberCountLabel: (n: number) => string;
  featureHintLabel: string;
  enterLabel: string;
  onPressRoom?: (roomId: string) => void;
};

export function EventZoneChatRoomList({
  zone,
  rooms,
  language,
  title,
  liveBadge,
  memberCountLabel,
  featureHintLabel,
  enterLabel,
  onPressRoom,
}: EventZoneChatRoomListProps) {
  return (
    <View className="rounded-2xl border border-brand-border bg-brand-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-text">{title}</Text>
        <View className="rounded-full bg-sky-100 px-2 py-0.5">
          <Text className="text-[11px] font-semibold text-sky-700">{featureHintLabel}</Text>
        </View>
      </View>
      <Text className="mb-3 text-sm text-brand-muted">
        {eventZoneName(zone, language)}
      </Text>
      <View className="gap-2">
        {rooms.map(room => (
          <Pressable
            key={room.id}
            accessibilityRole="button"
            onPress={() => onPressRoom?.(room.id)}
            className="rounded-xl border border-brand-border bg-brand-background px-3 py-3">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="flex-1 text-sm font-semibold text-brand-text">
                {chatRoomTitle(room, language)}
              </Text>
              {room.isLive ? (
                <View className="rounded-full bg-rose-100 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-rose-600">{liveBadge}</Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-brand-muted">
                {memberCountLabel(room.memberCount)}
              </Text>
              <Text className="text-xs font-semibold text-brand-primary">{enterLabel}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
