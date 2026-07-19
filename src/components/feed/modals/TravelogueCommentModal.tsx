import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import {
  AppModal,
  AppModalActions,
} from '../../shared/modals';
import type { CopyFor } from '../../../i18n';
import { authorInitial } from '../../../utils/review/travelReview';

type Copy = CopyFor<'travelReview'>;

type TravelogueCommentModalProps = {
  visible: boolean;
  copy: Copy;
  userName: string;
  subtitle?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void | Promise<void>;
};

export function TravelogueCommentModal({
  visible,
  copy,
  userName,
  subtitle,
  submitting = false,
  onClose,
  onSubmit,
}: TravelogueCommentModalProps) {
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDraft('');
      setBusy(false);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed || busy || submitting) {
      return;
    }
    setBusy(true);
    void Promise.resolve(onSubmit(trimmed))
      .then(() => {
        setDraft('');
        onClose();
      })
      .catch(() => {
        // 호출 측에서 안내. 모달은 유지해 재시도 가능.
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const disabled = !draft.trim() || busy || submitting;

  return (
    <AppModal
      visible={visible}
      onClose={busy || submitting ? () => undefined : onClose}
      title={copy.feedCommentsTitle}
      subtitle={subtitle}
      keyboardAware
      closeAccessibilityLabel={copy.cancel}
      footer={
        <AppModalActions
          className="mt-5"
          actions={[
            {
              label: copy.cancel,
              onPress: onClose,
              variant: 'secondary',
              disabled: busy || submitting,
            },
            {
              label: copy.feedAddComment,
              onPress: handleSubmit,
              variant: 'primary',
              disabled,
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
            editable={!busy && !submitting}
            className="min-h-[64px] flex-1 text-sm leading-5 text-brand-text"
            textAlignVertical="top"
          />
        </View>
      </View>
    </AppModal>
  );
}
