import { Modal, Pressable, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_MENU_ITEMS } from '../../constants/appMenu';
import type { AppLanguage } from '../../types/user';
import type { RootStackParamList } from '../../navigation/types';
import { useAppBarTopInset } from './AppBar';

type AppMenuDrawerProps = {
  visible: boolean;
  language: AppLanguage;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onClose: () => void;
};

export function AppMenuDrawer({
  visible,
  language,
  navigation,
  onClose,
}: AppMenuDrawerProps) {
  const insets = useSafeAreaInsets();
  const topInset = useAppBarTopInset();

  const handlePress = (item: (typeof APP_MENU_ITEMS)[number]) => {
    onClose();
    const { target } = item;
    if (target.kind === 'screen') {
      navigation.navigate(target.route);
      return;
    }
    const title = language === 'ko' ? target.titleKo : target.titleEn;
    navigation.navigate('MenuPlaceholder', { title });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View className="flex-1 flex-row">
        <Pressable className="flex-1 bg-black/40" onPress={onClose} accessibilityRole="button" />

        <View
          className="w-[280px] bg-brand-surface shadow-lg"
          style={{ paddingTop: topInset, paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="border-b border-brand-border px-5 py-4">
            <Text className="text-lg font-bold text-brand-primary">BU-TING</Text>
            <Text className="mt-0.5 text-xs text-brand-muted">
              {language === 'ko' ? '메뉴' : 'Menu'}
            </Text>
          </View>

          <View className="px-2 py-2">
            {APP_MENU_ITEMS.map(item => (
              <Pressable
                key={item.id}
                onPress={() => handlePress(item)}
                className="rounded-xl px-3 py-3.5 active:bg-brand-selected"
                accessibilityRole="button">
                <Text className="text-base font-semibold text-brand-text">
                  {language === 'ko' ? item.labelKo : item.labelEn}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
