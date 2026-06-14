import { Modal, Pressable, Text, View } from 'react-native';

import { appModalStyles } from './appModalStyles';
import { AppModalActions, type AppModalAction } from './AppModalActions';

export type AppAlertButton = AppModalAction;

export type AppAlertModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
  onClose: () => void;
};

export function AppAlertModal({
  visible,
  title,
  message,
  buttons,
  onClose,
}: AppAlertModalProps) {
  const resolvedButtons: AppAlertButton[] =
    buttons && buttons.length > 0
      ? buttons.map(btn => ({
          ...btn,
          onPress: () => {
            btn.onPress();
            onClose();
          },
        }))
      : [{ label: 'OK', onPress: onClose, variant: 'primary' }];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={appModalStyles.overlayCenter}>
        <Pressable style={appModalStyles.backdrop} onPress={onClose} accessibilityRole="button" />

        <View style={appModalStyles.alertCard}>
          <Text className="text-center text-lg font-bold text-brand-text">{title}</Text>
          {message ? (
            <Text className="mt-2 text-center text-sm leading-6 text-brand-muted">{message}</Text>
          ) : null}

          <AppModalActions className="mt-5 px-0" actions={resolvedButtons} />
        </View>
      </View>
    </Modal>
  );
}
