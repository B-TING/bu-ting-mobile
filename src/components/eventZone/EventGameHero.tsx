import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ResolvedRemoteImage } from '../shared/media/ResolvedRemoteImage';
import { EVENT_HERO_BLUE, EVENT_HERO_PURPLE } from './eventZoneTheme';

type EventGameHeroProps = {
  emoji?: string;
  label: string;
  /** 인증 타겟 `exampleImageUrl` — 있으면 예시 이미지, 없으면 그라데이션 폴백 */
  imageUrl?: string | null;
};

// Figma GameHero: 예시 이미지 또는 gradient 폴백, h=160, rounded-[20px]
export function EventGameHero({ emoji, label, imageUrl }: EventGameHeroProps) {
  const trimmed = imageUrl?.trim() || '';
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [trimmed]);

  const showImage = Boolean(trimmed) && !imageFailed;

  if (showImage) {
    return (
      <View className="h-40 overflow-hidden rounded-[20px] bg-neutral-200">
        <ResolvedRemoteImage
          uri={trimmed}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      </View>
    );
  }

  return (
    <View
      className="h-40 items-center justify-center overflow-hidden rounded-[20px]"
      style={{ backgroundColor: EVENT_HERO_BLUE }}>
      <View
        className="absolute bottom-0 left-0 right-0 top-0"
        style={{
          backgroundColor: EVENT_HERO_PURPLE,
          opacity: 0.55,
        }}
      />
      <Text className="z-10 px-4 text-center text-[14px] font-bold leading-5 text-white">
        {emoji ? `${emoji}  ${label}` : label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
