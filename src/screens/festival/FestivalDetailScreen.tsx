import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FestivalCommentsPlaceholder } from '../../components/festival/FestivalCommentsPlaceholder';
import { FestivalDetailHero } from '../../components/festival/FestivalDetailHero';
import { NaverMapPlaceholder } from '../../components/plan/map/NaverMapPlaceholder';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  FESTIVAL_CALENDAR_COPY,
  festivalToRouteItem,
  getFestivalById,
} from '../../constants/festivalCalendar';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';

type Props = NativeStackScreenProps<RootStackParamList, 'FestivalDetail'>;

export function FestivalDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = FESTIVAL_CALENDAR_COPY[language];
  const festival = getFestivalById(route.params.festivalId);

  const mapRoutes = useMemo(
    () => (festival ? [festivalToRouteItem(festival, language)] : []),
    [festival, language],
  );

  if (!festival) {
    return (
      <View
        className="flex-1 items-center justify-center bg-brand-background px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Text className="text-brand-muted">{copy.notFound}</Text>
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {copy.detailTitle}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <FestivalDetailHero festival={festival} language={language} />

        <View className="h-44 border-t border-brand-border">
          <NaverMapPlaceholder
            title={copy.mapTitle}
            subtitle={copy.mapSubtitle}
            routes={mapRoutes}
            highlightItemId={festival.id}
            size="fill"
          />
        </View>

        <FestivalCommentsPlaceholder copy={copy} />
      </ScrollView>
    </View>
  );
}
