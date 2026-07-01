import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { ACCOMMODATION_COPY, localizedAreaName } from '../../constants/places/accommodation';
import { fetchAccommodationDetail, buildGoogleMapsUrl } from '../../kakaoMap';
import type { BusanAccommodation } from '../../types/accommodation';
import type { AccommodationPlaceDetail } from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import { PlaceGoogleDetailBody } from '../places/PlaceGoogleDetailBody';
import { AppModal, AppModalActions } from '../shared/modals';

type Copy = (typeof ACCOMMODATION_COPY)['ko'];

const SHEET_HEIGHT_RATIO = 0.62;

type AccommodationDetailSheetProps = {
  visible: boolean;
  stay: BusanAccommodation | null;
  language: AppLanguage;
  copy: Copy;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  onClose: () => void;
};

export function AccommodationDetailSheet({
  visible,
  stay,
  language,
  copy,
  bookmarked = false,
  onToggleBookmark,
  onClose,
}: AccommodationDetailSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  const [detail, setDetail] = useState<AccommodationPlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !stay) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchAccommodationDetail(stay.internalPlaceId)
      .then(result => {
        if (!cancelled) {
          setDetail(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, stay]);

  if (!stay) {
    return null;
  }

  const openGoogleMaps = () => {
    if (detail) {
      Linking.openURL(buildGoogleMapsUrl(detail)).catch(() => {});
      return;
    }
    const query = encodeURIComponent(stay.name);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${stay.googlePlaceId}`,
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
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      maxHeight={sheetMaxHeight}
      closeAccessibilityLabel={copy.close}
      footer={
        <View className="mt-2 px-5">
          <Pressable
            onPress={openGoogleMaps}
            className="mb-2 items-center rounded-2xl border border-brand-primary bg-brand-selected py-3 active:opacity-90">
            <Text className="text-[15px] font-bold text-brand-primary">{copy.openInGoogleMaps}</Text>
          </Pressable>
          <AppModalActions
            actions={[{ label: copy.close, onPress: onClose, variant: 'primary' }]}
          />
        </View>
      }>
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Text className="flex-1 text-xl font-bold text-brand-text">{stay.name}</Text>
            <View className="rounded-full bg-brand-selected px-2.5 py-1">
              <Text className="text-[10px] font-semibold text-brand-primary">
                {copy.areaLabel(localizedAreaName(stay, language))}
              </Text>
            </View>
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

        <Text className="mt-1 text-sm font-semibold text-brand-primary">
          {copy.ratingSummary(stay.rating, stay.userRatingsTotal)}
        </Text>

        <PlaceGoogleDetailBody
          detail={detail}
          loading={loading}
          fallbackAddress={stay.formattedAddress}
          copy={googleDetailCopy}
          showPriceLevel
        />
      </ScrollView>
    </AppModal>
  );
}
