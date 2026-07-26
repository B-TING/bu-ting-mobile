import { Pressable, Text, View } from 'react-native';

import type { CopyFor } from '../../i18n';
import type {
  TravelRecord,
  TravelRecordComment,
  TravelRecordSocial,
} from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';
import {
  authorInitial,
  collectTravelRecordMedia,
  travelRecordDestinationLabel,
  travelRecordOverallRating,
} from '../../utils/review/travelReview';
import {
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
} from '../../constants/icons';
import { AppIcon } from '../shared/icons/AppIcon';
import { StarRating } from '../shared/rating/StarRating';
import { TravelogueCommentsSection } from './TravelogueCommentsSection';
import { TravelogueImageCarousel } from './TravelogueImageCarousel';
import { TravelogueSocialBar } from './TravelogueSocialBar';

type Copy = CopyFor<'travelReview'>;

type TravelogueFeedItemProps = {
  travelRecord: TravelRecord;
  copy: Copy;
  language: AppLanguage;
  social: TravelRecordSocial;
  userId: string;
  userName: string;
  onPressDetail: () => void;
  onToggleLike: () => void;
  onToggleBookmark?: () => void;
  bookmarkedByMe?: boolean;
  onImportPlan: () => void;
  onOpenComposer?: () => void;
  onEditComment?: (comment: TravelRecordComment) => void;
  onDeleteComment?: (comment: TravelRecordComment) => void;
  variant?: 'feed' | 'detail';
};

export function TravelogueFeedItem({
  travelRecord,
  copy,
  language,
  social,
  userId,
  userName,
  onPressDetail,
  onToggleLike,
  onToggleBookmark,
  bookmarkedByMe = false,
  onImportPlan,
  onOpenComposer,
  onEditComment,
  onDeleteComment,
  variant = 'feed',
}: TravelogueFeedItemProps) {
  const images = collectTravelRecordMedia(travelRecord);
  const rating = travelRecordOverallRating(travelRecord);
  const destinationLabel = travelRecordDestinationLabel(travelRecord);
  const publishedDate = travelRecord.publishedAt
    ? new Date(travelRecord.publishedAt).toLocaleDateString(
        language === 'ko' ? 'ko-KR' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' },
      )
    : '';
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
            {authorInitial(travelRecord.authorNickname)}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-bold text-brand-text">{travelRecord.authorNickname}</Text>
          <Text className="text-xs text-brand-muted" numberOfLines={1}>
            {destinationLabel}
          </Text>
        </View>
        {isFeed ? (
          <Text className="text-xs font-semibold text-brand-primary">{copy.viewDetail}</Text>
        ) : null}
      </Pressable>

      <TravelogueImageCarousel
        travelRecord={travelRecord}
        images={images}
        onPress={onPressDetail}
      />

      <View className="px-4 pt-3">
        <TravelogueSocialBar
          copy={copy}
          social={social}
          userId={userId}
          onToggleLike={onToggleLike}
          onImportPlan={onImportPlan}
        />

        {publishedDate ? (
          <Text className="mb-2 mt-3 text-xs text-brand-muted">{publishedDate}</Text>
        ) : null}

        <View className="mb-1 flex-row items-center justify-between gap-3">
          <Pressable onPress={onPressDetail} className="min-w-0 flex-1 active:opacity-90">
            <Text className="text-base font-bold text-brand-text" numberOfLines={2}>
              {travelRecord.title ?? ''}
            </Text>
          </Pressable>
          {onToggleBookmark ? (
            <Pressable
              onPress={onToggleBookmark}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={bookmarkedByMe ? copy.unbookmark : copy.bookmark}
              accessibilityState={{ selected: bookmarkedByMe }}
              className="h-9 w-9 shrink-0 items-center justify-center rounded-full active:opacity-80">
              <AppIcon
                name="bookmark"
                size={20}
                color={bookmarkedByMe ? ICON_COLOR_PRIMARY : ICON_COLOR_MUTED}
                filled={bookmarkedByMe}
              />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={onPressDetail} className="active:opacity-90">
          {rating > 0 ? (
            <View className="mb-2 flex-row items-center gap-2">
              <StarRating value={rating} readonly size="sm" />
              <Text className="text-xs font-semibold text-brand-primary">
                {copy.stars(rating)}
              </Text>
            </View>
          ) : null}
          {travelRecord.content ? (
            <Text
              className="text-sm leading-6 text-brand-text"
              numberOfLines={isFeed ? 3 : undefined}>
              {travelRecord.content}
            </Text>
          ) : null}
        </Pressable>

        <View className="mt-4 border-t border-brand-border pt-4">
          <Text className="mb-3 text-sm font-bold text-brand-text">{copy.feedCommentsTitle}</Text>
          <TravelogueCommentsSection
            copy={copy}
            comments={social.comments}
            currentUserId={userId}
            currentUserName={userName}
            language={language}
            previewLimit={isFeed ? 2 : undefined}
            onViewAllPress={isFeed ? onPressDetail : undefined}
            onOpenComposer={onOpenComposer}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
        </View>
      </View>
    </View>
  );
}
