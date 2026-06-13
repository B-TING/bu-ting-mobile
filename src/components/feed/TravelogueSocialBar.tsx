import { Pressable, Text, View } from 'react-native';

import type { TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import type { TravelogueSocial } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';
import { getHelpfulCount, isHelpfulByUser } from '../../utils/travelReview';

type Copy = (typeof TRAVEL_REVIEW_COPY)[AppLanguage];

type TravelogueSocialBarProps = {
  copy: Copy;
  social: TravelogueSocial;
  userId: string;
  onToggleHelpful: () => void;
  onImportPlan: () => void;
};

export function TravelogueSocialBar({
  copy,
  social,
  userId,
  onToggleHelpful,
  onImportPlan,
}: TravelogueSocialBarProps) {
  const helpfulCount = getHelpfulCount(social);
  const isHelpful = isHelpfulByUser(social, userId);

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Pressable
        onPress={onToggleHelpful}
        className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 active:opacity-80 ${
          isHelpful ? 'bg-brand-primary/15' : 'bg-brand-selected'
        }`}
        accessibilityRole="button"
        accessibilityState={{ selected: isHelpful }}>
        <Text className="text-base">{isHelpful ? '❤️' : '🤍'}</Text>
        <Text
          className={`text-xs font-bold ${
            isHelpful ? 'text-brand-primary' : 'text-brand-text'
          }`}>
          {copy.helpfulLabel}
        </Text>
        {helpfulCount > 0 ? (
          <Text className="text-xs font-semibold text-brand-muted">
            {copy.helpfulCount(helpfulCount)}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        onPress={onImportPlan}
        className="flex-row items-center gap-1.5 rounded-full bg-brand-selected px-3 py-2 active:opacity-80"
        accessibilityRole="button">
        <Text className="text-base">📋</Text>
        <Text className="text-xs font-bold text-brand-text">{copy.importPlan}</Text>
      </Pressable>
    </View>
  );
}
