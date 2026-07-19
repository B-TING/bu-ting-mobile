import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { REVIEW_TAG_PRESETS } from '../../../constants/review/travelReview';
import type { LucideIconName } from '../../../constants/icons';
import { LUCIDE_ICONS } from '../../../constants/icons';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { PlaceReview, ReviewMedia } from '../../../types/travelReview';
import type { RouteItem } from '../../../types/travelPlan';
import { createId } from '../../../utils/common/id';
import { StarRating } from '../../shared/rating/StarRating';
import { AppIcon } from '../../shared/icons/AppIcon';
import { AppModal, AppModalActions } from '../../shared/modals';

type Copy = CopyFor<'travelReview'>;

type PlaceReviewFormModalProps = {
  visible: boolean;
  route: RouteItem | null;
  existing?: PlaceReview;
  copy: Copy;
  language: AppLanguage;
  onClose: () => void;
  onSave: (
    payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
      placeReviewId?: string;
    },
  ) => void | Promise<void>;
  /** 기존 후기 삭제 (일정 장소는 유지) */
  onDelete?: () => void | Promise<void>;
  saving?: boolean;
};

const MOCK_PHOTO_ICONS: LucideIconName[] = ['camera', 'waves', 'utensils', 'flower2', 'building2'];
const MOCK_VIDEO_ICON: LucideIconName = 'film';

function mockMediaIcon(thumbnailUri?: string): LucideIconName {
  if (thumbnailUri && thumbnailUri in LUCIDE_ICONS) {
    return thumbnailUri as LucideIconName;
  }
  return 'paperclip';
}

export function PlaceReviewFormModal({
  visible,
  route,
  existing,
  copy,
  language,
  onClose,
  onSave,
  onDelete,
  saving = false,
}: PlaceReviewFormModalProps) {
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  /** Mock-only media until upload API exists */
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const presets = REVIEW_TAG_PRESETS[language];
  const canDelete = Boolean(existing?.placeReviewId && onDelete);

  useEffect(() => {
    if (!visible || !route) {
      return;
    }
    setRating(existing?.rating ?? 5);
    setTags(existing?.tags ?? []);
    setTagInput('');
    setContent(existing?.content ?? '');
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
        thumbnailUri: MOCK_PHOTO_ICONS[idx % MOCK_PHOTO_ICONS.length],
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
        thumbnailUri: MOCK_VIDEO_ICON,
      },
    ]);
  };

  const removeMedia = (mediaId: string) => {
    setMedia(prev => prev.filter(m => m.mediaId !== mediaId));
  };

  const handleSave = async () => {
    if (submitting || saving || deleting) {
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        placeReviewId: existing?.placeReviewId,
        planPlaceId: route.apiPlanPlaceId ?? null,
        travelRecordPlaceId: existing?.travelRecordPlaceId ?? null,
        placeName: route.placeName,
        rating,
        tags,
        content: content.trim() || null,
        media,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || submitting || saving || deleting) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      // 취소·실패 시 모달 유지 (실패 알림은 부모에서 처리)
    } finally {
      setDeleting(false);
    }
  };

  const busy = submitting || saving || deleting;

  const footerActions = [
    {
      label: copy.cancel,
      onPress: onClose,
      variant: 'secondary' as const,
      disabled: busy,
    },
    ...(canDelete
      ? [
          {
            label: deleting
              ? language === 'ko'
                ? '삭제 중…'
                : 'Deleting…'
              : copy.deleteReview,
            onPress: () => {
              void handleDelete();
            },
            variant: 'danger' as const,
            disabled: busy,
          },
        ]
      : []),
    {
      label: copy.save,
      onPress: () => {
        void handleSave();
      },
      variant: 'primary' as const,
      disabled: busy,
    },
  ];

  return (
    <AppModal
      visible={visible}
      onClose={busy ? () => undefined : onClose}
      title={existing ? copy.editReview : copy.reviewTitle}
      maxHeight="90%"
      keyboardAware
      footer={<AppModalActions actions={footerActions} />}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-xs font-bold text-brand-muted">{copy.placeLabel}</Text>
        <Text className="mb-4 text-base font-semibold text-brand-text">{route.placeName}</Text>

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

        <Text className="mb-2 mt-2 text-xs font-bold text-brand-muted">{copy.commentLabel}</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
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
                <AppIcon name={mockMediaIcon(item.thumbnailUri)} size={24} />
                <Text className="text-[8px] text-brand-muted">
                  {item.type === 'video' ? 'VIDEO' : 'PHOTO'}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Text className="mb-4 text-[10px] text-brand-muted">{copy.mediaMockHint}</Text>
      </ScrollView>
    </AppModal>
  );
}
