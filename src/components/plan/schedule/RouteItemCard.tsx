import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarRating } from '../../shared/rating/StarRating';
import { catalogThumbnail } from '../../../constants/places/placeCatalog';
import type { RouteItem } from '../../../types/travelPlan';

type RouteItemCardProps = {
  route: RouteItem;
  displayIndex: number;
  dayColor?: string;
  dayColorLight?: string;
  onPress: () => void;
  onEditPress: () => void;
  onIndexPress?: () => void;
  indexSelected?: boolean;
  onToggleVisited: () => void;
  visitedLabel: string;
  editLabel: string;
  indexHint: string;
  recordReviewLabel?: string;
  quickRatingHint?: string;
  reviewRating?: number;
  onWriteReview?: () => void;
  onQuickRating?: (rating: number) => void;
};

export function RouteItemCard({
  route,
  displayIndex,
  dayColor = '#0077B6',
  dayColorLight = '#E8F6FC',
  onPress,
  onEditPress,
  onIndexPress,
  indexSelected,
  onToggleVisited,
  visitedLabel,
  editLabel,
  indexHint,
  recordReviewLabel,
  quickRatingHint,
  reviewRating = 0,
  onWriteReview,
  onQuickRating,
}: RouteItemCardProps) {
  const info = route.placeInfo;
  const thumb = catalogThumbnail(route.placeId);

  return (
    <View
      className="mb-2 flex-row rounded-2xl border bg-brand-surface p-3"
      style={
        indexSelected
          ? { borderColor: dayColor, borderWidth: 2, backgroundColor: dayColorLight }
          : { borderColor: '#E2E8F0', borderLeftWidth: 4, borderLeftColor: dayColor }
      }>
      <Pressable
        onPress={onIndexPress}
        disabled={!onIndexPress}
        className="mr-3 items-center"
        style={({ pressed }) => pressed && styles.pressed}>
        <View
          style={[
            styles.indexCircle,
            { backgroundColor: dayColor },
            indexSelected && { backgroundColor: dayColor, borderColor: '#FFFFFF' },
          ]}>
          <Text style={styles.indexText}>{displayIndex}</Text>
        </View>
        <Text className="mt-1 max-w-[56px] text-center text-[9px] font-medium text-brand-muted">
          {indexHint}
        </Text>
      </Pressable>
      <Pressable onPress={onPress} className="min-h-[72px] flex-1 pr-2 active:opacity-90">
        <Text className="text-base font-bold text-brand-text">{route.placeName}</Text>
        {info && (
          <>
            <Text className="mt-0.5 text-xs text-brand-muted">
              {info.hours} · {info.category}
            </Text>
            <Text className="mt-1 text-xs text-brand-muted" numberOfLines={2}>
              {info.description}
            </Text>
          </>
        )}
        <Pressable onPress={onToggleVisited} className="mt-2 self-start active:opacity-80">
          <Text
            className={
              route.isVisited
                ? 'text-xs font-semibold text-brand-primary'
                : 'text-xs font-semibold text-brand-muted'
            }>
            {route.isVisited ? `✓ ${visitedLabel}` : `○ ${visitedLabel}`}
          </Text>
        </Pressable>
        {route.isVisited && onWriteReview && recordReviewLabel ? (
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <Pressable
              onPress={onWriteReview}
              className="rounded-full bg-brand-primary px-3 py-1 active:opacity-90">
              <Text className="text-[11px] font-bold text-white">{recordReviewLabel}</Text>
            </Pressable>
            {onQuickRating ? (
              <View className="flex-row items-center gap-1">
                <StarRating value={reviewRating} onChange={onQuickRating} size="sm" />
                {quickRatingHint ? (
                  <Text className="text-[9px] text-brand-muted">{quickRatingHint}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
      <View className="items-end">
        <Pressable
          onPress={onEditPress}
          accessibilityLabel={editLabel}
          className="mb-2 rounded-full border border-brand-border bg-brand-background px-2.5 py-1 active:opacity-80">
          <Text className="text-[11px] font-bold text-brand-primary">{editLabel}</Text>
        </Pressable>
        <View
          className="h-[56px] w-[56px] rounded-xl"
          style={{ backgroundColor: thumb }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indexCircle: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  indexText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
});
