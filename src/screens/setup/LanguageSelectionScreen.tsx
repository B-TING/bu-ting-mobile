import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../components/shared/buttons/PrimaryButton';
import { BrandIcon } from '../../components/shared/brand/BrandIcon';
import { BrandLogo } from '../../components/shared/brand/BrandLogo';
import { LANGUAGE_OPTIONS } from '../../constants/setup/languages';
import { getCopyForLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';
import type { AppLanguage } from '../../types/user';
import { cn } from '../../utils/common/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

export function LanguageSelectionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setLanguage = useAppStore(state => state.setLanguage);
  const [selected, setSelected] = useState<AppLanguage | null>(null);
  const copy = getCopyForLanguage('setup', selected ?? 'ko');

  const onContinue = () => {
    if (!selected) {
      return;
    }
    setLanguage(selected);
    navigation.replace('Onboarding');
  };

  return (
    <View
      className="flex-1 bg-white px-6"
      style={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }}>
      <View className="mb-8">
        <View className="mb-3 flex-row items-center gap-2.5">
          <BrandIcon size={36} />
          <BrandLogo height={26} />
        </View>
        <Text className="mb-6 text-sm text-brand-muted">{copy.languageSlogan}</Text>
        <Text className="mb-2 text-[28px] font-bold text-brand-text">
          {copy.languageTitle}
        </Text>
        <Text className="text-[15px] leading-[22px] text-brand-muted">
          {copy.languageSubtitle}
        </Text>
      </View>

      <View className="flex-1 flex-row flex-wrap justify-between gap-y-3">
        {LANGUAGE_OPTIONS.map(option => {
          const isSelected = selected === option.code;
          return (
            <Pressable
              key={option.code}
              onPress={() => setSelected(option.code)}
              style={{ width: '48%' }}
              className={cn(
                'rounded-[20px] border border-brand-border bg-white px-4 py-5 active:opacity-90',
                isSelected && 'border-brand-primary bg-brand-selected',
              )}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}>
              <Text
                className={cn(
                  'mb-2 text-sm font-bold text-brand-primary',
                  !isSelected && 'text-brand-primary',
                )}>
                {option.shortCode}
              </Text>
              <Text
                className={cn(
                  'mb-1 text-lg font-bold text-brand-text',
                  isSelected && 'text-brand-primary',
                )}>
                {option.nativeLabel}
              </Text>
              <Text className="text-sm text-brand-muted">{option.hintLabel}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="pt-4">
        <PrimaryButton
          label={copy.continue}
          onPress={onContinue}
          disabled={!selected}
        />
      </View>
    </View>
  );
}
