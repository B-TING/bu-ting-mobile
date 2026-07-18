import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { QuickAccessItem } from '../../../constants/home/mainHome';
import { ICON_COLOR_PRIMARY } from '../../../constants/icons';
import { AppIcon } from '../../shared/icons/AppIcon';

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
          accessibilityRole="button"
        >
          <View
            style={[styles.iconShadow, styles.border]}
            className="mb-2 h-14 w-14 items-center justify-center rounded-2xl bg-white"
          >
            <AppIcon name={item.icon} size={26} color={ICON_COLOR_PRIMARY} />
          </View>
          <Text className="text-center text-xs font-semibold text-brand-text">
            {language === 'ko' ? item.labelKo : item.labelEn}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
});
