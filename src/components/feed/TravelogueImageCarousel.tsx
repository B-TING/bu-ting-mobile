import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ICON_COLOR_PRIMARY } from '../../constants/icons';
import type { ReviewMedia, TravelRecord } from '../../types/travelReview';
import {
  travelRecordDestinationLabel,
  travelRecordThumbnailIcon,
} from '../../utils/review/travelReview';
import { AppIcon } from '../shared/icons/AppIcon';

type TravelogueImageCarouselProps = {
  travelRecord: TravelRecord;
  images: ReviewMedia[];
  onPress?: () => void;
};

export function TravelogueImageCarousel({
  travelRecord,
  images,
  onPress,
}: TravelogueImageCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const imageWidth = screenWidth;
  const imageHeight = Math.round(screenWidth * 0.85);
  const [activeIndex, setActiveIndex] = useState(0);
  const icon = travelRecordThumbnailIcon(travelRecord);
  const destinationLabel = travelRecordDestinationLabel(travelRecord);

  const content =
    images.length === 0 ? (
      <View
        style={[styles.placeholder, { width: imageWidth, height: imageHeight }]}
        className="items-center justify-center bg-brand-selected">
        <AppIcon name={icon} size={56} color={ICON_COLOR_PRIMARY} />
        <Text className="mt-3 px-6 text-center text-sm font-semibold text-brand-text">
          {travelRecord.title ?? ''}
        </Text>
        <Text className="mt-1 text-xs text-brand-muted">{destinationLabel}</Text>
      </View>
    ) : (
      <>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={event => {
            const index = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
            setActiveIndex(index);
          }}>
          {images.map(image => (
            <View key={image.mediaId} style={{ width: imageWidth, height: imageHeight }}>
              <Image
                source={{ uri: image.uri }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>
        {images.length > 1 ? (
          <View className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1">
            <Text className="text-xs font-bold text-white">
              {activeIndex + 1}/{images.length}
            </Text>
          </View>
        ) : null}
      </>
    );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
  },
});
