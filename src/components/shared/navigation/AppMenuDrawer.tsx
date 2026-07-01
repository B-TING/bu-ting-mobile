import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_MENU_ITEMS } from '../../../constants/common/appMenu';
import { APP_MODAL } from '../modals';
import type { AppLanguage } from '../../../types/user';
import type { RootStackParamList } from '../../../navigation/types';
import { BrandLogo } from '../brand/BrandLogo';
import { useAppBarTopInset } from './AppBar';

const DRAWER_WIDTH = 280;
const SLIDE_DURATION = 280;
const CLOSE_BTN_SIZE = 40;

type AppMenuDrawerProps = {
  visible: boolean;
  language: AppLanguage;
  navigation: NavigationProp<RootStackParamList>;
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
  const [mounted, setMounted] = useState(false);
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideX.setValue(-DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(slideX, {
        toValue: -DRAWER_WIDTH,
        duration: SLIDE_DURATION * 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: SLIDE_DURATION * 0.8,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, mounted, slideX, backdropOpacity]);

  const dismiss = () => {
    onClose();
  };

  const handlePress = (item: (typeof APP_MENU_ITEMS)[number]) => {
    dismiss();
    const { target } = item;
    if (target.kind === 'screen') {
      navigation.navigate({
        name: target.route,
        params: target.params,
      } as never);
      return;
    }
    const title = language === 'ko' ? target.titleKo : target.titleEn;
    navigation.navigate('MenuPlaceholder', { title });
  };

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={dismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityRole="button" />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              paddingTop: topInset,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateX: slideX }],
            },
          ]}>
          <View className="border-b border-brand-border px-5 py-4">
            <BrandLogo height={24} />
            <Text className="mt-2 text-xs text-brand-muted">
              {language === 'ko' ? '메뉴' : 'Menu'}
            </Text>
          </View>

          <View className="flex-1 px-2 py-2">
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

          <Pressable
            onPress={dismiss}
            style={[styles.collapseBtn, { top: topInset + 72 }]}
            className="items-center justify-center rounded-full border border-brand-border bg-brand-surface shadow-md active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={language === 'ko' ? '메뉴 접기' : 'Close menu'}>
            <Text className="text-lg font-bold text-brand-primary">‹</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: APP_MODAL.backdropColor,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  collapseBtn: {
    position: 'absolute',
    right: -CLOSE_BTN_SIZE / 2,
    width: CLOSE_BTN_SIZE,
    height: CLOSE_BTN_SIZE,
    zIndex: 10,
  },
});
