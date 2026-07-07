import type { ReactNode } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { isFestivalPlaceSearch } from '../../constants/places/placeSearch';
import { useCopy } from '../../i18n';
import type { CopyFor } from '../../i18n';
import { buildGoogleMapsUrl } from '../../utils/places/googleMapsUrl';
import type { BusanPlace } from '../../types/placeSearch';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import { PlaceGoogleDetailBody } from './PlaceGoogleDetailBody';

type Copy = CopyFor<'placeSearch'>;

type PlaceDetailPanelProps = {
  place: BusanPlace;
  detail: PlaceDetailVO | null;
  language: AppLanguage;
  copy?: Copy;
  loading?: boolean;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  headerExtra?: ReactNode;
  footerExtra?: ReactNode;
};

export function PlaceDetailPanel({
  place,
  detail,
  language,
  copy: copyProp,
  loading = false,
  bookmarked = false,
  onToggleBookmark,
  headerExtra,
  footerExtra,
}: PlaceDetailPanelProps) {
  const defaultCopy = useCopy('placeSearch');
  const copy = copyProp ?? defaultCopy;
  const categoryLabel = copy.categoryLabels[place.contentTypeId];
  const isFestival = isFestivalPlaceSearch(place.contentTypeId);
  const rating = detail?.rating ?? place.rating;
  const reviewCount = detail?.userRatingCount ?? place.userRatingsTotal;
  const metaLine = isFestival
    ? copy.festivalDetailMeta
    : copy.ratingSummary(rating, reviewCount);

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
    detailSectionEvent: copy.detailSectionEvent,
  };

  return (
    <View>
      {headerExtra}

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

      <Text className="mt-2 px-5 text-sm font-semibold text-brand-primary">{metaLine}</Text>

      <Pressable
        onPress={openGoogleMaps}
        accessibilityRole="button"
        className="mx-5 mt-3 items-center rounded-2xl border border-brand-primary bg-brand-selected py-3 active:opacity-90">
        <Text className="text-[15px] font-bold text-brand-primary">{copy.openInGoogleMaps}</Text>
      </Pressable>

      {footerExtra}

      <PlaceGoogleDetailBody
        detail={detail}
        loading={loading}
        fallbackAddress={place.address}
        copy={googleDetailCopy}
        showPriceLevel={place.contentTypeId === '32'}
        language={language}
        contentTypeId={place.contentTypeId}
      />
    </View>
  );
}
