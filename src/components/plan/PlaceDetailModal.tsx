import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NaverMapPlaceholder } from './NaverMapPlaceholder';
import type { RouteItem } from '../../types/travelPlan';

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
  };
  onClose: () => void;
  onToggleVisited: () => void;
};

export function PlaceDetailModal({
  visible,
  route,
  copy,
  onClose,
  onToggleVisited,
}: PlaceDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [mapExpanded, setMapExpanded] = useState(false);

  if (!route) {
    return null;
  }
  const info = route.placeInfo;

  const handleClose = () => {
    setMapExpanded(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50">
        {mapExpanded && (
          <View className="absolute inset-0" style={{ paddingTop: insets.top }}>
            <NaverMapPlaceholder
              title={copy.mapPlaceholder}
              subtitle={copy.mapPlaceholderSub}
              routes={[route]}
              highlightItemId={route.itemId}
              size="fullscreen"
            />
            <Pressable
              onPress={() => setMapExpanded(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/95 px-3 py-2 active:opacity-90"
              style={{ marginTop: insets.top }}>
              <Text className="text-sm font-bold text-brand-primary">{copy.close}</Text>
            </Pressable>
          </View>
        )}

        <View
          className="mt-auto max-h-[88%] rounded-t-3xl bg-brand-background px-5 pb-8 pt-4"
          style={{ marginTop: mapExpanded ? '48%' : undefined }}>
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-brand-border" />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-1 text-2xl font-bold text-brand-text">
              {route.placeName}
            </Text>
            {info && (
              <Text className="mb-3 text-sm text-brand-muted">
                ★ {info.rating ?? '—'} ({info.reviewCount?.toLocaleString() ?? 0}) ·{' '}
                {info.category}
              </Text>
            )}

            {!mapExpanded && (
              <NaverMapPlaceholder
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
                <Text className="text-sm font-semibold text-brand-text">
                  {copy.directions}
                </Text>
              </Pressable>
            </View>

            {info && (
              <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
                <Text className="mb-2 text-sm leading-5 text-brand-text">
                  {info.description}
                </Text>
                {info.dwellMinutes && (
                  <Text className="mb-1 text-xs text-brand-muted">
                    {copy.dwell(info.dwellMinutes)}
                  </Text>
                )}
                <Text className="text-xs text-brand-muted">{info.hours}</Text>
                <Text className="mt-1 text-xs text-brand-muted">{info.address}</Text>
              </View>
            )}
          </ScrollView>
          <Pressable
            onPress={handleClose}
            className="mt-4 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
            <Text className="font-bold text-white">{copy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
