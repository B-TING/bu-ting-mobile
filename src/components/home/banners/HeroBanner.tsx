import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ICON_COLOR_WHITE } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';

const heroImage = require('../../../../assets/images/home-hero.jpg');

type HeroBannerProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaPress: () => void;
};

export function HeroBanner({
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}: HeroBannerProps) {
  return (
    <View className="mb-5 overflow-hidden">
      <ImageBackground
        source={heroImage}
        style={styles.image}
        resizeMode="cover"
      >
        <View style={[styles.overlay]} className="justify-end p-5">
          <Text className="mb-1 text-lg font-bold leading-snug text-white">
            {title}
          </Text>
          <Text className="mb-4 text-xs leading-relaxed text-white/90">
            {subtitle}
          </Text>
          <Pressable
            onPress={onCtaPress}
            className="flex-row items-center self-start rounded-xl bg-brand-primary px-4 py-2.5 active:opacity-90"
            accessibilityRole="button"
          >
            <AppIcon name="sparkles" size={16} color={ICON_COLOR_WHITE} />
            <Text className="text-sm font-bold text-white">{ctaLabel}</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    minHeight: 240,
  },
  overlay: {
    flex: 1,
    minHeight: 240,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
});
