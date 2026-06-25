import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TravelogueFeedItem } from '../../components/feed/TravelogueFeedItem';
import { ImportPlanModal } from '../../components/feed/modals/ImportPlanModal';
import { TravelogueCommentModal } from '../../components/feed/modals/TravelogueCommentModal';
import { useTravelogueSocialActions } from '../../components/feed/useTravelogueSocialActions';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { TRAVEL_REVIEW_COPY } from '../../constants/review/travelReview';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore, useTravelogueStore } from '../../stores';
import type { Travelogue } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';
import { isTraveloguePublic } from '../../utils/review/travelReview';

type Props = NativeStackScreenProps<RootStackParamList, 'TravelogueFeed'>;

type FeedRowProps = {
  travelogue: Travelogue;
  language: AppLanguage;
  navigation: Props['navigation'];
  onOpenComposer: (travelogue: Travelogue) => void;
};

function TravelogueFeedRow({
  travelogue,
  language,
  navigation,
  onOpenComposer,
}: FeedRowProps) {
  const copy = TRAVEL_REVIEW_COPY[language];
  const {
    social,
    userId,
    userName,
    handleToggleHelpful,
    handleImportPlan,
    importPlanModalProps,
  } = useTravelogueSocialActions(travelogue, copy, navigation);

  return (
    <>
      <TravelogueFeedItem
        travelogue={travelogue}
        copy={copy}
        language={language}
        social={social}
        userId={userId}
        userName={userName}
        onPressDetail={() =>
          navigation.navigate('TravelogueDetail', {
            travelogueId: travelogue.travelogueId,
          })
        }
        onToggleHelpful={handleToggleHelpful}
        onImportPlan={handleImportPlan}
        onOpenComposer={() => onOpenComposer(travelogue)}
      />
      <ImportPlanModal {...importPlanModalProps} />
    </>
  );
}

export function TravelogueFeedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';
  const auth = useAppStore(s => s.auth);
  const copy = TRAVEL_REVIEW_COPY[language];
  const publishedTravelogues = useTravelogueStore(s => s.publishedTravelogues);
  const addComment = useTravelogueStore(s => s.addComment);
  const travelogues = useMemo(
    () => publishedTravelogues.filter(isTraveloguePublic),
    [publishedTravelogues],
  );

  const [commentTarget, setCommentTarget] = useState<Travelogue | null>(null);

  const userId = auth.userId ?? 'local-user';
  const userName = auth.displayName ?? (language === 'ko' ? '여행자' : 'Traveler');

  const handleSubmitComment = (text: string) => {
    if (!commentTarget) {
      return;
    }
    addComment(commentTarget.travelogueId, {
      authorId: userId,
      authorName: userName,
      text,
    });
  };

  return (
    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text">{copy.feedTitle}</Text>
      </View>

      {travelogues.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface px-6 py-12">
            <Text className="text-4xl">📝</Text>
            <Text className="mt-3 text-base font-semibold text-brand-text">
              {copy.feedEmpty}
            </Text>
            <Text className="mt-2 text-center text-sm text-brand-muted">
              {copy.feedEmptySub}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={travelogues}
          keyExtractor={item => item.travelogueId}
          renderItem={({ item }) => (
            <TravelogueFeedRow
              travelogue={item}
              language={language}
              navigation={navigation}
              onOpenComposer={setCommentTarget}
            />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        />
      )}

      <TravelogueCommentModal
        visible={commentTarget != null}
        copy={copy}
        userName={userName}
        subtitle={commentTarget?.title}
        onClose={() => setCommentTarget(null)}
        onSubmit={handleSubmitComment}
      />
    </View>
  );
}
