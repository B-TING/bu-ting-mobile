import { Pressable, Text, View } from 'react-native';

import type { MockTravelogue, MockSpecialOffer } from '../../constants/mainHome';

type TraveloguePreviewMockProps = {
  travelogue: MockTravelogue;
  specialOffer: MockSpecialOffer;
  trendingTitle: string;
  language?: 'ko' | 'en' | 'ja' | 'zh';
  onTraveloguePress?: () => void;
  onOfferPress?: () => void;
};

export function TraveloguePreviewMock({
  travelogue,
  specialOffer,
  trendingTitle,
  language = 'ko',
  onTraveloguePress,
  onOfferPress,
}: TraveloguePreviewMockProps) {
  const tTitle = language === 'ko' ? travelogue.titleKo : travelogue.titleEn;
  const tSub = language === 'ko' ? travelogue.subtitleKo : travelogue.subtitleEn;
  const oTitle = language === 'ko' ? specialOffer.titleKo : specialOffer.titleEn;
  const oSub = language === 'ko' ? specialOffer.subtitleKo : specialOffer.subtitleEn;

  return (
    <View className="mb-4">
      <Text className="mb-3 text-base font-bold text-brand-text">{trendingTitle}</Text>

      <Pressable
        onPress={onTraveloguePress}
        className="mb-3 flex-row overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-3 active:opacity-90"
        accessibilityRole="button">
        <View
          className="mr-3 h-20 w-20 items-center justify-center rounded-xl"
          style={{ backgroundColor: travelogue.thumbnailColor }}>
          <Text className="text-3xl">{travelogue.thumbnailEmoji}</Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="mb-1 text-[10px] font-bold tracking-wide text-brand-primary">
            TRAVELOGUE
          </Text>
          <Text className="text-sm font-bold text-brand-text" numberOfLines={2}>
            {tTitle}
          </Text>
          <Text className="mt-1 text-xs text-brand-muted" numberOfLines={2}>
            {tSub}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onOfferPress}
        className="flex-row items-center rounded-2xl border border-brand-border bg-brand-selected p-4 active:opacity-90"
        accessibilityRole="button">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/15">
          <Text className="text-2xl">🎫</Text>
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
        {language === 'ko'
          ? '여행기·상품 미리보기는 목업입니다.'
          : 'Travelogue and offer previews are mockups.'}
      </Text>
    </View>
  );
}
