import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppIcon } from '../../components/shared/icons/AppIcon';
import type { LucideIconName } from '../../constants/icons';
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
  BRAND_MUTED,
  BRAND_PAGE_BG,
  BRAND_PRIMARY,
  EVENT_PINK_BG,
  EVENT_PINK_BORDER,
  EVENT_PINK_DARK,
  FEEDBACK_AMBER,
  FEEDBACK_AMBER_BG,
  FEEDBACK_AMBER_BORDER,
  FEEDBACK_INFO,
  FEEDBACK_INFO_BG,
  FEEDBACK_INFO_BORDER,
} from '../../components/eventZone/eventZoneTheme';
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
import type { RadiusGateResult } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useEventAuthRadiusGate } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useLocationCache } from '../../hooks/location/useLocationCache';
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

// ─── 반경 체크 결과 모달 ────────────────────────────────────────────
type RadiusModalConfig = {
  icon: LucideIconName;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  tone: 'warning' | 'info' | 'event';
};

function buildRadiusModalConfig(
  result: RadiusGateResult,
  copy: ReturnType<typeof useCopy<'eventGame'>>,
): RadiusModalConfig | null {
  if (result.status === 'inside') return null;

  if (result.status === 'outside') {
    const body =
      result.distanceM != null
        ? copy.outOfRadiusMessage(result.distanceM, result.radiusM)
        : copy.outOfRadiusHint;
    return {
      icon: 'mapPin',
      iconColor: '#EA580C',
      iconBg: '#FFEDD5',
      title: copy.outOfRadiusTitle,
      body,
      tone: 'warning',
    };
  }

  if (result.status === 'consent_denied' || result.status === 'permission_denied') {
    return {
      icon: 'alertTriangle',
      iconColor: '#0077B6',
      iconBg: '#DBEAFE',
      title: copy.locationDeniedTitle,
      body: copy.locationDeniedMessage,
      tone: 'info',
    };
  }

  return {
    icon: 'satellite',
    iconColor: '#EA580C',
    iconBg: '#FFEDD5',
    title: copy.locationUnavailableTitle,
    body: copy.locationUnavailableMessage,
    tone: 'warning',
  };
}

const TONE_STYLE: Record<
  'warning' | 'info' | 'event',
  { bg: string; border: string; title: string }
> = {
  warning: { bg: FEEDBACK_AMBER_BG, border: FEEDBACK_AMBER_BORDER, title: FEEDBACK_AMBER },
  info: { bg: FEEDBACK_INFO_BG, border: FEEDBACK_INFO_BORDER, title: FEEDBACK_INFO },
  event: { bg: EVENT_PINK_BG, border: EVENT_PINK_BORDER, title: EVENT_PINK_DARK },
};

// ─── Screen ────────────────────────────────────────────────────────
export function EventGameDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const zoneCopy = useCopy('eventZone');
  const { checking, assertWithinRadius } = useEventAuthRadiusGate();
  useLocationCache();

  const [radiusModal, setRadiusModal] = useState<RadiusModalConfig | null>(null);

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
        className="flex-1 items-center justify-center px-6"
        style={{ paddingTop: insets.top, backgroundColor: BRAND_PAGE_BG }}>
        <Text className="text-center" style={{ color: BRAND_MUTED }}>{zoneCopy.eventEnded}</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-semibold" style={{ color: BRAND_PRIMARY }}>{copy.done}</Text>
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
    const within = await assertWithinRadius(event, result => {
      const config = buildRadiusModalConfig(result, copy);
      if (config) setRadiusModal(config);
    });
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
        <EventGameHero label={event.titleKo} />
        <EventMissionCard
          event={event}
          language={language}
          endsInLabel={copy.remainingLabel}
          endedLabel={zoneCopy.eventEnded}
        />
        <EventStatRow items={statItems} />

        {participation?.status === 'rejected' ? (
          <EventCallout tone="warning" title={copy.statusRejected} body={copy.rejectedHint} />
        ) : participation?.status === 'pending_review' ? (
          <EventCallout tone="info" title={copy.pendingReviewTitle} body={copy.pendingReviewMessage} />
        ) : participation?.status === 'approved' ? (
          <EventCallout tone="event" title={copy.statusCompleted} body={copy.pendingReviewMessage} />
        ) : null}

        <EventInfoCard label={copy.rulesTitle} title={typeLabel} body={rulesText} tone="default" />

        {event.type === 'place_auth' && landmark ? (
          <EventInfoCard
            label={copy.targetPlace}
            title={`${landmark.emoji ?? '📍'} ${landmarkName(landmark, language)}`}
            body={`GPS ${landmark.location.lat.toFixed(4)}, ${landmark.location.lng.toFixed(4)}`}
            tone="default"
          />
        ) : event.type === 'object_sight' ? (
          <EventInfoCard label={copy.targetObject} title={`📷 ${objectLabel}`} tone="default" />
        ) : null}

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

      {/* 반경 체크 결과 모달 */}
      <Modal
        visible={radiusModal != null}
        transparent
        animationType="fade"
        onRequestClose={() => setRadiusModal(null)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-6"
          onPress={() => setRadiusModal(null)}>
          <Pressable onPress={e => e.stopPropagation()}>
            {radiusModal ? (
              <View
                className="w-full max-w-sm overflow-hidden rounded-3xl"
                style={{
                  backgroundColor: TONE_STYLE[radiusModal.tone].bg,
                  borderWidth: 1,
                  borderColor: TONE_STYLE[radiusModal.tone].border,
                }}>
                {/* 상단 아이콘 + 제목 */}
                <View className="items-center px-6 pt-8 pb-4">
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: radiusModal.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <AppIcon name={radiusModal.icon} size={28} color={radiusModal.iconColor} />
                  </View>
                  <Text
                    className="mt-4 text-center text-[17px] font-bold leading-6"
                    style={{ color: TONE_STYLE[radiusModal.tone].title }}>
                    {radiusModal.title}
                  </Text>
                  <Text className="mt-2 text-center text-[13px] leading-[20px] text-[#475569]">
                    {radiusModal.body}
                  </Text>
                </View>
                {/* 구분선 + 확인 버튼 */}
                <View className="border-t border-[#E2E8F0]">
                  <Pressable
                    onPress={() => setRadiusModal(null)}
                    className="items-center py-4 active:opacity-70">
                    <Text
                      className="text-[15px] font-bold"
                      style={{ color: TONE_STYLE[radiusModal.tone].title }}>
                      {copy.done}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
