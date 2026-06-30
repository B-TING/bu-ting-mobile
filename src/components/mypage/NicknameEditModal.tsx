import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { cn } from '../../utils/common/cn';
import { AppModal, AppModalPrimaryFooter } from '../shared/modals';

type NicknameEditModalProps = {
  visible: boolean;
  initialNickname: string;
  copy: {
    title: string;
    placeholder: string;
    save: string;
    cancel: string;
  };
  saving: boolean;
  onClose: () => void;
  onSave: (nickname: string) => void;
};

export function NicknameEditModal({
  visible,
  initialNickname,
  copy,
  saving,
  onClose,
  onSave,
}: NicknameEditModalProps) {
  const [nickname, setNickname] = useState(initialNickname);

  useEffect(() => {
    if (visible) {
      setNickname(initialNickname);
    }
  }, [visible, initialNickname]);

  const trimmed = nickname.trim();
  const canSave = trimmed.length > 0 && trimmed !== initialNickname.trim() && !saving;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={copy.title}
      keyboardAware
      backdropDismiss={!saving}
      showHandle>
      <View className="px-5 pb-2">
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder={copy.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          editable={!saving}
          className={cn(
            'rounded-xl border border-brand-border bg-brand-background px-4 py-3 text-base text-brand-text',
            saving && 'opacity-60',
          )}
        />
      </View>
      <AppModalPrimaryFooter
        confirmLabel={copy.save}
        onConfirm={() => onSave(trimmed)}
        confirmDisabled={!canSave}
        cancelLabel={copy.cancel}
        onCancel={onClose}
      />
    </AppModal>
  );
}
