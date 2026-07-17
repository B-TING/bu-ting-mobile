import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import {
  EVENT_ZONE_BY_ID,
  eventZoneName,
  landmarkName,
} from '../../constants/eventZone/eventZone';
import {
  eventGameObjectLabel,
  isEventGame,
} from '../../constants/eventZone/eventGame';
import { ZONE_EVENT_TYPE_META } from '../../constants/eventZone/zoneEvents';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useZoneEventStore } from '../../stores';
import {
  formatZoneEventRemaining,
  useZoneEventRemaining,
} from '../../utils/eventZone/zoneEventRemaining';

type Props = NativeStackScreenProps<RootStackParamList, 'EventGameDetail'>;

type ParticipationStatus = 'not_joined' | 'in_progress' | 'completed';

export function EventGameDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const zoneCopy = useCopy('eventZone');

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const event = useMemo(
    () => Object.values(activeEventsByZone).find(item => item?.id === eventId),
    [activeEventsByZone, eventId],
  );

  const [status, setStatus] = useState<ParticipationStatus>('not_joined');
  const remainingMs = useZoneEventRemaining(event);

  if (!event || !isEventGame(event)) {
    return (
      <View
        className="flex-1 items-center justify-center bg-brand-background px-6"
        style={{ paddingTop: insets.top }}>
        <Text className="text-center text-brand-muted">{zoneCopy.eventEnded}</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-semibold text-brand-primary">{copy.done}</Text>
        </Pressable>
      </View>
    );
  }

  const zone = EVENT_ZONE_BY_ID[event.zoneId];
  const meta = ZONE_EVENT_TYPE_META[event.type];
  const landmark = zone.landmarks.find(item => item.id === event.targetLandmarkId);
  const objectLabel = eventGameObjectLabel(event, language);
  const remainingText = formatZoneEventRemaining(remainingMs, language);
  const statusLabel =
    status === 'completed'
      ? copy.statusCompleted
      : status === 'in_progress'
        ? copy.statusInProgress
        : copy.statusNotJoined;

  const rulesText =
    event.type === 'place_auth'
      ? copy.placeAuthRules
      : event.type === 'mukjjippa'
        ? copy.mukjjippaRules
        : copy.objectSightRules;

  const targetTitle =
    event.type === 'place_auth'
      ? copy.targetPlace
      : event.type === 'mukjjippa'
        ? copy.targetOpponent
        : copy.targetObject;

  const handleParticipate = () => {
    setStatus('in_progress');
    if (event.type === 'mukjjippa') {
      navigation.navigate('EventGameMukjjippa', { eventId: event.id });
      return;
    }
    navigation.navigate('EventGameCamera', { eventId: event.id });
  };

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text">{copy.detailTitle}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <View className="rounded-3xl border border-pink-200 bg-pink-50 p-5">
          <Text className="text-3xl">{meta.emoji}</Text>
          <Text className="mt-2 text-xl font-bold text-brand-text">{event.titleKo}</Text>
          <Text className="mt-1 text-sm text-brand-muted">
            {eventZoneName(zone, language)} · {event.descriptionKo}
          </Text>
          <View className="mt-3 flex-row items-center gap-1.5">
            <AppIcon name="timer" size={14} color="#DB2777" />
            <Text className="text-xs font-semibold text-pink-600">
              {remainingMs > 0 ? copy.remainingLabel(remainingText) : zoneCopy.eventEnded}
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
          <Text className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {copy.statusTitle}
          </Text>
          <Text className="mt-1 text-base font-bold text-brand-text">{statusLabel}</Text>
        </View>

        <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
          <Text className="text-sm font-bold text-brand-text">{copy.rulesTitle}</Text>
          <Text className="mt-2 text-sm leading-relaxed text-brand-muted">{rulesText}</Text>
        </View>

        <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
          <Text className="text-sm font-bold text-brand-text">{targetTitle}</Text>
          {event.type === 'place_auth' && landmark ? (
            <View className="mt-3 flex-row items-center gap-3">
              <Text className="text-2xl">{landmark.emoji}</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-brand-text">
                  {landmarkName(landmark, language)}
                </Text>
                <Text className="mt-0.5 text-xs text-brand-muted">
                  GPS {landmark.location.lat.toFixed(4)}, {landmark.location.lng.toFixed(4)}
                </Text>
              </View>
            </View>
          ) : event.type === 'mukjjippa' ? (
            <View className="mt-3 flex-row items-center gap-3">
              <Text className="text-2xl">⚔️</Text>
              <Text className="flex-1 text-base font-semibold text-brand-text">
                {copy.targetOpponentHint}
              </Text>
            </View>
          ) : (
            <View className="mt-3 flex-row items-center gap-3">
              <Text className="text-2xl">🔍</Text>
              <Text className="flex-1 text-base font-semibold text-brand-text">{objectLabel}</Text>
            </View>
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Text className="text-sm font-bold text-amber-900">{copy.rewardTitle}</Text>
          <Text className="mt-1 text-sm text-amber-800">{copy.rewardHint}</Text>
        </View>
      </ScrollView>

      <View
        className="border-t border-brand-border bg-brand-surface px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable
          accessibilityRole="button"
          disabled={remainingMs <= 0}
          onPress={handleParticipate}
          className="items-center rounded-2xl bg-brand-primary py-4 active:opacity-90 disabled:opacity-50">
          <Text className="text-base font-bold text-white">{copy.participate}</Text>
        </Pressable>
      </View>
    </View>
  );
}
