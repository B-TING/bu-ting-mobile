import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FESTIVAL_CALENDAR_COPY } from '../../constants/festivalCalendar';
import { FestivalCommentsPlaceholder } from './FestivalCommentsPlaceholder';

type Copy = (typeof FESTIVAL_CALENDAR_COPY)['ko'];

const SHEET_HEIGHT_RATIO = 0.72;

type FestivalCommentsModalProps = {
  visible: boolean;
  copy: Copy;
  onClose: () => void;
};

export function FestivalCommentsModal({ visible, copy, onClose }: FestivalCommentsModalProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.close} />

        <View
          style={[
            styles.sheet,
            {
              maxHeight: sheetMaxHeight,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.handle} />
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <FestivalCommentsPlaceholder copy={copy} embedded />
          </ScrollView>
          <Pressable
            onPress={onClose}
            className="mx-5 mt-2 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
            <Text className="text-[15px] font-bold text-white">{copy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    zIndex: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    paddingBottom: 8,
  },
});
