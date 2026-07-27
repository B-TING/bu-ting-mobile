import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCopy } from '../../../i18n';
import { useCachedRoutePlaceDetail } from '../../../hooks/useCachedRoutePlaceDetail';
import { shouldFetchRoutePlaceDetail } from '../../../utils/places/routePlaceDetail';
import type { PlaceReview } from '../../../types/travelReview';
import type { RouteItem } from '../../../types/travelPlan';
import type { AppLanguage } from '../../../types/user';
import { RouteMapView } from '../../../kakaoMap';
import { routeItemToBusanPlaceFallback } from '../../../utils/places/placeModelBridge';
import { PlaceDetailPanel } from '../../places/PlaceDetailPanel';
import { StarRating } from '../../shared/rating/StarRating';
import { AppModal, AppModalActions } from '../../shared/modals';

const MAP_AREA_RATIO = 0.34;
const MAP_AREA_MAX = 280;

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
  const searchCopy = useCopy('placeSearch');

  const mapAreaHeight = Math.min(Math.round(screenHeight * MAP_AREA_RATIO), MAP_AREA_MAX);

  const showPlaceSearchDetail = route != null && shouldFetchRoutePlaceDetail(route.type);
  const { detail, loading: loadingDetail } = useCachedRoutePlaceDetail(
    route,
    visible && showPlaceSearchDetail,
  );

  const busanPlace = useMemo(
    () => (route ? routeItemToBusanPlaceFallback(route) : null),
    [route],
  );

  if (!route || !busanPlace) {
    return null;
  }

  const info = route.placeInfo;

  const scheduleActions = (
    <View className="px-5">
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Pressable
          onPress={onToggleVisited}
          className="rounded-full bg-brand-selected px-3 py-2 active:opacity-80">
          <Text className="text-sm font-semibold text-brand-primary">
            {route.isVisited ? copy.visited : copy.markVisited}
          </Text>
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
          {placeReview.content ? (
            <Text className="mt-2 text-sm text-brand-text">{placeReview.content}</Text>
          ) : null}
        </View>
      ) : route.isVisited && copy.visitFirstReview && onWriteReview ? (
        <Text className="mt-2 text-xs text-brand-muted">{copy.visitFirstReview}</Text>
      ) : null}
    </View>
  );

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      showHandle={false}
      backdropDismiss
      maxHeight={screenHeight}
      closeAccessibilityLabel={copy.close}
      contentStyle={[
        styles.sheet,
        {
          height: screenHeight,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}>
      <View style={styles.body}>
        <View style={[styles.mapArea, { height: mapAreaHeight }]}>
          <RouteMapView
            title={copy.mapPlaceholder}
            subtitle={copy.mapPlaceholderSub}
            routes={[route]}
            highlightItemId={route.itemId}
            size="fill"
            showFooter={false}
          />
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={copy.close}
            style={styles.mapCloseBtn}>
            <Text style={styles.mapCloseText}>{copy.close}</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}>
          {showPlaceSearchDetail ? (
            <PlaceDetailPanel
              place={busanPlace}
              detail={detail}
              language={language}
              copy={searchCopy}
              loading={loadingDetail}
              footerExtra={scheduleActions}
            />
          ) : info ? (
            <View className="px-5">
              <Text className="text-xl font-bold text-brand-text">{route.placeName}</Text>
              {scheduleActions}
              <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
                <Text className="mb-2 text-sm leading-5 text-brand-text">{info.description}</Text>
                {info.dwellMinutes ? (
                  <Text className="mb-1 text-xs text-brand-muted">{copy.dwell(info.dwellMinutes)}</Text>
                ) : null}
                <Text className="text-xs text-brand-muted">{info.hours}</Text>
                <Text className="mt-1 text-xs text-brand-muted">{info.address}</Text>
              </View>
            </View>
          ) : (
            scheduleActions
          )}
        </ScrollView>

        <View style={styles.footer}>
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
    top: 10,
    right: 12,
    zIndex: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    // paddingVertical: 7,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  mapCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0077B6',
  },
  detailScroll: {
    flex: 1,
    marginTop: -14,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  detailContent: {
    paddingTop: 22,
    paddingBottom: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
