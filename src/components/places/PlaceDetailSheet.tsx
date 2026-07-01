import { Linking, Pressable, Text, useWindowDimensions, View } from 'react-native';

import { PLACE_SEARCH_COPY } from '../../constants/places/placeSearch';
import { buildGoogleMapsUrl } from '../../kakaoMap';
import type { BusanPlace } from '../../types/placeSearch';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import { AppModal, AppModalActions } from '../shared/modals';
import { PlaceGoogleDetailBody } from './PlaceGoogleDetailBody';

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

  const categoryLabel = copy.categoryLabels[place.contentTypeId];
  const rating = detail?.rating ?? place.rating;
  const reviewCount = detail?.userRatingCount ?? place.userRatingsTotal;

  const openGoogleMaps = () => {
    if (detail) {
      Linking.openURL(buildGoogleMapsUrl(detail)).catch(() => {});
      return;
    }
    const query = encodeURIComponent(place.name);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
    ).catch(() => {});
  };

  const googleDetailCopy = {
    detailLoading: copy.detailLoading,
    notFound: copy.notFound,
    addressLabel: copy.addressLabel,
    phoneLabel: copy.phoneLabel,
    hoursLabel: copy.hoursLabel,
    openNow: copy.openNow,
    closedNow: copy.closedNow,
    reviewsTitle: copy.reviewsTitle,
    reviewsSource: copy.reviewsSource,
    priceLevelLabel: copy.priceLevelLabel,
    priceLevel: copy.priceLevel,
    detailSectionInfo: copy.detailSectionInfo,
    detailSectionFacility: copy.detailSectionFacility,
    detailSectionReviews: copy.detailSectionReviews,
    detailSectionEmpty: copy.detailSectionEmpty,
  };

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
      
        <View className="flex-row items-start justify-between gap-3 px-5">
          <Text className="min-w-0 flex-1 pr-2 text-xl font-bold text-brand-text">{place.name}</Text>
          <View className="shrink-0 items-end gap-2">
            <View className="rounded-full bg-brand-selected px-2.5 py-1">
              <Text className="text-[10px] font-semibold text-brand-primary">{categoryLabel}</Text>
            </View>
            {onToggleBookmark ? (
              <Pressable
                onPress={onToggleBookmark}
                accessibilityRole="button"
                accessibilityLabel={bookmarked ? copy.unbookmark : copy.bookmark}
                className={`flex-row items-center gap-1 rounded-full px-3 py-2 active:opacity-80 ${
                  bookmarked ? 'bg-amber-100' : 'bg-brand-selected'
                }`}>
                <Text className="text-sm">{bookmarked ? '📌' : '☆'}</Text>
                <Text
                  className={`text-xs font-bold ${
                    bookmarked ? 'text-amber-700' : 'text-brand-primary'
                  }`}>
                  {bookmarked ? copy.unbookmark : copy.bookmark}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text className="mt-2 text-sm font-semibold text-brand-primary px-5">
          {copy.ratingSummary(rating, reviewCount)}
        </Text>

        <Pressable
          onPress={openGoogleMaps}
          accessibilityRole="button"
          className="mx-5 mt-3 items-center rounded-2xl border border-brand-primary bg-brand-selected py-3 active:opacity-90">
          <Text className="text-[15px] font-bold text-brand-primary">{copy.openInGoogleMaps}</Text>
        </Pressable>
        <PlaceGoogleDetailBody
          detail={detail}
          loading={false}
          fallbackAddress={place.address}
          copy={googleDetailCopy}
          showPriceLevel={place.contentTypeId === '32'}
        />
    </AppModal>
  );
}
