import { useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  type KeyboardEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appModalStyles } from './appModalStyles';

export type AppModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  maxHeight?: number | `${number}%`;
  keyboardAware?: boolean;
  showHandle?: boolean;
  closeAccessibilityLabel?: string;
  backdropDismiss?: boolean;
  overlayAccessory?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AppModal({
  visible,
  onClose,
  children,
  title,
  subtitle,
  footer,
  maxHeight,
  keyboardAware = false,
  showHandle = true,
  closeAccessibilityLabel = 'Close',
  backdropDismiss = true,
  overlayAccessory,
  contentStyle,
}: AppModalProps) {
  const insets = useSafeAreaInsets();
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!visible || !keyboardAware) {
      setKeyboardInset(0);
      return;
    }

    if (Platform.OS !== 'ios') {
      return;
    }

    const onShow = (event: KeyboardEvent) => {
      setKeyboardInset(event.endCoordinates.height);
    };
    const onHide = () => setKeyboardInset(0);

    const showSub = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible, keyboardAware]);

  const keyboardOffset =
    keyboardAware && Platform.OS === 'ios'
      ? Math.max(0, keyboardInset - insets.bottom)
      : 0;

  const sheetBottomPad = Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[appModalStyles.overlay, keyboardOffset > 0 && { paddingBottom: keyboardOffset }]}>
        <Pressable
          style={appModalStyles.backdrop}
          onPress={backdropDismiss ? onClose : undefined}
          accessibilityLabel={closeAccessibilityLabel}
          accessibilityRole="button"
        />

        {overlayAccessory}

        <View
          style={[
            appModalStyles.sheet,
            maxHeight != null ? { maxHeight } : null,
            { paddingBottom: sheetBottomPad },
            contentStyle,
          ]}>
          {showHandle ? <View style={appModalStyles.handle} /> : null}

          {title ? (
            <Text className="mb-1 px-5 text-lg font-bold text-brand-text">{title}</Text>
          ) : null}
          {subtitle ? (
            <Text className="mb-3 px-5 text-sm text-brand-muted">{subtitle}</Text>
          ) : null}

          {children}
          {footer}
        </View>
      </View>
    </Modal>
  );
}
