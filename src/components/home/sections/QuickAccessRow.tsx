import { Pressable, Text, View } from 'react-native';

import type { QuickAccessItem } from '../../../constants/home/mainHome';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { GUIDE_TARGET } from '../../guide/guideTypes';
import { GuideTarget } from '../../guide/GuideTarget';
import { AppIcon } from '../../shared/icons/AppIcon';

type QuickAccessRowProps = {
  items: QuickAccessItem[];
  language?: 'ko' | 'en' | 'ja' | 'zh';
  onItemPress?: (id: string) => void;
};

const QUICK_GUIDE_IDS: Record<string, string> = {
  luggage: GUIDE_TARGET.quickLuggage,
  festivals: GUIDE_TARGET.quickFestivals,
  restaurants: GUIDE_TARGET.quickRestaurants,
  attractions: GUIDE_TARGET.quickAttractions,
  hotels: GUIDE_TARGET.quickHotels,
};

export function QuickAccessRow({
  items,
  language = 'ko',
  onItemPress,
}: QuickAccessRowProps) {
  return (
    <GuideTarget id={GUIDE_TARGET.quickAccessRow} className="mb-6">
      <View className="flex-row justify-between">
        {items.map(item => {
          const guideId = QUICK_GUIDE_IDS[item.id];
          const content = (
            <Pressable
              onPress={() => onItemPress?.(item.id)}
              className="w-full items-center active:opacity-80"
              accessibilityRole="button">
              <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-brand-selected">
                <AppIcon name={item.icon} size={26} color={ICON_COLOR_PRIMARY} />
              </View>
              <Text className="text-center text-xs font-semibold text-brand-text">
                {language === 'ko' ? item.labelKo : item.labelEn}
              </Text>
            </Pressable>
          );

          if (!guideId) {
            return (
              <View key={item.id} className="flex-1">
                {content}
              </View>
            );
          }

          return (
            <GuideTarget key={item.id} id={guideId} className="flex-1">
              {content}
            </GuideTarget>
          );
        })}
      </View>
    </GuideTarget>
  );
}
