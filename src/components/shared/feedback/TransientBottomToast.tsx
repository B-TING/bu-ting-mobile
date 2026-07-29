import { Animated, Modal, StyleSheet, Text, View } from 'react-native';

type TransientBottomToastProps = {
  text: string | null;
  opacity: Animated.Value;
  bottom: number;
};

/** 하단에 잠시 표시되는 안내 토스트 (Modal — WebView 위에 표시) */
export function TransientBottomToast({ text, opacity, bottom }: TransientBottomToastProps) {
  if (!text) {
    return null;
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View pointerEvents="none" style={styles.overlay}>
        <Animated.View style={[styles.shell, { bottom, opacity }]}>
          <Text style={styles.message}>{text}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  shell: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 20,
  },
  message: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Medium',
  },
});
