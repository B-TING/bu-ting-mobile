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

import { REVIEW_TAG_PRESETS, type TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import type { AppLanguage } from '../../types/user';
import type { PlaceReview, ReviewMedia } from '../../types/travelReview';
import type { RouteItem } from '../../types/travelPlan';
import { createId } from '../../utils/id';
import { StarRating } from './StarRating';

type Copy = (typeof TRAVEL_REVIEW_COPY)[AppLanguage];

type PlaceReviewFormModalProps = {
  visible: boolean;
  route: RouteItem | null;
  existing?: PlaceReview;
  copy: Copy;
  language: AppLanguage;
  planId: string;
  onClose: () => void;
  onSave: (payload: Omit<PlaceReview, 'reviewId' | 'createdAt' | 'updatedAt'> & {
    reviewId?: string;
  }) => void;
};

const MOCK_PHOTO_EMOJIS = ['📷', '🌊', '🍜', '🌸', '🏙️'];
const MOCK_VIDEO_EMOJI = '🎬';

export function PlaceReviewFormModal({
  visible,
  route,
  existing,
  copy,
  language,
  planId,
  onClose,
  onSave,
}: PlaceReviewFormModalProps) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [comment, setComment] = useState('');
  const [media, setMedia] = useState<ReviewMedia[]>([]);

  const presets = REVIEW_TAG_PRESETS[language];

  useEffect(() => {
    if (!visible || !route) {
      return;
    }
    setRating(existing?.rating ?? 5);
    setTags(existing?.tags ?? []);
    setTagInput('');
    setComment(existing?.comment ?? '');
    setMedia(existing?.media ?? []);
  }, [visible, route, existing]);

  if (!route) {
    return null;
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 8) {
      return;
    }
    setTags(prev => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const addMockPhoto = () => {
    const idx = media.filter(m => m.type === 'image').length;
    setMedia(prev => [
      ...prev,
      {
        mediaId: createId('med-'),
        type: 'image',
        uri: `local://photo-${Date.now()}`,
        thumbnailUri: MOCK_PHOTO_EMOJIS[idx % MOCK_PHOTO_EMOJIS.length],
      },
    ]);
  };

  const addMockVideo = () => {
    setMedia(prev => [
      ...prev,
      {
        mediaId: createId('med-'),
        type: 'video',
        uri: `local://video-${Date.now()}`,
        thumbnailUri: MOCK_VIDEO_EMOJI,
      },
    ]);
  };

  const removeMedia = (mediaId: string) => {
    setMedia(prev => prev.filter(m => m.mediaId !== mediaId));
  };

  const handleSave = () => {
    onSave({
      reviewId: existing?.reviewId,
      planId,
      routeItemId: route.itemId,
      placeId: route.placeId,
      placeName: route.placeName,
      rating,
      tags,
      comment: comment.trim(),
      media,
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
            { paddingBottom: Math.max(insets.bottom, 16), maxHeight: '90%' },
          ]}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text className="mb-4 text-xl font-bold text-brand-text">{copy.reviewTitle}</Text>

            <Text className="mb-1 text-xs font-bold text-brand-muted">{copy.placeLabel}</Text>
            <Text className="mb-4 text-base font-semibold text-brand-text">
              {route.placeName}
            </Text>

            <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.ratingLabel}</Text>
            <StarRating value={rating} onChange={setRating} />

            <Text className="mb-2 mt-4 text-xs font-bold text-brand-muted">{copy.tagsLabel}</Text>
            <View className="mb-2 flex-row flex-wrap gap-2">
              {presets.map(tag => {
                const active = tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => (active ? removeTag(tag) : addTag(tag))}
                    className={`rounded-full px-3 py-1.5 ${
                      active ? 'bg-brand-primary' : 'bg-brand-selected'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        active ? 'text-white' : 'text-brand-primary'
                      }`}>
                      #{tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="mb-2 flex-row gap-2">
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder={copy.tagPlaceholder}
                placeholderTextColor="#94A3B8"
                onSubmitEditing={() => addTag(tagInput)}
                className="flex-1 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-text"
              />
              <Pressable
                onPress={() => addTag(tagInput)}
                className="items-center justify-center rounded-xl bg-brand-selected px-4 active:opacity-80">
                <Text className="text-sm font-bold text-brand-primary">+</Text>
              </Pressable>
            </View>
            {tags.length > 0 ? (
              <View className="mb-2 flex-row flex-wrap gap-1">
                {tags.map(tag => (
                  <Pressable
                    key={tag}
                    onPress={() => removeTag(tag)}
                    className="rounded-full bg-brand-border px-2 py-1">
                    <Text className="text-[10px] text-brand-text">#{tag} ×</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text className="mb-2 mt-2 text-xs font-bold text-brand-muted">
              {copy.commentLabel}
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder={copy.commentPlaceholder}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="mb-4 min-h-[96px] rounded-xl border border-brand-border bg-white px-3 py-3 text-sm text-brand-text"
            />

            <Text className="mb-2 text-xs font-bold text-brand-muted">{copy.mediaLabel}</Text>
            <View className="mb-2 flex-row gap-2">
              <Pressable
                onPress={addMockPhoto}
                className="flex-1 items-center rounded-xl border border-dashed border-brand-border bg-brand-surface py-3 active:opacity-80">
                <Text className="text-sm font-semibold text-brand-primary">{copy.addPhoto}</Text>
              </Pressable>
              <Pressable
                onPress={addMockVideo}
                className="flex-1 items-center rounded-xl border border-dashed border-brand-border bg-brand-surface py-3 active:opacity-80">
                <Text className="text-sm font-semibold text-brand-primary">{copy.addVideo}</Text>
              </Pressable>
            </View>
            {media.length > 0 ? (
              <View className="mb-2 flex-row flex-wrap gap-2">
                {media.map(item => (
                  <Pressable
                    key={item.mediaId}
                    onPress={() => removeMedia(item.mediaId)}
                    className="h-16 w-16 items-center justify-center rounded-xl bg-brand-selected">
                    <Text className="text-2xl">{item.thumbnailUri ?? '📎'}</Text>
                    <Text className="text-[8px] text-brand-muted">
                      {item.type === 'video' ? 'VIDEO' : 'PHOTO'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text className="mb-4 text-[10px] text-brand-muted">{copy.mediaMockHint}</Text>
          </ScrollView>

          <View className="flex-row gap-3 px-5">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-2xl border border-brand-border py-3 active:opacity-80">
              <Text className="font-bold text-brand-text">{copy.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
              <Text className="font-bold text-white">{copy.save}</Text>
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
