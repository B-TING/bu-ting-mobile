import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TravelogueCard } from '../../components/feed/cards/TravelogueCard';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore, useTravelogueStore } from '../../stores';
import { isTraveloguePublic } from '../../utils/travelReview';

type Props = NativeStackScreenProps<RootStackParamList, 'TravelogueFeed'>;

export function TravelogueFeedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = TRAVEL_REVIEW_COPY[language];
  const publishedTravelogues = useTravelogueStore(s => s.publishedTravelogues);
  const travelogues = useMemo(
    () => publishedTravelogues.filter(isTraveloguePublic),
    [publishedTravelogues],
  );

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text">{copy.feedTitle}</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        {travelogues.length === 0 ? (
          <View className="items-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface px-6 py-12">
            <Text className="text-4xl">📝</Text>
            <Text className="mt-3 text-base font-semibold text-brand-text">
              {copy.feedEmpty}
            </Text>
            <Text className="mt-2 text-center text-sm text-brand-muted">
              {copy.feedEmptySub}
            </Text>
          </View>
        ) : (
          travelogues.map(travelogue => (
            <TravelogueCard
              key={travelogue.travelogueId}
              travelogue={travelogue}
              onPress={() =>
                navigation.navigate('TravelogueDetail', {
                  travelogueId: travelogue.travelogueId,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
