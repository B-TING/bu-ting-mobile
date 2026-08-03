import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICON_COLOR_WHITE } from '../../../constants/icons';
import { AppIcon } from '../icons/AppIcon';
import { ResolvedRemoteVideo } from './ResolvedRemoteVideo';

type ReviewVideoPlayerModalProps = {
  visible: boolean;
  uri: string;
  fileKey?: string | null;
  onClose: () => void;
};

/** 후기/피드 영상 전체 화면 재생 */
export function ReviewVideoPlayerModal({
  visible,
  uri,
  fileKey,
  onClose,
}: ReviewVideoPlayerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.root}>
        {visible ? (
          <ResolvedRemoteVideo
            uri={uri}
            fileKey={fileKey}
            style={styles.video}
            paused={false}
            muted={false}
            repeat
            controls
            resizeMode="contain"
          />
        ) : null}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[styles.close, { top: insets.top + 8 }]}
          className="active:opacity-80">
          <AppIcon name="x" size={22} color={ICON_COLOR_WHITE} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
