import { useWindowDimensions, View } from 'react-native';

import { PLACE_SEARCH_COPY } from '../../constants/places/placeSearch';
import type { BusanPlace } from '../../types/placeSearch';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import { AppModal, AppModalActions } from '../shared/modals';
import { PlaceDetailPanel } from './PlaceDetailPanel';

type Copy = (typeof PLACE_SEARCH_COPY)['ko'];

const SHEET_HEIGHT_RATIO = 0.62;

type PlaceDetailSheetProps = {
  visible: boolean;
  place: BusanPlace | null;
  detail: PlaceDetailVO | null;
  language: AppLanguage;
  copy: Copy;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  onClose: () => void;
};

export function PlaceDetailSheet({
  visible,
  place,
  detail,
  language,
  copy,
  bookmarked = false,
  onToggleBookmark,
  onClose,
}: PlaceDetailSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  if (!place || !visible) {
    return null;
  }

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      maxHeight={sheetMaxHeight}
      closeAccessibilityLabel={copy.close}
      footer={
        <View className="mt-1 px-5 pb-5">
          <AppModalActions
            actions={[{ label: copy.close, onPress: onClose, variant: 'primary' }]}
          />
        </View>
      }>
      <PlaceDetailPanel
        place={place}
        detail={detail}
        language={language}
        copy={copy}
        bookmarked={bookmarked}
        onToggleBookmark={onToggleBookmark}
      />
    </AppModal>
  );
}
