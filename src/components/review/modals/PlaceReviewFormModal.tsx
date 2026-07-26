import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { REVIEW_TAG_PRESETS } from '../../../constants/review/travelReview';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import type { CopyFor } from '../../../i18n';
import type { AppLanguage } from '../../../types/user';
import type { PlaceReview, ReviewMedia } from '../../../types/travelReview';
import type { RouteItem } from '../../../types/travelPlan';
import { createId } from '../../../utils/common/id';
import { pickReviewMedia } from '../../../utils/media/pickMedia';
import { StarRating } from '../../shared/rating/StarRating';
import { AppIcon } from '../../shared/icons/AppIcon';
import { AppModal, AppModalActions } from '../../shared/modals';

type Copy = CopyFor<'travelReview'>;

const MAX_MEDIA = 20;

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

function isDisplayableImageUri(uri: string): boolean {
  return (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://')
  );
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
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [picking, setPicking] = useState(false);

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

  const busy = submitting || saving || deleting || picking;

  const showPickError = (result: Awaited<ReturnType<typeof pickReviewMedia>>) => {
    if (result.status === 'denied') {
      Alert.alert(copy.mediaPermissionDenied);
      return;
    }
    if (result.status === 'error') {
      Alert.alert(copy.mediaPickFailed);
    }
  };

  const addMedia = async (mediaType: 'image' | 'video') => {
    if (picking || busy) {
      return;
    }
    if (media.length >= MAX_MEDIA) {
      Alert.alert(copy.mediaLimitReached);
      return;
    }
    setPicking(true);
    try {
      const result = await pickReviewMedia({
        mediaType,
        labels: {
          title: mediaType === 'video' ? copy.addVideo : copy.addPhoto,
          chooseFromLibrary: copy.chooseFromLibrary,
          takePhoto: copy.takePhoto,
          takeVideo: copy.takeVideo,
          cancel: copy.cancel,
        },
      });
      if (result.status !== 'ok') {
        showPickError(result);
        return;
      }
      setMedia(prev => {
        if (prev.length >= MAX_MEDIA) {
          return prev;
        }
        return [
          ...prev,
          {
            mediaId: createId('med-'),
            type: result.asset.type,
            uri: result.asset.uri,
            fileName: result.asset.fileName,
            mimeType: result.asset.mimeType,
          },
        ];
      });
    } finally {
      setPicking(false);
    }
  };

  const removeMedia = (mediaId: string) => {
    setMedia(prev => prev.filter(m => m.mediaId !== mediaId));
  };

  const handleSave = async () => {
    if (submitting || saving || deleting || picking) {
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
            onPress={() => {
              void addMedia('image');
            }}
            disabled={busy}
            className="flex-1 items-center rounded-xl border border-dashed border-brand-border bg-brand-surface py-3 active:opacity-80">
            <Text className="text-sm font-semibold text-brand-primary">{copy.addPhoto}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void addMedia('video');
            }}
            disabled={busy}
            className="flex-1 items-center rounded-xl border border-dashed border-brand-border bg-brand-surface py-3 active:opacity-80">
            <Text className="text-sm font-semibold text-brand-primary">{copy.addVideo}</Text>
          </Pressable>
        </View>
        {media.length > 0 ? (
          <View className="mb-2 flex-row flex-wrap gap-2">
            {media.map(item => {
              const showImage =
                item.type === 'image' && isDisplayableImageUri(item.uri);
              return (
                <Pressable
                  key={item.mediaId}
                  onPress={() => removeMedia(item.mediaId)}
                  className="relative h-16 w-16 overflow-hidden rounded-xl bg-brand-selected">
                  {showImage ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <AppIcon
                        name={item.type === 'video' ? 'film' : 'camera'}
                        size={24}
                        color={ICON_COLOR_PRIMARY}
                      />
                    </View>
                  )}
                  {item.type === 'video' ? (
                    <View className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5">
                      <Text className="text-center text-[8px] font-bold text-white">
                        VIDEO
                      </Text>
                    </View>
                  ) : null}
                  <View className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5">
                    <AppIcon name="x" size={10} color="#FFFFFF" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Text className="mb-4 text-[10px] text-brand-muted">{copy.mediaHint}</Text>
      </ScrollView>
    </AppModal>
  );
}
