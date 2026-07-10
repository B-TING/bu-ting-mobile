import { Pressable, Text, View } from 'react-native';

import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import type { MockTravelogue, MockSpecialOffer } from '../../../constants/home/mainHome';
import type { Travelogue } from '../../../types/travelReview';
import { travelogueThumbnailIcon } from '../../../utils/review/travelReview';
import { AppIcon } from '../../shared/icons/AppIcon';
import { StarRating } from '../../shared/rating/StarRating';

type TraveloguePreviewMockProps = {
  travelogue: MockTravelogue;
  specialOffer: MockSpecialOffer;
  trendingTitle: string;
  language?: 'ko' | 'en' | 'ja' | 'zh';
  latestTravelogue?: Travelogue;
  onTraveloguePress?: () => void;
  onOfferPress?: () => void;
  onFeedPress?: () => void;
};

export function TraveloguePreviewMock({
  travelogue,
  specialOffer,
  trendingTitle,
  language = 'ko',
  latestTravelogue,
  onTraveloguePress,
  onOfferPress,
  onFeedPress,
}: TraveloguePreviewMockProps) {
  const tTitle = latestTravelogue
    ? latestTravelogue.title
    : language === 'ko'
      ? travelogue.titleKo
      : travelogue.titleEn;
  const tSub = latestTravelogue
    ? `${latestTravelogue.authorName} · ${latestTravelogue.destinationLabel}`
    : language === 'ko'
      ? travelogue.subtitleKo
      : travelogue.subtitleEn;
  const tIcon = latestTravelogue
    ? travelogueThumbnailIcon(latestTravelogue)
    : travelogue.thumbnailIcon;
  const oTitle = language === 'ko' ? specialOffer.titleKo : specialOffer.titleEn;
  const oSub = language === 'ko' ? specialOffer.subtitleKo : specialOffer.subtitleEn;

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
        className="mb-3 flex-row overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-3 active:opacity-90"
        accessibilityRole="button">
        <View
          className="mr-3 h-20 w-20 items-center justify-center rounded-xl"
          style={{
            backgroundColor: latestTravelogue ? '#E0F2FE' : travelogue.thumbnailColor,
          }}>
          <AppIcon name={tIcon} size={32} color={ICON_COLOR_PRIMARY} />
        </View>
        <View className="flex-1 justify-center">
          <Text className="mb-1 text-[10px] font-bold tracking-wide text-brand-primary">
            {latestTravelogue ? 'LATEST TRAVELOGUE' : 'TRAVELOGUE'}
          </Text>
          <Text className="text-sm font-bold text-brand-text" numberOfLines={2}>
            {tTitle}
          </Text>
          <Text className="mt-1 text-xs text-brand-muted" numberOfLines={2}>
            {tSub}
          </Text>
          {latestTravelogue ? (
            <View className="mt-2">
              <StarRating value={latestTravelogue.overallRating} readonly size="sm" />
            </View>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onOfferPress}
        className="flex-row items-center rounded-2xl border border-brand-border bg-brand-selected p-4 active:opacity-90"
        accessibilityRole="button">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/15">
          <AppIcon name="ticket" size={24} color={ICON_COLOR_PRIMARY} />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-[10px] font-bold tracking-wide text-brand-primary">
            SPECIAL OFFER
          </Text>
          <Text className="text-sm font-bold text-brand-text">{oTitle}</Text>
          <Text className="mt-1 text-xs text-brand-muted">{oSub}</Text>
        </View>
      </Pressable>

      <Text className="mt-2 text-[10px] text-brand-muted">
        {latestTravelogue
          ? language === 'ko'
            ? '최근 게시된 여행기입니다.'
            : 'Recently published travelogue.'
          : language === 'ko'
            ? '여행기·상품 미리보기는 목업입니다.'
            : 'Travelogue and offer previews are mockups.'}
      </Text>
    </View>
  );
}
