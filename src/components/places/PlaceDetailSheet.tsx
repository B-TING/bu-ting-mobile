import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { PLACE_SEARCH_COPY } from '../../constants/places/placeSearch';
import { fetchPlaceDetail } from '../../services/places/placesApiService';
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
  language: AppLanguage;
  copy: Copy;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  onClose: () => void;
};

export function PlaceDetailSheet({
  visible,
  place,
  language,
  copy,
  bookmarked = false,
  onToggleBookmark,
  onClose,
}: PlaceDetailSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  const [detail, setDetail] = useState<PlaceDetailVO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !place) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const googleSearchText = [place.name, place.address].filter(Boolean).join(' ');

    fetchPlaceDetail({
      contentId: place.contentId,
      contentTypeId: place.contentTypeId,
      googleSearchText,
    })
      .then(result => {
        if (!cancelled) {
          setDetail(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
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
  }, [visible, place]);

  if (!place) {
    return null;
  }

  const categoryLabel = copy.categoryLabels[place.contentTypeId];

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
            <Text className="flex-1 text-xl font-bold text-brand-text">{place.name}</Text>
            <View className="rounded-full bg-brand-selected px-2.5 py-1">
              <Text className="text-[10px] font-semibold text-brand-primary">{categoryLabel}</Text>
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
          {copy.ratingSummary(place.rating, place.userRatingsTotal)}
        </Text>

        <PlaceGoogleDetailBody
          detail={detail}
          loading={loading}
          fallbackAddress={place.address}
          copy={googleDetailCopy}
          showPriceLevel={place.contentTypeId === '32'}
        />
      </ScrollView>
    </AppModal>
  );
}
