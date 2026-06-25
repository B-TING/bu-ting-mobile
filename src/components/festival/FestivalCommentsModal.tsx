import { ScrollView, useWindowDimensions } from 'react-native';

import type { FESTIVAL_CALENDAR_COPY } from '../../constants/festival/festivalCalendar';
import { AppModal, AppModalActions } from '../shared/modals';
import { FestivalCommentsPlaceholder } from './FestivalCommentsPlaceholder';

type Copy = (typeof FESTIVAL_CALENDAR_COPY)['ko'];

const SHEET_HEIGHT_RATIO = 0.72;

type FestivalCommentsModalProps = {
  visible: boolean;
  copy: Copy;
  onClose: () => void;
};

export function FestivalCommentsModal({ visible, copy, onClose }: FestivalCommentsModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      maxHeight={sheetMaxHeight}
      closeAccessibilityLabel={copy.close}
      footer={
        <AppModalActions
          className="mt-2"
          actions={[{ label: copy.close, onPress: onClose, variant: 'primary' }]}
        />
      }>
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <FestivalCommentsPlaceholder copy={copy} embedded />
      </ScrollView>
    </AppModal>
  );
}
