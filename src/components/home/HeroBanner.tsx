import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const heroImage = require('../../../assets/images/home-hero.png');

type HeroBannerProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaPress: () => void;
};

export function HeroBanner({ title, subtitle, ctaLabel, onCtaPress }: HeroBannerProps) {
  return (
    <View className="mb-5 overflow-hidden rounded-2xl">
      <ImageBackground source={heroImage} style={styles.image} resizeMode="cover">
        <View style={styles.overlay} className="justify-end p-5">
          <Text className="mb-1 text-lg font-bold leading-snug text-white">{title}</Text>
          <Text className="mb-4 text-xs leading-relaxed text-white/90">{subtitle}</Text>
          <Pressable
            onPress={onCtaPress}
            className="flex-row items-center self-start rounded-xl bg-brand-primary px-4 py-2.5 active:opacity-90"
            accessibilityRole="button">
            <Text className="mr-1.5 text-sm">✨</Text>
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
    minHeight: 200,
  },
  overlay: {
    flex: 1,
    minHeight: 200,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
});
