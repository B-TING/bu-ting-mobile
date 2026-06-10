import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NaverMapPlaceholder } from '../../components/plan/map/NaverMapPlaceholder';
import { BackButton } from '../../components/shared/buttons/BackButton';
import {
  FESTIVAL_CALENDAR_COPY,
  festivalAddress,
  festivalDescription,
  festivalHours,
  festivalLocation,
  festivalPeriodLabel,
  festivalTitle,
  festivalToRouteItem,
  getFestivalById,
} from '../../constants/festivalCalendar';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore } from '../../stores';
import { cn } from '../../utils/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'FestivalDetail'>;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-muted">
        {label}
      </Text>
      <Text className="text-sm leading-5 text-brand-text">{value}</Text>
    </View>
  );
}

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

  const title = festivalTitle(festival, language);
  const location = festivalLocation(festival, language);
  const address = festivalAddress(festival, language);
  const period = festivalPeriodLabel(festival, language);
  const hours = festivalHours(festival, language);
  const description = festivalDescription(festival, language);

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
        <View className="h-52">
          <NaverMapPlaceholder
            title={copy.mapTitle}
            subtitle={copy.mapSubtitle}
            routes={mapRoutes}
            highlightItemId={festival.id}
            size="fill"
          />
        </View>

        <View className="px-4 pt-5">
          <View
            className={cn(
              'mb-3 self-start rounded-md px-2 py-0.5',
              festival.tag === 'FESTIVAL' ? 'bg-brand-primary' : 'bg-orange-500',
            )}>
            <Text className="text-[10px] font-bold text-white">{festival.tag}</Text>
          </View>

          <View className="mb-4 flex-row items-start gap-3">
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: festival.imageColor }}>
              <Text className="text-2xl">{festival.imageEmoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-brand-text">{title}</Text>
              <Text className="mt-1 text-sm text-brand-muted">{location}</Text>
            </View>
          </View>

          <InfoRow label={copy.locationLabel} value={address} />
          <InfoRow label={copy.periodLabel} value={period} />
          <InfoRow label={copy.hoursLabel} value={hours} />
          <InfoRow label={copy.descriptionLabel} value={description} />
        </View>
      </ScrollView>
    </View>
  );
}
