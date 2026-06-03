import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../components/plan/BackButton';
import { layout } from '../constants/layout';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuPlaceholder'>;

export function MenuPlaceholderScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const { title } = route.params;

  return (
    <View
      className="flex-1 bg-brand-background px-5"
      style={[layout.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <View className="mb-6 flex-row items-center">
        <BackButton
          onPress={() => navigation.goBack()}
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Go back'}
        />
      </View>

      <Text className="text-2xl font-bold text-brand-text">{title}</Text>
      <Text className="mt-4 text-base leading-relaxed text-brand-muted">
        {language === 'ko'
          ? '준비 중인 화면입니다.'
          : 'This screen is not available yet.'}
      </Text>
    </View>
  );
}
