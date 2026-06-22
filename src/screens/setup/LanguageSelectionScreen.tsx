import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
import { layout } from '../../constants/layout';
import { LANGUAGE_OPTIONS } from '../../constants/languages';
import { SETUP_COPY } from '../../constants/onboarding';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

export function LanguageSelectionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setLanguage = useAppStore(state => state.setLanguage);
  const [selected, setSelected] = useState<AppLanguage | null>(null);
  const copy = selected ? SETUP_COPY[selected] : SETUP_COPY.en;

  const onContinue = () => {
    if (!selected) {
      return;
    }
    setLanguage(selected);
    navigation.replace('Onboarding');
  };

  return (
    <View
      className="flex-1 bg-brand-background px-6"
      style={[layout.screenPad24, { paddingTop: insets.top + 24 }]}>
      <View className="mb-6">
        <BrandLogo height={32} style={{ marginBottom: 20 }} />
        <Text className="mb-2 text-[28px] font-bold text-brand-text">
          {selected ? copy.languageTitle : 'Choose your language / 언어 선택'}
        </Text>
        <Text className="text-[15px] leading-[22px] text-brand-muted">
          {selected ? copy.languageSubtitle : 'Select a language to continue'}
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {LANGUAGE_OPTIONS.map(option => {
          const isSelected = selected === option.code;
          return (
            <Pressable
              key={option.code}
              onPress={() => setSelected(option.code)}
              className={cn(
                'mb-3 rounded-2xl border-2 border-brand-border bg-brand-surface px-5 py-[18px] active:opacity-90',
                isSelected && 'border-brand-primary bg-brand-selected',
              )}>
              <Text
                className={cn(
                  'mb-0.5 text-xl font-semibold text-brand-text',
                  isSelected && 'text-brand-primary',
                )}>
                {option.nativeLabel}
              </Text>
              <Text
                className={cn(
                  'text-sm text-brand-muted',
                  isSelected && 'text-brand-primary opacity-80',
                )}>
                {option.englishLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="pt-3" style={{ paddingBottom: insets.bottom + 20 }}>
        <PrimaryButton
          label={selected ? copy.continue : 'Continue / 계속'}
          onPress={onContinue}
          disabled={!selected}
        />
      </View>
    </View>
  );
}
