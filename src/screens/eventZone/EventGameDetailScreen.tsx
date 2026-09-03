import { useMemo } from 'react';
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
  isPhase1EventGame,
  resolveEventAuthTarget,
} from '../../constants/eventZone/eventGame';
import { ZONE_EVENT_TYPE_META } from '../../constants/eventZone/zoneEvents';
import { useEventAuthRadiusGate } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  useEventParticipationStore,
  useZoneEventStore,
} from '../../stores';
import {
  formatZoneEventRemaining,
  useZoneEventRemaining,
} from '../../utils/eventZone/zoneEventRemaining';

type Props = NativeStackScreenProps<RootStackParamList, 'EventGameDetail'>;

export function EventGameDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const zoneCopy = useCopy('eventZone');
  const { checking, assertWithinRadius } = useEventAuthRadiusGate();

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const beginParticipation = useEventParticipationStore(s => s.beginParticipation);
  const participation = useEventParticipationStore(s =>
    s.records.find(item => item.eventId === eventId),
  );
  const event = useMemo(
    () => Object.values(activeEventsByZone).find(item => item?.id === eventId),
    [activeEventsByZone, eventId],
  );

  const remainingMs = useZoneEventRemaining(event);

  if (!event || !isPhase1EventGame(event)) {
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
  const authTarget = resolveEventAuthTarget(event);
  const remainingText = formatZoneEventRemaining(remainingMs, language);
  const typeLabel = event.type === 'place_auth' ? copy.typePlaceAuth : copy.typeObjectSight;

  const statusLabel = (() => {
    if (!participation) {
      return copy.statusNotJoined;
    }
    if (participation.status === 'pending_review') {
      return copy.statusPendingReview;
    }
    if (participation.status === 'approved') {
      return copy.statusCompleted;
    }
    if (participation.status === 'rejected') {
      return copy.statusRejected;
    }
    return copy.statusInProgress;
  })();

  const participationBlocked =
    participation?.status === 'pending_review' ||
    participation?.status === 'approved' ||
    participation?.status === 'rejected';

  const canCapture =
    remainingMs > 0 &&
    !checking &&
    !participationBlocked &&
    (participation == null || participation.status === 'in_progress');

  const participateLabel = (() => {
    if (checking) {
      return copy.checkingLocation;
    }
    if (participation?.status === 'pending_review') {
      return copy.pendingReviewTitle;
    }
    if (participation?.status === 'approved') {
      return copy.statusCompleted;
    }
    if (participation?.status === 'rejected') {
      return copy.statusRejected;
    }
    if (participation?.status === 'in_progress') {
      return copy.continueCapture;
    }
    return copy.participate;
  })();

  const rulesText =
    event.type === 'place_auth' ? copy.placeAuthRules : copy.objectSightRules;

  const targetTitle = event.type === 'place_auth' ? copy.targetPlace : copy.targetObject;

  const handleParticipate = async () => {
    if (!canCapture) {
      return;
    }
    const within = await assertWithinRadius(event);
    if (!within) {
      return;
    }
    if (beginParticipation(event) === 'blocked') {
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
          <View className="flex-row items-center gap-2">
            <Text className="text-3xl">{meta.emoji}</Text>
            <View className="rounded-full bg-pink-600 px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">{typeLabel}</Text>
            </View>
          </View>
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
          {participation?.status === 'rejected' ? (
            <Text className="mt-2 text-xs leading-relaxed text-brand-muted">
              {copy.rejectedHint}
            </Text>
          ) : null}
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
          ) : (
            <View className="mt-3 flex-row items-center gap-3">
              <Text className="text-2xl">🔍</Text>
              <Text className="flex-1 text-base font-semibold text-brand-text">{objectLabel}</Text>
            </View>
          )}
        </View>

        {authTarget ? (
          <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
            <Text className="text-sm font-bold text-brand-text">{copy.radiusTitle}</Text>
            <Text className="mt-2 text-base font-semibold text-brand-primary">
              {copy.radiusLabel(authTarget.radiusM)}
            </Text>
            <Text className="mt-1 text-xs leading-relaxed text-brand-muted">
              {copy.radiusHint}
            </Text>
            <Text className="mt-2 text-[11px] text-brand-muted">
              {authTarget.latitude.toFixed(5)}, {authTarget.longitude.toFixed(5)}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        className="border-t border-brand-border bg-brand-surface px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable
          accessibilityRole="button"
          disabled={!canCapture}
          onPress={handleParticipate}
          className="items-center rounded-2xl bg-brand-primary py-4 active:opacity-90 disabled:opacity-50">
          <Text className="text-base font-bold text-white">{participateLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
