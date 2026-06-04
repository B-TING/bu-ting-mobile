import { Pressable, StyleSheet, Text, View } from 'react-native';

import { catalogThumbnail } from '../../constants/placeCatalog';
import type { RouteItem } from '../../types/travelPlan';

type RouteItemCardProps = {
  route: RouteItem;
  displayIndex: number;
  onPress: () => void;
  onEditPress: () => void;
  onIndexPress?: () => void;
  indexSelected?: boolean;
  onToggleVisited: () => void;
  visitedLabel: string;
  editLabel: string;
  indexHint: string;
};

export function RouteItemCard({
  route,
  displayIndex,
  onPress,
  onEditPress,
  onIndexPress,
  indexSelected,
  onToggleVisited,
  visitedLabel,
  editLabel,
  indexHint,
}: RouteItemCardProps) {
  const info = route.placeInfo;
  const thumb = catalogThumbnail(route.placeId);

  return (
    <View
      className="mb-2 flex-row rounded-2xl border bg-brand-surface p-3"
      style={indexSelected ? styles.cardSelected : styles.cardDefault}>
      <Pressable
        onPress={onIndexPress}
        disabled={!onIndexPress}
        className="mr-3 items-center"
        style={({ pressed }) => pressed && styles.pressed}>
        <View style={[styles.indexCircle, indexSelected && styles.indexCircleSelected]}>
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
      </Pressable>
      <View className="items-end justify-between">
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
  cardDefault: {
    borderColor: '#E2E8F0',
  },
  cardSelected: {
    borderColor: '#0077B6',
    borderWidth: 2,
  },
  indexCircle: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#0077B6',
  },
  indexCircleSelected: {
    backgroundColor: '#005A8C',
    borderWidth: 2,
    borderColor: '#90E0EF',
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
