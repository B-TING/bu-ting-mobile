import { Pressable, Text, View } from 'react-native';

import { catalogThumbnail } from '../../constants/placeCatalog';
import type { RouteItem } from '../../types/travelPlan';
import { cn } from '../../utils/cn';

type RouteItemCardProps = {
  route: RouteItem;
  displayIndex: number;
  onPress: () => void;
  onToggleVisited: () => void;
  visitedLabel: string;
};

export function RouteItemCard({
  route,
  displayIndex,
  onPress,
  onToggleVisited,
  visitedLabel,
}: RouteItemCardProps) {
  const info = route.placeInfo;
  const thumb = catalogThumbnail(route.placeId);

  return (
    <Pressable
      onPress={onPress}
      className="mb-2 flex-row rounded-2xl border border-brand-border bg-brand-surface p-3 active:opacity-90">
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: '#0077B6' }}>
        <Text className="text-sm font-bold text-white">{displayIndex}</Text>
      </View>
      <View className="min-h-[72px] flex-1 pr-2">
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
            className={cn(
              'text-xs font-semibold',
              route.isVisited ? 'text-brand-primary' : 'text-brand-muted',
            )}>
            {route.isVisited ? `✓ ${visitedLabel}` : `○ ${visitedLabel}`}
          </Text>
        </Pressable>
      </View>
      <View
        className="h-[72px] w-[72px] rounded-xl"
        style={{ backgroundColor: thumb }}
      />
    </Pressable>
  );
}
