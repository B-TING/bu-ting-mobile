import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../components/plan/BackButton';
import { StarRating } from '../../components/review/StarRating';
import { TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore, useTravelogueStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'TravelogueDetail'>;

export function TravelogueDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = TRAVEL_REVIEW_COPY[language];
  const travelogue = useTravelogueStore(s =>
    s.publishedTravelogues.find(t => t.travelogueId === route.params.travelogueId),
  );

  if (!travelogue) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background px-6">
        <Text className="text-brand-muted">
          {language === 'ko' ? '여행기를 찾을 수 없어요' : 'Travelogue not found'}
        </Text>
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const publishedDate = new Date(travelogue.publishedAt).toLocaleDateString();

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {copy.feedTitle}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        <Text className="text-[10px] font-bold tracking-wide text-brand-primary">
          TRAVELOGUE
        </Text>
        <Text className="mt-1 text-2xl font-bold text-brand-text">{travelogue.title}</Text>
        <Text className="mt-2 text-sm text-brand-muted">
          {copy.detailBy(travelogue.authorName)} · {travelogue.destinationLabel} ·{' '}
          {publishedDate}
        </Text>

        <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
          <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallRating}</Text>
          <View className="flex-row items-center gap-2">
            <StarRating value={travelogue.overallRating} readonly />
            <Text className="text-sm font-bold text-brand-primary">
              {copy.stars(travelogue.overallRating)}
            </Text>
          </View>
          <Text className="mb-2 mt-4 text-xs font-bold text-brand-muted">
            {copy.overallSummary}
          </Text>
          <Text className="text-sm leading-6 text-brand-text">{travelogue.overallReview}</Text>
        </View>

        <Text className="mb-3 mt-6 text-base font-bold text-brand-text">
          {copy.placeReviewsSection}
        </Text>
        {travelogue.placeReviews.map(review => (
          <View
            key={review.reviewId}
            className="mb-3 rounded-2xl border border-brand-border bg-brand-surface p-4">
            <Text className="text-base font-bold text-brand-text">{review.placeName}</Text>
            <View className="mt-2 flex-row items-center gap-2">
              <StarRating value={review.rating} readonly size="sm" />
              <Text className="text-xs text-brand-muted">{copy.stars(review.rating)}</Text>
            </View>
            {review.tags.length > 0 ? (
              <View className="mt-2 flex-row flex-wrap gap-1">
                {review.tags.map(tag => (
                  <View key={tag} className="rounded-full bg-brand-selected px-2 py-0.5">
                    <Text className="text-[10px] font-semibold text-brand-primary">
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {review.comment ? (
              <Text className="mt-2 text-sm leading-5 text-brand-text">{review.comment}</Text>
            ) : null}
            {review.media.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {review.media.map(item => (
                  <View
                    key={item.mediaId}
                    className="h-14 w-14 items-center justify-center rounded-xl bg-brand-selected">
                    <Text className="text-xl">{item.thumbnailUri ?? '📎'}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
