import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!visible) {
      setDraft('');
      setKeyboardInset(0);
      return;
    }

    const timer = setTimeout(() => inputRef.current?.focus(), 100);

    if (Platform.OS !== 'ios') {
      return () => clearTimeout(timer);
    }

    const onShow = (event: KeyboardEvent) => {
      setKeyboardInset(event.endCoordinates.height);
    };
    const onHide = () => setKeyboardInset(0);

    const showSub = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onHide);

    return () => {
      clearTimeout(timer);
      showSub.remove();
      hideSub.remove();
    };
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

  // Android: MainActivity IME padding이 이미 적용됨 — JS offset 중복 적용 시 시트가 과하게 올라감
  const keyboardOffset =
    Platform.OS === 'ios' ? Math.max(0, keyboardInset - insets.bottom) : 0;
  const sheetBottomPad = Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, keyboardOffset > 0 && { paddingBottom: keyboardOffset }]}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.cancel} />

        <View style={[styles.sheet, { paddingBottom: sheetBottomPad }]}>
          <View style={styles.handle} />

          <Text className="mb-1 px-5 text-lg font-bold text-brand-text">
            {copy.feedCommentsTitle}
          </Text>
          {subtitle ? (
            <Text className="mb-4 px-5 text-sm text-brand-muted" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : (
            <View className="mb-4" />
          )}

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

          <View className="mt-5 flex-row gap-3 px-5">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-2xl border border-brand-border bg-brand-surface py-3.5 active:opacity-80">
              <Text className="font-bold text-brand-text">{copy.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!draft.trim()}
              className={`flex-1 items-center rounded-2xl py-3.5 active:opacity-90 ${
                draft.trim() ? 'bg-brand-primary' : 'bg-brand-border'
              }`}>
              <Text className={`font-bold ${draft.trim() ? 'text-white' : 'text-brand-muted'}`}>
                {copy.feedAddComment}
              </Text>
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
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
});
