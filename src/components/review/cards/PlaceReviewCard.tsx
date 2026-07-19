import { Pressable, Text, View } from 'react-native';

import type { PlaceReview } from '../../../types/travelReview';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { StarRating } from '../../shared/rating/StarRating';
import { AppIcon } from '../../shared/icons/AppIcon';

type PlaceReviewCardProps = {
  placeName: string;
  isVisited: boolean;
  review?: PlaceReview;
  writeLabel: string;
  editLabel: string;
  visitFirstLabel: string;
  onPress: () => void;
};

export function PlaceReviewCard({
  placeName,
  isVisited,
  review,
  writeLabel,
  editLabel,
  visitFirstLabel,
  onPress,
}: PlaceReviewCardProps) {
  const actionLabel = review ? editLabel : writeLabel;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isVisited}
      accessibilityLabel={isVisited ? actionLabel : visitFirstLabel}
      className={`mb-3 rounded-2xl border border-brand-border bg-brand-surface p-4 ${
        isVisited ? 'active:opacity-90' : 'opacity-60'
      }`}>
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-bold text-brand-text" numberOfLines={1}>
            {placeName}
          </Text>
          {!isVisited ? (
            <Text className="mt-1 text-xs text-brand-muted">{visitFirstLabel}</Text>
          ) : review ? (
            <View className="mt-2">
              <StarRating value={review.rating} readonly size="sm" />
              {review.content ? (
                <Text className="mt-2 text-sm text-brand-muted" numberOfLines={2}>
                  {review.content}
                </Text>
              ) : null}
              {review.tags.length > 0 ? (
                <View className="mt-2 flex-row flex-wrap gap-1">
                  {review.tags.slice(0, 4).map(tag => (
                    <View
                      key={tag}
                      className="rounded-full bg-brand-selected px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-brand-primary">
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <Text className="mt-1 text-xs text-brand-primary">{writeLabel}</Text>
          )}
        </View>
        {isVisited ? (
          <View
            className={`h-9 w-9 items-center justify-center rounded-full ${
              review ? 'bg-brand-selected' : 'bg-brand-primary/10'
            }`}>
            <AppIcon
              name={review ? 'pencil' : 'plus'}
              size={16}
              color={review ? ICON_COLOR_MUTED : ICON_COLOR_PRIMARY}
              strokeWidth={2.2}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
