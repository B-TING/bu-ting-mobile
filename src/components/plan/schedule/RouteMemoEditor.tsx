import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

type RouteMemoEditorProps = {
  memo?: string;
  title: string;
  placeholder: string;
  saveLabel: string;
  onSave: (memo: string | undefined) => void | Promise<void>;
};

export function RouteMemoEditor({
  memo,
  title,
  placeholder,
  saveLabel,
  onSave,
}: RouteMemoEditorProps) {
  const [draft, setDraft] = useState(memo ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(memo ?? '');
  }, [memo]);

  const trimmed = draft.trim();
  const saved = (memo ?? '').trim();
  const dirty = trimmed !== saved;

  const handleSave = async () => {
    if (!dirty || saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed || undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
      <Text className="mb-2 text-xs font-bold text-brand-muted">{title}</Text>
      <TextInput
        className="min-h-[88px] rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-text"
        multiline
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={draft}
        onChangeText={setDraft}
        editable={!saving}
      />
      {dirty ? (
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="mt-3 self-start rounded-full bg-brand-primary px-4 py-2 active:opacity-80 disabled:opacity-60">
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-sm font-semibold text-white">{saveLabel}</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
