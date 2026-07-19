import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import type { TravelRecord } from '../../../types/travelReview';
import {
  averageRating,
  travelRecordDestinationLabel,
  travelRecordThumbnailIcon,
} from '../../../utils/review/travelReview';
import { AppIcon } from '../../shared/icons/AppIcon';
import { StarRating } from '../../shared/rating/StarRating';

type TraveloguePreviewProps = {
  trendingTitle: string;
  language?: 'ko' | 'en' | 'ja' | 'zh';
  latestTravelogue: TravelRecord | null;
  loading?: boolean;
  onTraveloguePress?: () => void;
  onFeedPress?: () => void;
};

export function TraveloguePreview({
  trendingTitle,
  language = 'ko',
  latestTravelogue,
  loading = false,
  onTraveloguePress,
  onFeedPress,
}: TraveloguePreviewProps) {
  if (loading) {
    return (
      <View className="mb-4">
        <Text className="mb-3 text-base font-bold text-brand-text">{trendingTitle}</Text>
        <View className="h-24 rounded-2xl border border-brand-border bg-brand-surface" />
      </View>
    );
  }

  if (!latestTravelogue) {
    return (
      <View className="mb-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-brand-text">{trendingTitle}</Text>
          {onFeedPress ? (
            <Pressable onPress={onFeedPress} className="active:opacity-80">
              <Text className="text-xs font-bold text-brand-primary">
                {language === 'ko' ? '전체 보기' : 'See all'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={onFeedPress}
          className="items-center rounded-2xl border border-dashed border-brand-border bg-brand-surface px-4 py-8 active:opacity-90">
          <Text className="text-sm text-brand-muted">
            {language === 'ko'
              ? '아직 게시된 여행기가 없어요'
              : 'No travelogues yet'}
          </Text>
        </Pressable>
      </View>
    );
  }

  const rating = averageRating(latestTravelogue.placeReviews);

  return (
    <View className="mb-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-text">{trendingTitle}</Text>
        {onFeedPress ? (
          <Pressable onPress={onFeedPress} className="active:opacity-80">
            <Text className="text-xs font-bold text-brand-primary">
              {language === 'ko' ? '전체 보기' : 'See all'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onTraveloguePress}
        className="mb-1 flex-row overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-3 active:opacity-90"
        accessibilityRole="button">
        <View className="mr-3 h-20 w-20 items-center justify-center rounded-xl bg-sky-100">
          <AppIcon
            name={travelRecordThumbnailIcon(latestTravelogue)}
            size={32}
            color={ICON_COLOR_PRIMARY}
          />
        </View>
        <View className="flex-1 justify-center">
          <Text className="mb-1 text-[10px] font-bold tracking-wide text-brand-primary">
            LATEST TRAVELOGUE
          </Text>
          <Text className="text-sm font-bold text-brand-text" numberOfLines={2}>
            {latestTravelogue.title}
          </Text>
          <Text className="mt-1 text-xs text-brand-muted" numberOfLines={2}>
            {latestTravelogue.authorNickname} ·{' '}
            {travelRecordDestinationLabel(latestTravelogue)}
          </Text>
          {rating > 0 ? (
            <View className="mt-2">
              <StarRating value={rating} readonly size="sm" />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
