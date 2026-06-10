import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  festivalLocation,
  festivalPeriodLabel,
  festivalSummary,
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
  const [imageFailed, setImageFailed] = useState(false);
  const title = festivalTitle(festival, language);
  const location = festivalLocation(festival, language);
  const period = festivalPeriodLabel(festival, language);
  const summary = festivalSummary(festival, language);

  const content = (
    <View style={styles.overlay}>
      <View
        className={cn(
          'mb-2 self-start rounded-md px-2 py-0.5',
          festival.tag === 'FESTIVAL' ? 'bg-brand-primary' : 'bg-orange-500',
        )}>
        <Text className="text-[10px] font-bold text-white">{festival.tag}</Text>
      </View>
      <Text className="text-lg font-bold leading-snug text-white" numberOfLines={2}>
        {title}
      </Text>
      <Text className="mt-1.5 text-xs font-medium text-white/90">
        {location} · {period}
      </Text>
      <Text className="mt-2 text-sm leading-5 text-white/80" numberOfLines={2}>
        {summary}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-2xl active:opacity-95"
      accessibilityRole="button">
      {imageFailed ? (
        <View style={[styles.card, { backgroundColor: festival.imageColor }]}>
          <Text className="absolute right-4 top-4 text-4xl opacity-40">{festival.imageEmoji}</Text>
          {content}
        </View>
      ) : (
        <ImageBackground
          source={{ uri: festival.imageUri }}
          style={styles.card}
          imageStyle={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}>
          {content}
        </ImageBackground>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 176,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 16,
  },
  overlay: {
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
});
