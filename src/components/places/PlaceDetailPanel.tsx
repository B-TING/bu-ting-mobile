import { useEffect, useState, type ReactNode } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { catalogThumbnail } from '../../constants/places/placeCatalog';
import {
  ICON_COLOR_STAR_EMPTY,
} from '../../constants/icons';
import { isFestivalPlaceSearch } from '../../constants/places/placeSearch';
import { useCopy } from '../../i18n';
import { AppIcon } from '../shared/icons/AppIcon';
import type { CopyFor } from '../../i18n';
import { buildGoogleMapsUrl } from '../../utils/places/googleMapsUrl';
import type { BusanPlace } from '../../types/placeSearch';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import { PlaceGoogleDetailBody } from './PlaceGoogleDetailBody';

type Copy = CopyFor<'placeSearch'>;

const SHEET_HERO_HEIGHT = 220;

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
  close?: () => void;
  /** 일정 상세 시트 — 상단 히어로 이미지 레이아웃 */
  layout?: 'default' | 'sheetHeader';
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
  close,
  layout = 'default',
}: PlaceDetailPanelProps) {
  const defaultCopy = useCopy('placeSearch');
  const copy = copyProp ?? defaultCopy;
  const [imageFailed, setImageFailed] = useState(false);
  const categoryLabel = copy.categoryLabels[place.contentTypeId];
  const isFestival = isFestivalPlaceSearch(place.contentTypeId);
  const rating = detail?.rating ?? place.rating;
  const reviewCount = detail?.userRatingCount ?? place.userRatingsTotal;
  const metaLine = isFestival
    ? copy.festivalDetailMeta
    : copy.ratingSummary(rating, reviewCount);
  const imageUrl = detail?.imageUrl ?? place.imageUrl;
  const thumbColor = catalogThumbnail(place.contentId);
  const sheetHeader = layout === 'sheetHeader';

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

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
      <View
        className="w-full overflow-hidden bg-brand-surface"
        style={sheetHeader ? styles.sheetHero : styles.compactHero}>
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : sheetHeader ? (
          <View className="h-full w-full" style={{ backgroundColor: thumbColor }} />
        ) : null}
      </View>
      <View className="flex-row items-start justify-between gap-3 px-5 pt-5">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 justify-between">
            <Text className="text-xl font-bold text-brand-text">{place.name}</Text>
            {onToggleBookmark ? (
              <Pressable
                onPress={onToggleBookmark}
                accessibilityRole="button"
                accessibilityLabel={bookmarked ? copy.unbookmark : copy.bookmark}
                className={`flex-row items-center gap-1 rounded-full px-1 py-1 active:opacity-80 ${
                  bookmarked ? 'bg-amber-100' : 'bg-brand-selected'
                }`}>
                <AppIcon
                  name={bookmarked ? 'mapPin' : 'star'}
                  size={14}
                  color={bookmarked ? '#B45309' : ICON_COLOR_STAR_EMPTY}
                  filled={bookmarked}
                />
              </Pressable>
            ) : null}
          </View>
          <Text className="mt-1 text-[10px] font-semibold text-brand-primary">{categoryLabel}</Text>
          <Text className="mt-1 text-sm font-semibold text-brand-primary">{metaLine}</Text>
        </View>
        {!sheetHeader ? (
          <View
            className="h-[64px] w-[64px] overflow-hidden rounded-xl bg-brand-surface"
            style={!imageUrl || imageFailed ? { backgroundColor: thumbColor } : undefined}>
            {imageUrl && !imageFailed ? (
              <Image
                source={{ uri: imageUrl }}
                className="h-full w-full"
                resizeMode="cover"
                onError={() => setImageFailed(true)}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      

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

const styles = StyleSheet.create({
  compactHero: {
    height: 100,
  },
  sheetHero: {
    height: SHEET_HERO_HEIGHT,
  },
});
