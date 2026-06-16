import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteMapView } from '../../map/RouteMapView';
import type { PlaceReview } from '../../../types/travelReview';
import type { RouteItem } from '../../../types/travelPlan';
import { StarRating } from '../../shared/rating/StarRating';
import { AppModal, AppModalActions } from '../../shared/modals';

/** 하단 시트 최대 높이 (화면 대비) */
const SHEET_HEIGHT_RATIO = 0.52;
/** 지도 확대 시 상단 지도 영역 */
const MAP_AREA_RATIO = 0.5;

type PlaceDetailModalProps = {
  visible: boolean;
  route: RouteItem | null;
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
  };
  placeReview?: PlaceReview;
  onClose: () => void;
  onToggleVisited: () => void;
  onWriteReview?: () => void;
};

export function PlaceDetailModal({
  visible,
  route,
  copy,
  placeReview,
  onClose,
  onToggleVisited,
  onWriteReview,
}: PlaceDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [mapExpanded, setMapExpanded] = useState(false);

  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);
  const mapAreaHeight = Math.round(screenHeight * MAP_AREA_RATIO);

  if (!route) {
    return null;
  }
  const info = route.placeInfo;

  const handleClose = () => {
    setMapExpanded(false);
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      title={route.placeName}
      maxHeight={sheetMaxHeight}
      closeAccessibilityLabel={copy.close}
      overlayAccessory={
        mapExpanded ? (
          <View style={[styles.mapLayer, { height: mapAreaHeight, paddingTop: insets.top }]}>
            <RouteMapView
              title={copy.mapPlaceholder}
              subtitle={copy.mapPlaceholderSub}
              routes={[route]}
              highlightItemId={route.itemId}
              size="fullscreen"
            />
            <Pressable
              onPress={() => setMapExpanded(false)}
              style={[styles.mapCloseBtn, { top: insets.top + 8 }]}>
              <Text style={styles.mapCloseText}>{copy.close}</Text>
            </Pressable>
          </View>
        ) : null
      }
      footer={
        <AppModalActions
          className="mt-2"
          actions={[{ label: copy.close, onPress: handleClose, variant: 'primary' }]}
        />
      }>
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {info && (
          <Text className="mb-3 text-sm text-brand-muted">
            ★ {info.rating ?? '—'} ({info.reviewCount?.toLocaleString() ?? 0}) · {info.category}
          </Text>
        )}

        {!mapExpanded && (
          <RouteMapView
            title={copy.mapPlaceholder}
            subtitle={copy.mapPlaceholderSub}
            routes={[route]}
            highlightItemId={route.itemId}
            onPress={() => setMapExpanded(true)}
            tapHint={copy.mapTapHint}
          />
        )}

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            onPress={onToggleVisited}
            className="rounded-full bg-brand-selected px-3 py-2 active:opacity-80">
            <Text className="text-sm font-semibold text-brand-primary">
              {route.isVisited ? copy.visited : copy.markVisited}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMapExpanded(true)}
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
            <StarRating value={placeReview.rating} readonly size="sm" />
            {placeReview.comment ? (
              <Text className="mt-2 text-sm text-brand-text">{placeReview.comment}</Text>
            ) : null}
          </View>
        ) : route.isVisited && copy.visitFirstReview && onWriteReview ? (
          <Text className="mt-2 text-xs text-brand-muted">{copy.visitFirstReview}</Text>
        ) : null}

        {info && (
          <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
            <Text className="mb-2 text-sm leading-5 text-brand-text">{info.description}</Text>
            {info.dwellMinutes ? (
              <Text className="mb-1 text-xs text-brand-muted">{copy.dwell(info.dwellMinutes)}</Text>
            ) : null}
            <Text className="text-xs text-brand-muted">{info.hours}</Text>
            <Text className="mt-1 text-xs text-brand-muted">{info.address}</Text>
          </View>
        )}
      </ScrollView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  mapLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
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
});
