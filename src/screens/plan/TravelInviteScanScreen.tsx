import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, CameraType } from 'react-native-camera-kit';

import { AppIcon } from '../../components/shared/icons/AppIcon';
import { AppModal, AppModalActions } from '../../components/shared/modals';
import { ICON_COLOR_WHITE } from '../../constants/icons';
import { useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  acceptAndSyncTravelInvite,
  previewTravelInvite,
} from '../../services/travel/acceptTravelInviteFlow';
import { TravelServiceError } from '../../services/travel/travelService';
import {
  selectReusableAccessToken,
  useAuthStore,
} from '../../stores/useAuthStore';
import {
  hasCameraPermission,
  requestCameraPermission,
} from '../../utils/media/mediaPermissions';
import { parseInviteTokenFromUrl } from '../../utils/travel/parseInviteToken';

type Props = NativeStackScreenProps<RootStackParamList, 'TravelInviteScan'>;

type Phase = 'permission' | 'scanning' | 'busy' | 'confirm';

export function TravelInviteScanScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const copy = useCopy('planDetail');
  const accessToken = useAuthStore(selectReusableAccessToken);

  const [phase, setPhase] = useState<Phase>('permission');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      navigation.replace('Login');
    }
  }, [accessToken, navigation]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const granted =
        (await hasCameraPermission()) ||
        (await requestCameraPermission()) === 'granted';
      if (cancelled) {
        return;
      }
      setPhase(granted ? 'scanning' : 'permission');
      if (!granted) {
        setErrorMessage(copy.inviteScanCameraDenied);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, copy.inviteScanCameraDenied]);

  const runVerify = useCallback(
    async (raw: string) => {
      const token = parseInviteTokenFromUrl(raw);
      if (!token) {
        setErrorMessage(copy.inviteScanInvalid);
        lockRef.current = false;
        return;
      }
      setPhase('busy');
      setErrorMessage(null);
      try {
        const preview = await previewTravelInvite(token);
        setPendingToken(token);
        setPreviewName(preview.travelName);
        setPhase('confirm');
      } catch (error) {
        setErrorMessage(
          error instanceof TravelServiceError || error instanceof Error
            ? error.message
            : copy.inviteScanVerifyFailed,
        );
        setPhase('scanning');
        lockRef.current = false;
      }
    },
    [copy.inviteScanInvalid, copy.inviteScanVerifyFailed],
  );

  const onReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      if (lockRef.current || phase !== 'scanning') {
        return;
      }
      const value = event.nativeEvent.codeStringValue?.trim();
      if (!value) {
        return;
      }
      lockRef.current = true;
      void runVerify(value);
    },
    [phase, runVerify],
  );

  const onSubmitManual = useCallback(() => {
    if (lockRef.current || phase === 'busy') {
      return;
    }
    lockRef.current = true;
    void runVerify(manualInput);
  }, [manualInput, phase, runVerify]);

  const closeConfirm = useCallback(() => {
    setPendingToken(null);
    setPreviewName(null);
    setPhase('scanning');
    lockRef.current = false;
  }, []);

  const onConfirmJoin = useCallback(async () => {
    if (!pendingToken || !accessToken) {
      return;
    }
    setPhase('busy');
    try {
      const joined = await acceptAndSyncTravelInvite(accessToken, pendingToken);
      navigation.replace('PlanDetail', { planId: joined.planId });
    } catch (error) {
      setErrorMessage(
        error instanceof TravelServiceError || error instanceof Error
          ? error.message
          : copy.inviteScanAcceptFailed,
      );
      setPhase('scanning');
      lockRef.current = false;
      setPendingToken(null);
      setPreviewName(null);
    }
  }, [accessToken, copy.inviteScanAcceptFailed, navigation, pendingToken]);

  if (!accessToken) {
    return <View className="flex-1 bg-black" />;
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          className="mr-2 h-10 w-10 items-center justify-center rounded-lg active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={copy.close}>
          <AppIcon name="arrowLeft" size={24} color={ICON_COLOR_WHITE} />
        </Pressable>
        <Text className="ml-1 flex-1 text-base font-bold text-white">
          {copy.inviteScanTitle}
        </Text>
      </View>

      {phase === 'scanning' || phase === 'busy' || phase === 'confirm' ? (
        <View className="flex-1">
          {phase === 'scanning' ? (
            <Camera
              style={StyleSheet.absoluteFill}
              cameraType={CameraType.Back}
              scanBarcode
              showFrame
              laserColor="#0077B6"
              frameColor="#FFFFFF"
              scanThrottleDelay={1500}
              onReadCode={onReadCode}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-black/80">
              <ActivityIndicator color="#FFFFFF" />
              <Text className="mt-3 text-sm text-white">{copy.inviteScanWorking}</Text>
            </View>
          )}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-white">{errorMessage}</Text>
          <Pressable
            onPress={() => {
              setErrorMessage(null);
              void requestCameraPermission().then(result => {
                if (result === 'granted') {
                  setPhase('scanning');
                }
              });
            }}
            className="mt-4 rounded-2xl bg-brand-primary px-5 py-3">
            <Text className="text-sm font-bold text-white">{copy.inviteRetry}</Text>
          </Pressable>
        </View>
      )}

      <View
        className="border-t border-white/20 bg-black px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {errorMessage && phase === 'scanning' ? (
          <Text className="mb-2 text-center text-xs text-red-300">{errorMessage}</Text>
        ) : null}
        <Text className="mb-2 text-xs text-white/70">{copy.inviteScanManualHint}</Text>
        <TextInput
          value={manualInput}
          onChangeText={setManualInput}
          placeholder={copy.inviteScanManualPlaceholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          autoCapitalize="none"
          autoCorrect={false}
          className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white"
        />
        <Pressable
          onPress={onSubmitManual}
          disabled={!manualInput.trim() || phase === 'busy'}
          className="mt-3 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
          <Text className="text-sm font-bold text-white">{copy.inviteScanManualSubmit}</Text>
        </Pressable>
      </View>

      <AppModal
        visible={phase === 'confirm' && Boolean(previewName)}
        onClose={closeConfirm}
        title={copy.inviteConfirmTitle}
        subtitle={
          previewName
            ? copy.inviteConfirmSubtitle(previewName)
            : copy.inviteConfirmTitle
        }
        closeAccessibilityLabel={copy.close}>
        <AppModalActions
          className="px-5 pb-4"
          actions={[
            {
              label: copy.inviteConfirmJoin,
              onPress: () => {
                void onConfirmJoin();
              },
              variant: 'primary',
            },
            {
              label: copy.close,
              onPress: closeConfirm,
              variant: 'secondary',
            },
          ]}
        />
      </AppModal>
    </View>
  );
}
