import { Pressable, Text, View } from 'react-native';

import type { CopyFor } from '../../i18n';
import type { Travelogue, TravelogueSocial } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';
import {
  collectTravelogueImages,
  authorInitial,
} from '../../utils/review/travelReview';
import { StarRating } from '../shared/rating/StarRating';
import { TravelogueCommentsSection } from './TravelogueCommentsSection';
import { TravelogueImageCarousel } from './TravelogueImageCarousel';
import { TravelogueSocialBar } from './TravelogueSocialBar';

type Copy = CopyFor<'travelReview'>;

type TravelogueFeedItemProps = {
  travelogue: Travelogue;
  copy: Copy;
  language: AppLanguage;
  social: TravelogueSocial;
  userId: string;
  userName: string;
  onPressDetail: () => void;
  onToggleHelpful: () => void;
  onImportPlan: () => void;
  onOpenComposer?: () => void;
  variant?: 'feed' | 'detail';
};

export function TravelogueFeedItem({
  travelogue,
  copy,
  language,
  social,
  userId,
  userName,
  onPressDetail,
  onToggleHelpful,
  onImportPlan,
  onOpenComposer,
  variant = 'feed',
}: TravelogueFeedItemProps) {
  const images = collectTravelogueImages(travelogue);
  const publishedDate = new Date(travelogue.publishedAt).toLocaleDateString(
    language === 'ko' ? 'ko-KR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
  const isFeed = variant === 'feed';

  return (
    <View className={`bg-brand-surface ${isFeed ? 'mb-3 border-b border-brand-border pb-4' : ''}`}>
      <Pressable
        onPress={onPressDetail}
        className="flex-row items-center px-4 py-3 active:opacity-90"
        accessibilityRole="button"
        accessibilityHint={copy.feedTapHint}>
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-primary">
          <Text className="text-sm font-bold text-white">
            {authorInitial(travelogue.authorName)}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-bold text-brand-text">{travelogue.authorName}</Text>
          <Text className="text-xs text-brand-muted" numberOfLines={1}>
            {travelogue.destinationLabel}
          </Text>
        </View>
        {isFeed ? (
          <Text className="text-xs font-semibold text-brand-primary">{copy.viewDetail}</Text>
        ) : null}
      </Pressable>

      <TravelogueImageCarousel
        travelogue={travelogue}
        images={images}
        onPress={onPressDetail}
      />

      <View className="px-4 pt-3">
        <TravelogueSocialBar
          copy={copy}
          social={social}
          userId={userId}
          onToggleHelpful={onToggleHelpful}
          onImportPlan={onImportPlan}
        />

        <Text className="mb-2 mt-3 text-xs text-brand-muted">{publishedDate}</Text>

        <Pressable onPress={onPressDetail} className="active:opacity-90">
          <Text className="mb-1 text-base font-bold text-brand-text">{travelogue.title}</Text>
          <View className="mb-2 flex-row items-center gap-2">
            <StarRating value={travelogue.overallRating} readonly size="sm" />
            <Text className="text-xs font-semibold text-brand-primary">
              {copy.stars(travelogue.overallRating)}
            </Text>
          </View>
          {travelogue.overallReview ? (
            <Text
              className="text-sm leading-6 text-brand-text"
              numberOfLines={isFeed ? 3 : undefined}>
              {travelogue.overallReview}
            </Text>
          ) : null}
        </Pressable>

        <View className="mt-4 border-t border-brand-border pt-4">
          <Text className="mb-3 text-sm font-bold text-brand-text">{copy.feedCommentsTitle}</Text>
          <TravelogueCommentsSection
            copy={copy}
            comments={social.comments}
            currentUserName={userName}
            language={language}
            previewLimit={isFeed ? 2 : undefined}
            onViewAllPress={isFeed ? onPressDetail : undefined}
            onOpenComposer={onOpenComposer}
          />
        </View>
      </View>
    </View>
  );
}
