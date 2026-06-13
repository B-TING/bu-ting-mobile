import { Pressable, Text, View } from 'react-native';

import type { QuickAccessItem } from '../../../constants/mainHome';

type QuickAccessRowProps = {
  items: QuickAccessItem[];
  language?: 'ko' | 'en' | 'ja' | 'zh';
  onItemPress?: (id: string) => void;
};

export function QuickAccessRow({
  items,
  language = 'ko',
  onItemPress,
}: QuickAccessRowProps) {
  return (
    <View className="mb-6 flex-row justify-between">
      {items.map(item => (
        <Pressable
          key={item.id}
          onPress={() => onItemPress?.(item.id)}
          className="flex-1 items-center active:opacity-80"
          accessibilityRole="button">
          <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-brand-selected">
            <Text className="text-2xl">{item.icon}</Text>
          </View>
          <Text className="text-center text-xs font-semibold text-brand-text">
            {language === 'ko' ? item.labelKo : item.labelEn}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
