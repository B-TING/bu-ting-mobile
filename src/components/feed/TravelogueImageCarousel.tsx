import { useMemo, useState } from 'react';
import {
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
  collectTravelRecordMedia,
  travelRecordDestinationLabel,
  travelRecordThumbnailIcon,
} from '../../utils/review/travelReview';
import { AppIcon } from '../shared/icons/AppIcon';
import { ResolvedRemoteImage } from '../shared/media/ResolvedRemoteImage';
import { ReviewVideoSlide } from '../shared/media/ReviewVideoViews';

type TravelogueImageCarouselProps = {
  travelRecord: TravelRecord;
  images?: ReviewMedia[];
  onPress?: () => void;
};

function Placeholder({
  travelRecord,
  width,
  height,
}: {
  travelRecord: TravelRecord;
  width: number;
  height: number;
}) {
  const icon = travelRecordThumbnailIcon(travelRecord);
  const destinationLabel = travelRecordDestinationLabel(travelRecord);
  return (
    <View
      style={[styles.placeholder, { width, height }]}
      className="items-center justify-center bg-brand-selected">
      <AppIcon name={icon} size={56} color={ICON_COLOR_PRIMARY} />
      <Text className="mt-3 px-6 text-center text-sm font-semibold text-brand-text">
        {travelRecord.title ?? ''}
      </Text>
      <Text className="mt-1 text-xs text-brand-muted">{destinationLabel}</Text>
    </View>
  );
}

export function TravelogueImageCarousel({
  travelRecord,
  images: imagesProp,
  onPress,
}: TravelogueImageCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const imageWidth = screenWidth;
  const imageHeight = Math.round(screenWidth * 0.85);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<Record<string, true>>({});

  const mediaItems = useMemo(
    () => imagesProp ?? collectTravelRecordMedia(travelRecord),
    [imagesProp, travelRecord],
  );

  const visibleMedia = mediaItems.filter(item => !failedIds[item.mediaId]);

  const content =
    visibleMedia.length === 0 ? (
      <Placeholder
        travelRecord={travelRecord}
        width={imageWidth}
        height={imageHeight}
      />
    ) : (
      <>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={event => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / imageWidth,
            );
            setActiveIndex(index);
          }}>
          {visibleMedia.map((item, index) => (
            <View
              key={item.mediaId}
              style={{ width: imageWidth, height: imageHeight }}>
              {item.type === 'video' ? (
                <ReviewVideoSlide
                  uri={item.uri}
                  fileKey={item.fileKey}
                  width={imageWidth}
                  height={imageHeight}
                  active={index === activeIndex}
                  onError={() => {
                    setFailedIds(prev => ({ ...prev, [item.mediaId]: true }));
                  }}
                />
              ) : onPress ? (
                <Pressable
                  onPress={onPress}
                  accessibilityRole="button"
                  style={{ width: imageWidth, height: imageHeight }}>
                  <ResolvedRemoteImage
                    uri={item.uri}
                    fileKey={item.fileKey}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() => {
                      setFailedIds(prev => ({ ...prev, [item.mediaId]: true }));
                    }}
                  />
                </Pressable>
              ) : (
                <ResolvedRemoteImage
                  uri={item.uri}
                  fileKey={item.fileKey}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => {
                    setFailedIds(prev => ({ ...prev, [item.mediaId]: true }));
                  }}
                />
              )}
            </View>
          ))}
        </ScrollView>
        {visibleMedia.length > 1 ? (
          <View className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1">
            <Text className="text-xs font-bold text-white">
              {activeIndex + 1}/{visibleMedia.length}
            </Text>
          </View>
        ) : null}
      </>
    );

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
