import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import type { TravelogueComment } from '../../types/travelReview';
import { authorInitial } from '../../utils/travelReview';

type Copy = (typeof TRAVEL_REVIEW_COPY)['ko'];

type TravelogueCommentsSectionProps = {
  copy: Copy;
  comments: TravelogueComment[];
  currentUserName: string;
  language?: 'ko' | 'en' | 'ja' | 'zh';
  previewLimit?: number;
  onAddComment: (text: string) => void;
  onViewAllPress?: () => void;
};

function formatCommentDate(iso: string, language: 'ko' | 'en' | 'ja' | 'zh'): string {
  const date = new Date(iso);
  return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function TravelogueCommentsSection({
  copy,
  comments,
  currentUserName,
  language = 'ko',
  previewLimit,
  onAddComment,
  onViewAllPress,
}: TravelogueCommentsSectionProps) {
  const [draft, setDraft] = useState('');
  const visibleComments = previewLimit ? comments.slice(-previewLimit) : comments;
  const hiddenCount = previewLimit ? Math.max(comments.length - previewLimit, 0) : 0;

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    onAddComment(trimmed);
    setDraft('');
  };

  return (
    <View>
      {hiddenCount > 0 && onViewAllPress ? (
        <Pressable onPress={onViewAllPress} className="mb-2 active:opacity-80">
          <Text className="text-xs font-semibold text-brand-muted">
            {copy.feedViewAllComments(comments.length)}
          </Text>
        </Pressable>
      ) : null}

      {visibleComments.length === 0 ? (
        <Text className="mb-3 text-sm text-brand-muted">{copy.feedCommentsEmpty}</Text>
      ) : (
        visibleComments.map(comment => (
          <View key={comment.commentId} className="mb-3 flex-row gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-selected">
              <Text className="text-xs font-bold text-brand-primary">
                {authorInitial(comment.authorName)}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm leading-5 text-brand-text">
                <Text className="font-bold">{comment.authorName}</Text>{' '}
                {comment.text}
              </Text>
              <Text className="mt-0.5 text-[10px] text-brand-muted">
                {formatCommentDate(comment.createdAt, language)}
              </Text>
            </View>
          </View>
        ))
      )}

      <View className="mt-1 flex-row items-end gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-selected">
          <Text className="text-xs font-bold text-brand-primary">
            {authorInitial(currentUserName)}
          </Text>
        </View>
        <View className="min-h-[44px] flex-1 flex-row items-end rounded-2xl border border-brand-border bg-brand-background px-3 py-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={copy.feedCommentPlaceholder}
            placeholderTextColor="#94A3B8"
            multiline
            className="max-h-24 flex-1 text-sm text-brand-text"
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!draft.trim()}
            className="ml-2 active:opacity-80">
            <Text
              className={`text-sm font-bold ${
                draft.trim() ? 'text-brand-primary' : 'text-brand-muted'
              }`}>
              {copy.feedAddComment}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
