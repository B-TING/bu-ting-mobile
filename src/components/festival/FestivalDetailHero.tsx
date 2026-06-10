import { useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import {
  FESTIVAL_CALENDAR_COPY,
  festivalAddress,
  festivalDescription,
  festivalHours,
  festivalPeriodLabel,
  festivalTitle,
  type BusanFestival,
} from '../../constants/festivalCalendar';
import type { AppLanguage } from '../../types/user';
import { FestivalTagBadges } from './FestivalTagBadges';

type FestivalDetailHeroProps = {
  festival: BusanFestival;
  language: AppLanguage;
};

function HeroInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-2 flex-row">
      <Text className="w-16 text-xs font-bold text-white/60">{label}</Text>
      <Text className="flex-1 text-xs leading-5 text-white/90">{value}</Text>
    </View>
  );
}

export function FestivalDetailHero({ festival, language }: FestivalDetailHeroProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const copy = FESTIVAL_CALENDAR_COPY[language];
  const title = festivalTitle(festival, language);
  const description = festivalDescription(festival, language);
  const address = festivalAddress(festival, language);
  const period = festivalPeriodLabel(festival, language);
  const hours = festivalHours(festival, language);

  const overlay = (
    <View style={styles.overlay}>
      <FestivalTagBadges festival={festival} language={language} className="mb-2" />
      <Text className="text-xl font-bold leading-snug text-white">{title}</Text>
      <Text className="mt-3 text-sm leading-6 text-white/85">{description}</Text>

      <View className="mt-4 border-t border-white/20 pt-3">
        <HeroInfoRow label={copy.locationLabel} value={address} />
        <HeroInfoRow label={copy.periodLabel} value={period} />
        <HeroInfoRow label={copy.hoursLabel} value={hours} />
      </View>
    </View>
  );

  if (imageFailed) {
    return (
      <View style={[styles.card, { backgroundColor: festival.imageColor }]}>
        <Text className="absolute right-4 top-4 text-5xl opacity-30">{festival.imageEmoji}</Text>
        {overlay}
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: festival.imageUri }}
      style={styles.card}
      resizeMode="cover"
      onError={() => setImageFailed(true)}>
      {overlay}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 320,
    justifyContent: 'flex-end',
  },
  overlay: {
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
});
