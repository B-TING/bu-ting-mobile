import { Pressable, Text, View } from 'react-native';

import type { Travelogue } from '../../../types/travelReview';
import { travelogueThumbnailEmoji } from '../../../utils/review/travelReview';
import { StarRating } from '../../shared/rating/StarRating';

type TravelogueCardProps = {
  travelogue: Travelogue;
  onPress: () => void;
};

export function TravelogueCard({ travelogue, onPress }: TravelogueCardProps) {
  const emoji = travelogueThumbnailEmoji(travelogue);
  const date = new Date(travelogue.publishedAt).toLocaleDateString();

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-3 active:opacity-90">
      <View className="mr-3 h-20 w-20 items-center justify-center rounded-xl bg-brand-selected">
        <Text className="text-3xl">{emoji}</Text>
      </View>
      <View className="flex-1 justify-center">
        <Text className="mb-1 text-[10px] font-bold tracking-wide text-brand-primary">
          TRAVELOGUE
        </Text>
        <Text className="text-sm font-bold text-brand-text" numberOfLines={2}>
          {travelogue.title}
        </Text>
        <Text className="mt-1 text-xs text-brand-muted" numberOfLines={1}>
          {travelogue.authorName} · {travelogue.destinationLabel}
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          <StarRating value={travelogue.overallRating} readonly size="sm" />
          <Text className="text-[10px] text-brand-muted">{date}</Text>
        </View>
      </View>
    </Pressable>
  );
}
