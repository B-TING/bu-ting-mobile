import { Modal, Pressable, Text, View } from 'react-native';

import { appModalStyles } from '../../shared/modals/appModalStyles';

export type MediaSourcePickModalProps = {
  visible: boolean;
  title: string;
  libraryLabel: string;
  cameraLabel: string;
  cancelLabel: string;
  onPickLibrary: () => void;
  onPickCamera: () => void;
  onCancel: () => void;
};

/** 앨범 / 카메라 선택 — Alert 대신 앱 스타일 커스텀 모달 */
export function MediaSourcePickModal({
  visible,
  title,
  libraryLabel,
  cameraLabel,
  cancelLabel,
  onPickLibrary,
  onPickCamera,
  onCancel,
}: MediaSourcePickModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={appModalStyles.overlayCenter}>
        <Pressable
          style={appModalStyles.backdrop}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />

        <View style={appModalStyles.alertCard}>
          <Text className="text-center text-lg font-bold text-brand-text">{title}</Text>

          <View className="mt-5 gap-2">
            <Pressable
              onPress={onPickLibrary}
              className="items-center rounded-2xl bg-brand-primary py-3.5 active:opacity-90"
              accessibilityRole="button">
              <Text className="text-[15px] font-bold text-white">{libraryLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onPickCamera}
              className="items-center rounded-2xl border border-brand-border bg-white py-3.5 active:opacity-90"
              accessibilityRole="button">
              <Text className="text-[15px] font-bold text-brand-text">{cameraLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              className="items-center py-2.5 active:opacity-80"
              accessibilityRole="button">
              <Text className="text-sm font-semibold text-brand-muted">{cancelLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
