import { Pressable, Text, View } from 'react-native';

import {
  ICON_COLOR_HEART,
  ICON_COLOR_MUTED,
  ICON_COLOR_PRIMARY,
} from '../../constants/icons';
import type { CopyFor } from '../../i18n';
import { AppIcon } from '../shared/icons/AppIcon';
import type { TravelRecordSocial } from '../../types/travelReview';
import { getLikeCount, isLikedByUser } from '../../utils/review/travelReview';

type Copy = CopyFor<'travelReview'>;

type TravelogueSocialBarProps = {
  copy: Copy;
  social: TravelRecordSocial;
  userId: string;
  onToggleLike: () => void;
  onImportPlan: () => void;
};

export function TravelogueSocialBar({
  copy,
  social,
  userId,
  onToggleLike,
  onImportPlan,
}: TravelogueSocialBarProps) {
  const likeCount = getLikeCount(social);
  const likedByMe = isLikedByUser(social, userId);

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Pressable
        onPress={onToggleLike}
        className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 active:opacity-80 ${
          likedByMe ? 'bg-brand-primary/15' : 'bg-brand-selected'
        }`}
        accessibilityRole="button"
        accessibilityState={{ selected: likedByMe }}>
        <AppIcon
          name="heart"
          size={18}
          color={likedByMe ? ICON_COLOR_HEART : ICON_COLOR_MUTED}
          filled={likedByMe}
        />
        <Text
          className={`text-xs font-bold ${
            likedByMe ? 'text-brand-primary' : 'text-brand-text'
          }`}>
          {copy.helpfulLabel}
        </Text>
        {likeCount > 0 ? (
          <Text className="text-xs font-semibold text-brand-muted">
            {copy.helpfulCount(likeCount)}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        onPress={onImportPlan}
        className="flex-row items-center gap-1.5 rounded-full bg-brand-selected px-3 py-2 active:opacity-80"
        accessibilityRole="button">
        <AppIcon name="clipboardList" size={18} color={ICON_COLOR_PRIMARY} />
        <Text className="text-xs font-bold text-brand-text">{copy.importPlan}</Text>
      </Pressable>
    </View>
  );
}
