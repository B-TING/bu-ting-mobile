import { Pressable, Text, View } from 'react-native';

import {
  festivalLocation,
  festivalPeriodLabel,
  festivalTitle,
  type BusanFestival,
} from '../../constants/festivalCalendar';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/cn';

type FestivalCardProps = {
  festival: BusanFestival;
  language: AppLanguage;
  onPress: () => void;
};

export function FestivalCard({ festival, language, onPress }: FestivalCardProps) {
  const title = festivalTitle(festival, language);
  const location = festivalLocation(festival, language);
  const period = festivalPeriodLabel(festival, language);

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl border border-brand-border bg-brand-surface active:opacity-90"
      accessibilityRole="button">
      <View
        className="w-24 items-center justify-center"
        style={{ backgroundColor: festival.imageColor }}>
        <Text className="text-3xl">{festival.imageEmoji}</Text>
      </View>
      <View className="flex-1 p-3">
        <View
          className={cn(
            'mb-2 self-start rounded-md px-2 py-0.5',
            festival.tag === 'FESTIVAL' ? 'bg-brand-primary' : 'bg-orange-500',
          )}>
          <Text className="text-[10px] font-bold text-white">{festival.tag}</Text>
        </View>
        <Text className="text-sm font-bold text-brand-text" numberOfLines={2}>
          {title}
        </Text>
        <Text className="mt-1 text-xs text-brand-muted" numberOfLines={1}>
          {location}
        </Text>
        <Text className="mt-0.5 text-xs font-medium text-brand-primary">{period}</Text>
      </View>
      <View className="justify-center pr-3">
        <Text className="text-lg text-brand-muted">›</Text>
      </View>
    </Pressable>
  );
}
