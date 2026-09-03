import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventActionButton } from '../../components/eventZone/EventActionButton';
import { EventCallout } from '../../components/eventZone/EventCallout';
import { EventGameHero } from '../../components/eventZone/EventGameHero';
import { EventInfoCard } from '../../components/eventZone/EventInfoCard';
import { EventMissionCard } from '../../components/eventZone/EventMissionCard';
import { EventNavHeader } from '../../components/eventZone/EventNavHeader';
import { EventStatRow } from '../../components/eventZone/EventStatRow';
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
        className="flex-1 items-center justify-center bg-[#F8FAFC] px-6"
        style={{ paddingTop: insets.top }}>
        <Text className="text-center text-[#64748B]">{zoneCopy.eventEnded}</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-semibold text-[#0077B6]">{copy.done}</Text>
        </Pressable>
      </View>
    );
  }

  const zone = EVENT_ZONE_BY_ID[event.zoneId];
  const landmark = zone.landmarks.find(item => item.id === event.targetLandmarkId);
  const objectLabel = eventGameObjectLabel(event, language);
  const authTarget = resolveEventAuthTarget(event);
  const remainingText = formatZoneEventRemaining(remainingMs, language);
  const typeLabel = event.type === 'place_auth' ? copy.typePlaceAuth : copy.typeObjectSight;

  const statusLabel = (() => {
    if (!participation) return copy.statusNotJoined;
    if (participation.status === 'pending_review') return copy.statusPendingReview;
    if (participation.status === 'approved') return copy.statusCompleted;
    if (participation.status === 'rejected') return copy.statusRejected;
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
    if (checking) return copy.checkingLocation;
    if (participation?.status === 'pending_review') return copy.pendingReviewTitle;
    if (participation?.status === 'approved') return copy.statusCompleted;
    if (participation?.status === 'rejected') return copy.statusRejected;
    if (participation?.status === 'in_progress') return copy.continueCapture;
    return copy.participate;
  })();

  const rulesText =
    event.type === 'place_auth' ? copy.placeAuthRules : copy.objectSightRules;

  const handleParticipate = async () => {
    if (!canCapture) return;
    const within = await assertWithinRadius(event);
    if (!within) return;
    if (beginParticipation(event) === 'blocked') return;
    navigation.navigate('EventGameCamera', { eventId: event.id });
  };

  const statItems = [
    { label: copy.statusTitle, value: statusLabel },
    ...(authTarget ? [{ label: copy.radiusTitle, value: copy.radiusLabel(authTarget.radiusM) }] : []),
    { label: language === 'ko' ? '남은 시간' : 'Remaining', value: remainingMs > 0 ? remainingText : '-' },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingTop: insets.top }}>
      {/* 헤더 */}
      <View className="border-b border-[#E2E8F0] bg-white px-2">
        <EventNavHeader
          title={copy.detailTitle}
          subtitle={eventZoneName(zone, language)}
          onBack={() => navigation.goBack()}
          backAccessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}>

        {/* 히어로 */}
        <EventGameHero label={event.titleKo} />

        {/* 미션 카드 */}
        <EventMissionCard
          event={event}
          language={language}
          endsInLabel={copy.remainingLabel}
          endedLabel={zoneCopy.eventEnded}
        />

        {/* 타입 칩 + 통계 */}
        <EventStatRow items={statItems} />

        {/* 상태 안내 callout */}
        {participation?.status === 'rejected' ? (
          <EventCallout
            tone="warning"
            title={copy.statusRejected}
            body={copy.rejectedHint}
          />
        ) : participation?.status === 'pending_review' ? (
          <EventCallout
            tone="info"
            title={copy.pendingReviewTitle}
            body={copy.pendingReviewMessage}
          />
        ) : participation?.status === 'approved' ? (
          <EventCallout
            tone="event"
            title={copy.statusCompleted}
            body={copy.pendingReviewMessage}
          />
        ) : null}

        {/* 규칙 */}
        <EventInfoCard
          label={copy.rulesTitle}
          title={typeLabel}
          body={rulesText}
          tone="default"
        />

        {/* 타겟 */}
        {event.type === 'place_auth' && landmark ? (
          <EventInfoCard
            label={copy.targetPlace}
            title={`${landmark.emoji ?? '📍'} ${landmarkName(landmark, language)}`}
            body={`GPS ${landmark.location.lat.toFixed(4)}, ${landmark.location.lng.toFixed(4)}`}
            tone="default"
          />
        ) : event.type === 'object_sight' ? (
          <EventInfoCard
            label={copy.targetObject}
            title={`📷 ${objectLabel}`}
            tone="default"
          />
        ) : null}

        {/* 반경 */}
        {authTarget ? (
          <EventInfoCard
            label={copy.radiusTitle}
            title={copy.radiusLabel(authTarget.radiusM)}
            body={copy.radiusHint}
            tone="success"
          />
        ) : null}
      </ScrollView>

      {/* 하단 CTA */}
      <View
        className="border-t border-[#E2E8F0] bg-white px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}>
        <EventActionButton
          label={participateLabel}
          variant={canCapture ? 'event' : 'ghost'}
          disabled={!canCapture}
          onPress={handleParticipate}
        />
      </View>
    </View>
  );
}
