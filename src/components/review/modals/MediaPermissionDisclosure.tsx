import { Linking, Modal, Pressable, Text, View } from 'react-native';

import { appModalStyles } from '../../shared/modals/appModalStyles';

export type MediaPermissionDisclosureProps = {
  visible: boolean;
  title: string;
  disclosure: string;
  detail: string;
  allowLabel: string;
  denyLabel: string;
  /** blocked(다시 묻지 않음)일 때 설정 이동 */
  openSettingsLabel?: string;
  mode?: 'request' | 'blocked';
  onAllow: () => void;
  onDeny: () => void;
};

/**
 * 사진·카메라 런타임 권한 요청 직전 커스텀 안내.
 * Android 시스템 권한 다이얼로그 대신 앱 UI로 먼저 설명하고, 허용 시 시스템에 요청합니다.
 */
export function MediaPermissionDisclosure({
  visible,
  title,
  disclosure,
  detail,
  allowLabel,
  denyLabel,
  openSettingsLabel,
  mode = 'request',
  onAllow,
  onDeny,
}: MediaPermissionDisclosureProps) {
  const primaryLabel =
    mode === 'blocked' ? (openSettingsLabel ?? allowLabel) : allowLabel;

  const handlePrimary = () => {
    if (mode === 'blocked') {
      void Linking.openSettings();
      onDeny();
      return;
    }
    onAllow();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDeny}>
      <View style={appModalStyles.overlayCenter}>
        <View style={appModalStyles.backdrop} pointerEvents="none" />

        <View style={appModalStyles.alertCard}>
          <Text className="text-center text-lg font-bold text-brand-text">{title}</Text>
          <Text className="mt-3 text-center text-sm font-semibold leading-6 text-brand-text">
            {disclosure}
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-brand-muted">{detail}</Text>

          <View className="mt-5 gap-2">
            <Pressable
              onPress={handlePrimary}
              className="items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90"
              accessibilityRole="button">
              <Text className="text-[15px] font-bold text-white">{primaryLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onDeny}
              className="items-center py-2.5 active:opacity-80"
              accessibilityRole="button">
              <Text className="text-sm font-semibold text-brand-muted">{denyLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
