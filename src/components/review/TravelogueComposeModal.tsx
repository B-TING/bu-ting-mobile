import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import type { AppLanguage } from '../../types/user';
import type { PlaceReview } from '../../types/travelReview';
import {
  averageRating,
  buildDefaultOverallReview,
  buildDefaultTravelogueTitle,
} from '../../utils/travelReview';
import { StarRating } from './StarRating';

type Copy = (typeof TRAVEL_REVIEW_COPY)[AppLanguage];

type TravelogueComposeModalProps = {
  visible: boolean;
  copy: Copy;
  language: AppLanguage;
  authorName: string;
  destinationLabel: string;
  placeReviews: PlaceReview[];
  defaultTitle?: string;
  onClose: () => void;
  onPublish: (payload: {
    title: string;
    overallReview: string;
    overallRating: number;
    isPublic: boolean;
  }) => void;
};

export function TravelogueComposeModal({
  visible,
  copy,
  language,
  authorName,
  destinationLabel,
  placeReviews,
  defaultTitle,
  onClose,
  onPublish,
}: TravelogueComposeModalProps) {
  const insets = useSafeAreaInsets();
  const computedRating = averageRating(placeReviews);
  const [title, setTitle] = useState('');
  const [overallReview, setOverallReview] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setTitle(
      defaultTitle ?? buildDefaultTravelogueTitle(destinationLabel, language),
    );
    setOverallReview(buildDefaultOverallReview(placeReviews, language));
    setIsPublic(true);
  }, [visible, defaultTitle, destinationLabel, language, placeReviews]);

  const handlePublish = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }
    onPublish({
      title: trimmedTitle,
      overallReview: overallReview.trim(),
      overallRating: computedRating,
      isPublic,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), maxHeight: '92%' },
          ]}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text className="mb-1 text-xl font-bold text-brand-text">{copy.composeTitle}</Text>
            <Text className="mb-4 text-sm text-brand-muted">{copy.composeSub}</Text>

            <Text className="mb-1 text-xs font-bold text-brand-muted">{copy.travelogueTitle}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={copy.travelogueTitlePlaceholder}
              placeholderTextColor="#94A3B8"
              className="mb-4 rounded-xl border border-brand-border bg-white px-3 py-3 text-sm text-brand-text"
            />

            <Text className="mb-1 text-xs font-bold text-brand-muted">{copy.authorLabel}</Text>
            <Text className="mb-4 text-base font-semibold text-brand-text">{authorName}</Text>

            <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallRating}</Text>
            <View className="mb-1 flex-row items-center gap-2">
              <StarRating value={computedRating} readonly />
              <Text className="text-sm font-bold text-brand-primary">
                {copy.stars(computedRating)}
              </Text>
            </View>
            <Text className="mb-4 text-[10px] text-brand-muted">
              {placeReviews.length > 0
                ? `${placeReviews.length} places · auto average`
                : copy.noReviewsYet}
            </Text>

            <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.visibilityLabel}</Text>
            <View className="mb-2 flex-row gap-2">
              <Pressable
                onPress={() => setIsPublic(true)}
                className={`flex-1 items-center rounded-xl border py-3 ${
                  isPublic
                    ? 'border-brand-primary bg-brand-selected'
                    : 'border-brand-border bg-white'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    isPublic ? 'text-brand-primary' : 'text-brand-muted'
                  }`}>
                  {copy.visibilityPublic}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsPublic(false)}
                className={`flex-1 items-center rounded-xl border py-3 ${
                  !isPublic
                    ? 'border-brand-primary bg-brand-selected'
                    : 'border-brand-border bg-white'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    !isPublic ? 'text-brand-primary' : 'text-brand-muted'
                  }`}>
                  {copy.visibilityPrivate}
                </Text>
              </Pressable>
            </View>
            <Text className="mb-4 text-[10px] text-brand-muted">
              {isPublic ? copy.visibilityPublicHint : copy.visibilityPrivateHint}
            </Text>

            <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.overallReview}</Text>
            <TextInput
              value={overallReview}
              onChangeText={setOverallReview}
              placeholder={copy.overallReviewPlaceholder}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="mb-4 min-h-[120px] rounded-xl border border-brand-border bg-white px-3 py-3 text-sm text-brand-text"
            />

            <Text className="mb-3 text-xs font-bold text-brand-muted">
              {copy.placeReviewsSection}
            </Text>
            {placeReviews.length === 0 ? (
              <Text className="mb-2 text-sm text-brand-muted">{copy.composePartialHint}</Text>
            ) : (
              placeReviews.map(review => (
                <View
                  key={review.reviewId}
                  className="mb-2 rounded-xl border border-brand-border bg-brand-surface px-3 py-3">
                  <Text className="font-semibold text-brand-text">{review.placeName}</Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <StarRating value={review.rating} readonly size="sm" />
                    <Text className="text-xs text-brand-muted">{copy.stars(review.rating)}</Text>
                  </View>
                  {review.comment ? (
                    <Text className="mt-1 text-xs text-brand-muted" numberOfLines={2}>
                      {review.comment}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>

          <View className="flex-row gap-3 px-5">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-2xl border border-brand-border py-3 active:opacity-80">
              <Text className="font-bold text-brand-text">{copy.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handlePublish}
              className="flex-1 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
              <Text className="font-bold text-white">{copy.publish}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
