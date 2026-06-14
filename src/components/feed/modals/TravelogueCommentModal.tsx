import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import {
  AppModal,
  AppModalActions,
} from '../../shared/modals';
import type { TRAVEL_REVIEW_COPY } from '../../../constants/travelReview';
import type { AppLanguage } from '../../../types/user';
import { authorInitial } from '../../../utils/travelReview';

type Copy = (typeof TRAVEL_REVIEW_COPY)[AppLanguage];

type TravelogueCommentModalProps = {
  visible: boolean;
  copy: Copy;
  userName: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
};

export function TravelogueCommentModal({
  visible,
  copy,
  userName,
  subtitle,
  onClose,
  onSubmit,
}: TravelogueCommentModalProps) {
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!visible) {
      setDraft('');
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
    setDraft('');
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={copy.feedCommentsTitle}
      subtitle={subtitle}
      keyboardAware
      closeAccessibilityLabel={copy.cancel}
      footer={
        <AppModalActions
          className="mt-5"
          actions={[
            { label: copy.cancel, onPress: onClose, variant: 'secondary' },
            {
              label: copy.feedAddComment,
              onPress: handleSubmit,
              variant: 'primary',
              disabled: !draft.trim(),
            },
          ]}
        />
      }>
      <View className="flex-row items-end gap-2 px-5">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-selected">
          <Text className="text-xs font-bold text-brand-primary">
            {authorInitial(userName)}
          </Text>
        </View>
        <View className="min-h-[88px] flex-1 rounded-2xl border border-brand-border bg-brand-background px-3 py-2">
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder={copy.feedCommentPlaceholder}
            placeholderTextColor="#94A3B8"
            multiline
            className="min-h-[64px] flex-1 text-sm leading-5 text-brand-text"
            textAlignVertical="top"
          />
        </View>
      </View>
    </AppModal>
  );
}
