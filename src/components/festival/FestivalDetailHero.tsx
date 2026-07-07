import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  festivalAddress,
  festivalDescription,
  festivalHours,
  festivalPeriodLabel,
  festivalTitle,
  type BusanFestival,
} from '../../constants/festival/festivalCalendar';
import { useCopy } from '../../i18n';
import type { AppLanguage } from '../../types/user';
import { FestivalTagBadges } from './FestivalTagBadges';

type FestivalDetailHeroProps = {
  festival: BusanFestival;
  language: AppLanguage;
  fill?: boolean;
  commentCount?: number;
  onCommentsPress?: () => void;
  commentsAccessibilityLabel?: string;
};

function HeroInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-2 flex-row">
      <Text className="w-16 text-xs font-bold text-white/60">{label}</Text>
      <Text className="flex-1 text-xs leading-5 text-white/90">{value}</Text>
    </View>
  );
}

export function FestivalDetailHero({
  festival,
  language,
  fill = false,
  commentCount = 0,
  onCommentsPress,
  commentsAccessibilityLabel,
}: FestivalDetailHeroProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const copy = useCopy('festivalCalendar');
  const title = festivalTitle(festival, language);
  const description = festivalDescription(festival, language);
  const address = festivalAddress(festival, language);
  const period = festivalPeriodLabel(festival, language);
  const hours = festivalHours(festival, language);

  const overlayContent = (
    <>
      <FestivalTagBadges festival={festival} language={language} className="mb-2" />
      <Text className="text-xl font-bold leading-snug text-white">{title}</Text>
      <Text className="mt-3 text-sm leading-6 text-white/85">{description}</Text>

      <View className="mt-4 border-t border-white/20 pt-3">
        <HeroInfoRow label={copy.locationLabel} value={address} />
        <HeroInfoRow label={copy.periodLabel} value={period} />
        <HeroInfoRow label={copy.hoursLabel} value={hours} />
      </View>
    </>
  );

  const overlay = fill ? (
    <ScrollView
      style={styles.overlayScroll}
      contentContainerStyle={styles.overlayScrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}>
      <View style={styles.overlay}>{overlayContent}</View>
    </ScrollView>
  ) : (
    <View style={styles.overlay}>{overlayContent}</View>
  );

  const commentButton =
    onCommentsPress != null ? (
      <Pressable
        onPress={onCommentsPress}
        accessibilityRole="button"
        accessibilityLabel={commentsAccessibilityLabel}
        className="absolute bottom-3 right-3 z-10 flex-row items-center gap-1.5 rounded-full bg-black/55 px-3 py-2 active:opacity-80">
        <Text className="text-base">💬</Text>
        <Text className="text-sm font-bold text-white">{commentCount}</Text>
      </Pressable>
    ) : null;

  const cardStyle = [styles.card, fill && styles.cardFill];

  if (imageFailed) {
    return (
      <View style={[cardStyle, { backgroundColor: festival.imageColor }]}>
        <Text className="absolute right-4 top-4 text-5xl opacity-30">{festival.imageEmoji}</Text>
        {overlay}
        {commentButton}
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: festival.imageUri }}
      style={cardStyle}
      resizeMode="cover"
      onError={() => setImageFailed(true)}>
      {overlay}
      {commentButton}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 320,
    justifyContent: 'flex-end',
  },
  cardFill: {
    flex: 1,
    minHeight: 0,
  },
  overlayScroll: {
    flex: 1,
  },
  overlayScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
});
