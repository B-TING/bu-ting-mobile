import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildGoogleMapsUrl,
  fetchRoutePlaceDetail,
  shouldFetchGooglePlaceDetail,
} from '../../../services/googlePlacesService';
import type { PlaceReview } from '../../../types/travelReview';
import type { RouteItem } from '../../../types/travelPlan';
import type { PlaceDetailVO } from '../../../types/googlePlaces';
import type { AppLanguage } from '../../../types/user';
import { RouteMapView } from '../../map/RouteMapView';
import { PlaceGoogleDetailBody } from '../../places/PlaceGoogleDetailBody';
import { StarRating } from '../../shared/rating/StarRating';
import { AppModal, AppModalActions } from '../../shared/modals';

/** 상단 지도 영역 (화면 대비) */
const MAP_AREA_RATIO = 0.4;

type PlaceDetailModalProps = {
  visible: boolean;
  route: RouteItem | null;
  language: AppLanguage;
  copy: {
    markVisited: string;
    visited: string;
    directions: string;
    mapPlaceholder: string;
    mapPlaceholderSub: string;
    mapTapHint: string;
    dwell: (m: number) => string;
    close: string;
    writeReview?: string;
    editReview?: string;
    visitFirstReview?: string;
    detailLoading: string;
    notFound: string;
    addressLabel: string;
    phoneLabel: string;
    hoursLabel: string;
    openNow: string;
    closedNow: string;
    reviewsTitle: string;
    reviewsSource: string;
    openInGoogleMaps: string;
    placeRatingSummary: (rating: number, count: number) => string;
  };
  placeReview?: PlaceReview;
  onClose: () => void;
  onToggleVisited: () => void;
  onWriteReview?: () => void;
};

export function PlaceDetailModal({
  visible,
  route,
  language,
  copy,
  placeReview,
  onClose,
  onToggleVisited,
  onWriteReview,
}: PlaceDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [googleDetail, setGoogleDetail] = useState<PlaceDetailVO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const sheetHeight = screenHeight;
  const mapAreaHeight = Math.round(screenHeight * MAP_AREA_RATIO);

  const showGoogleDetail = route != null && shouldFetchGooglePlaceDetail(route.type);

  useEffect(() => {
    if (!visible || !route || !showGoogleDetail) {
      setGoogleDetail(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

    fetchRoutePlaceDetail(route.placeId, route.type)
      .then(result => {
        if (!cancelled) {
          setGoogleDetail(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, route?.placeId, route?.type, showGoogleDetail]);

  const mapRoute = useMemo(() => {
    if (!route) {
      return null;
    }
    if (googleDetail?.location) {
      return { ...route, location: googleDetail.location };
    }
    return route;
  }, [route, googleDetail?.location]);

  if (!route || !mapRoute) {
    return null;
  }

  const info = mapRoute.placeInfo;
  const rating = googleDetail?.rating ?? info?.rating;
  const reviewCount = googleDetail?.userRatingCount ?? info?.reviewCount ?? 0;
  const category =
    googleDetail?.primaryTypeLabel ??
    googleDetail?.googleMapsTypeLabel ??
    info?.category;

  const openGoogleMaps = () => {
    if (googleDetail) {
      Linking.openURL(buildGoogleMapsUrl(googleDetail)).catch(() => {});
      return;
    }
    const query = encodeURIComponent(route.placeName);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}&center=${route.location.lat},${route.location.lng}`,
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
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      showHandle={false}
      backdropDismiss
      maxHeight={sheetHeight}
      closeAccessibilityLabel={copy.close}
      contentStyle={[styles.sheet, { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.body}>
        <View style={[styles.mapArea, { height: mapAreaHeight }]}>
          <RouteMapView
            title={copy.mapPlaceholder}
            subtitle={copy.mapPlaceholderSub}
            routes={[mapRoute]}
            highlightItemId={mapRoute.itemId}
            size="fill"
            showFooter={false}
          />
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={copy.close}
            style={[styles.mapCloseBtn, { top: insets.top + 8 }]}>
            <Text style={styles.mapCloseText}>{copy.close}</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}>
          <Text className="text-xl font-bold text-brand-text">{route.placeName}</Text>

          {rating != null || category ? (
            <Text className="mt-2 text-sm font-semibold text-brand-primary">
              {[rating != null ? copy.placeRatingSummary(rating, reviewCount) : null, category]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          ) : null}

          <View className="mt-4 flex-row flex-wrap gap-2">
            <Pressable
              onPress={onToggleVisited}
              className="rounded-full bg-brand-selected px-3 py-2 active:opacity-80">
              <Text className="text-sm font-semibold text-brand-primary">
                {route.isVisited ? copy.visited : copy.markVisited}
              </Text>
            </Pressable>
            <Pressable
              onPress={openGoogleMaps}
              className="rounded-full bg-brand-border px-3 py-2 active:opacity-80">
              <Text className="text-sm font-semibold text-brand-text">{copy.directions}</Text>
            </Pressable>
            {onWriteReview && copy.writeReview ? (
              <Pressable
                onPress={route.isVisited ? onWriteReview : undefined}
                disabled={!route.isVisited}
                className={`rounded-full px-3 py-2 ${
                  route.isVisited ? 'bg-brand-primary active:opacity-80' : 'bg-brand-border opacity-60'
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    route.isVisited ? 'text-white' : 'text-brand-muted'
                  }`}>
                  {placeReview ? (copy.editReview ?? copy.writeReview) : copy.writeReview}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {placeReview ? (
            <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <Text className="mb-2 text-xs font-bold text-brand-muted">
                {language === 'ko' ? '내 후기' : 'My review'}
              </Text>
              <StarRating value={placeReview.rating} readonly size="sm" />
              {placeReview.comment ? (
                <Text className="mt-2 text-sm text-brand-text">{placeReview.comment}</Text>
              ) : null}
            </View>
          ) : route.isVisited && copy.visitFirstReview && onWriteReview ? (
            <Text className="mt-2 text-xs text-brand-muted">{copy.visitFirstReview}</Text>
          ) : null}

          {showGoogleDetail ? (
            <PlaceGoogleDetailBody
              detail={googleDetail}
              loading={loadingDetail}
              fallbackAddress={info?.address}
              copy={googleDetailCopy}
            />
          ) : info ? (
            <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <Text className="mb-2 text-sm leading-5 text-brand-text">{info.description}</Text>
              {info.dwellMinutes ? (
                <Text className="mb-1 text-xs text-brand-muted">{copy.dwell(info.dwellMinutes)}</Text>
              ) : null}
              <Text className="text-xs text-brand-muted">{info.hours}</Text>
              <Text className="mt-1 text-xs text-brand-muted">{info.address}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t border-brand-border bg-brand-background px-5 pt-3">
          {showGoogleDetail ? (
            <Pressable
              onPress={openGoogleMaps}
              className="mb-2 items-center rounded-2xl border border-brand-primary bg-brand-selected py-3 active:opacity-90">
              <Text className="text-[15px] font-bold text-brand-primary">{copy.openInGoogleMaps}</Text>
            </Pressable>
          ) : null}
          <AppModalActions actions={[{ label: copy.close, onPress: onClose, variant: 'primary' }]} />
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  body: {
    flex: 1,
  },
  mapArea: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#E8F0F8',
  },
  mapCloseBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0077B6',
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
});
