import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { ICON_COLOR_MUTED, ICON_COLOR_WHITE } from '../../constants/icons';
import {
  eventGameObjectLabel,
  isCameraEventGame,
  mockEvaluateGameCapture,
} from '../../constants/eventZone/eventGame';
import { useEventAuthRadiusGate } from '../../hooks/eventZone/useEventAuthRadiusGate';
import { useAppLanguage, useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useZoneEventStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'EventGameCamera'>;

type CapturePhase = 'ready' | 'processing' | 'result';

export function EventGameCameraScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('eventGame');
  const { checking, assertWithinRadius } = useEventAuthRadiusGate();

  const activeEventsByZone = useZoneEventStore(s => s.activeEventsByZone);
  const event = useMemo(
    () => Object.values(activeEventsByZone).find(item => item?.id === eventId),
    [activeEventsByZone, eventId],
  );

  const [phase, setPhase] = useState<CapturePhase>('ready');
  const [success, setSuccess] = useState(false);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    if (!event || !isCameraEventGame(event)) {
      navigation.goBack();
    }
  }, [event, navigation]);

  if (!event || !isCameraEventGame(event)) {
    return null;
  }

  const objectLabel = eventGameObjectLabel(event, language);
  const hintText =
    event.type === 'place_auth'
      ? copy.cameraHintPlace
      : copy.cameraHintObject(objectLabel);
  const processingText =
    event.type === 'place_auth' ? copy.processingPlace : copy.processingObject;

  const handleCapture = async () => {
    if (phase !== 'ready' || checking) {
      return;
    }

    const within = await assertWithinRadius(event);
    if (!within) {
      return;
    }

    setCaptured(true);
    setPhase('processing');

    setTimeout(() => {
      const ok = mockEvaluateGameCapture(event);
      setSuccess(ok);
      setPhase('result');
    }, 1400);
  };

  const handleCloseResult = () => {
    navigation.navigate('EventZone');
  };

  const handleRetry = () => {
    setCaptured(false);
    setPhase('ready');
    setSuccess(false);
  };

  return (
    <View className="flex-1 bg-black">
      <View
        className="absolute left-0 right-0 z-10 flex-row items-center justify-between px-3"
        style={{ top: insets.top + 8 }}>
        <View className="rounded-full bg-black/50">
          <BackButton
            accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
            onPress={() => navigation.goBack()}
          />
        </View>
        <View className="rounded-full bg-black/50 px-3 py-1.5">
          <Text className="text-xs font-semibold text-white">{event.titleKo}</Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl border-2 border-white/20 bg-neutral-900">
          {captured ? (
            <View className="flex-1 items-center justify-center bg-neutral-800">
              <AppIcon name="camera" size={48} color={ICON_COLOR_MUTED} />
              <Text className="mt-3 text-sm text-white/70">{copy.mockCameraLabel}</Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <View className="rounded-full border-2 border-dashed border-white/30 p-8">
                <AppIcon name="camera" size={56} color={ICON_COLOR_WHITE} />
              </View>
              <Text className="mt-4 px-6 text-center text-sm text-white/80">{hintText}</Text>
              <Text className="mt-2 px-6 text-center text-xs text-white/50">
                {copy.radiusHint}
              </Text>
            </View>
          )}

          {phase === 'processing' || checking ? (
            <View className="absolute inset-0 items-center justify-center bg-black/70">
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text className="mt-3 text-sm font-semibold text-white">
                {checking ? copy.checkingLocation : processingText}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        className="items-center pb-4"
        style={{ paddingBottom: insets.bottom + 24 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.capture}
          disabled={phase !== 'ready' || checking}
          onPress={handleCapture}
          className="h-20 w-20 items-center justify-center rounded-full border-4 border-white active:opacity-80 disabled:opacity-40">
          <View className="h-14 w-14 rounded-full bg-white" />
        </Pressable>
        <Text className="mt-3 text-sm font-semibold text-white">
          {checking ? copy.checkingLocation : copy.capture}
        </Text>
      </View>

      <Modal visible={phase === 'result'} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-brand-surface p-6">
            <Text className="text-center text-4xl">{success ? '🎉' : '😅'}</Text>
            <Text className="mt-3 text-center text-xl font-bold text-brand-text">
              {success ? copy.successTitle : copy.failTitle}
            </Text>
            <Text className="mt-2 text-center text-sm leading-relaxed text-brand-muted">
              {success
                ? event.type === 'place_auth'
                  ? copy.successPlace
                  : copy.successObject(objectLabel)
                : event.type === 'place_auth'
                  ? copy.failPlace
                  : copy.failObject}
            </Text>
            <View className="mt-6 flex-row gap-2">
              {!success ? (
                <Pressable
                  onPress={handleRetry}
                  className="flex-1 items-center rounded-2xl border border-brand-border py-3 active:opacity-80">
                  <Text className="font-semibold text-brand-text">{copy.retry}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleCloseResult}
                className="flex-1 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
                <Text className="font-bold text-white">{copy.done}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
