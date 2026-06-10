import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';

type TabPreviewCardProps = {
  title: string;
  hint: string;
  onPress: () => void;
  children: ReactNode;
};

export function TabPreviewCard({ title, hint, onPress, children }: TabPreviewCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-brand-border bg-brand-surface p-4 active:opacity-90"
      accessibilityRole="button">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-text">{title}</Text>
        <Text className="text-xs font-semibold text-brand-primary">{hint}</Text>
      </View>
      {children}
    </Pressable>
  );
}
