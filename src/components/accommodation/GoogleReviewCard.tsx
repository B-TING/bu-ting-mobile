import { Text, View } from 'react-native';

import type { GooglePlaceReview } from '../../types/googlePlaces';
import { StarRating } from '../shared/rating/StarRating';

type GoogleReviewCardProps = {
  review: GooglePlaceReview;
};

export function GoogleReviewCard({ review }: GoogleReviewCardProps) {
  return (
    <View className="mb-3 rounded-2xl border border-brand-border bg-brand-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-brand-text">{review.authorName}</Text>
        <Text className="text-xs text-brand-muted">{review.relativeTimeDescription}</Text>
      </View>
      <View className="mt-2">
        <StarRating value={review.rating} readonly size="sm" />
      </View>
      {review.text ? (
        <Text className="mt-2 text-sm leading-5 text-brand-text">{review.text}</Text>
      ) : null}
    </View>
  );
}
