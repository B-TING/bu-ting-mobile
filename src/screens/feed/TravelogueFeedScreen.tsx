import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TravelogueFeedItem } from '../../components/feed/TravelogueFeedItem';
import { ImportPlanModal } from '../../components/feed/modals/ImportPlanModal';
import { TravelogueCommentModal } from '../../components/feed/modals/TravelogueCommentModal';
import { useTravelogueSocialActions } from '../../components/feed/useTravelogueSocialActions';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { useAppLanguage, useCopy } from '../../i18n';
import { ICON_COLOR_MUTED } from '../../constants/icons';
import type { RootStackParamList } from '../../navigation/types';
import { useAppStore, useTravelRecordStore } from '../../stores';
import type { TravelRecord } from '../../types/travelReview';
import type { AppLanguage } from '../../types/user';
import { isTravelRecordPublic } from '../../utils/review/travelReview';

type Props = {
  navigation: NavigationProp<RootStackParamList>;
  embeddedInMainTabs?: boolean;
};

type FeedRowProps = {
  travelRecord: TravelRecord;
  language: AppLanguage;
  navigation: NavigationProp<RootStackParamList>;
  onOpenComposer: (travelRecord: TravelRecord) => void;
};

function TravelogueFeedRow({
  travelRecord,
  language,
  navigation,
  onOpenComposer,
}: FeedRowProps) {
  const copy = useCopy('travelReview');
  const {
    social,
    userId,
    userName,
    handleToggleLike,
    handleImportPlan,
    importModalProps,
  } = useTravelogueSocialActions(travelRecord, copy, navigation);

  return (
    <>
      <TravelogueFeedItem
        travelRecord={travelRecord}
        copy={copy}
        language={language}
        social={social}
        userId={userId}
        userName={userName}
        onPressDetail={() =>
          navigation.navigate('TravelRecordDetail', {
            travelRecordId: travelRecord.travelRecordId,
          })
        }
        onToggleLike={handleToggleLike}
        onImportPlan={handleImportPlan}
        onOpenComposer={() => onOpenComposer(travelRecord)}
      />
      <ImportPlanModal {...importModalProps} />
    </>
  );
}

export function TravelogueFeedScreen({ navigation, embeddedInMainTabs = false }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const auth = useAppStore(s => s.auth);
  const copy = useCopy('travelReview');
  const publishedTravelRecords = useTravelRecordStore(s => s.publishedTravelRecords);
  const addComment = useTravelRecordStore(s => s.addComment);
  const travelRecords = useMemo(
    () => publishedTravelRecords.filter(isTravelRecordPublic),
    [publishedTravelRecords],
  );
  const bottomPadding = embeddedInMainTabs ? 16 : insets.bottom + 16;

  const [commentTarget, setCommentTarget] = useState<TravelRecord | null>(null);

  const userId = auth.userId ?? 'local-user';
  const userName = auth.displayName ?? (language === 'ko' ? '여행자' : 'Traveler');

  const handleSubmitComment = (text: string) => {
    if (!commentTarget) {
      return;
    }
    addComment(commentTarget.travelRecordId, {
      authorId: userId,
      authorNickname: userName,
      content: text,
    });
  };

  return (
    <View className="flex-1 bg-brand-background">
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        {!embeddedInMainTabs ? (
          <BackButton
            accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
            onPress={() => navigation.goBack()}
          />
        ) : null}
        <Text className="flex-1 text-lg font-bold text-brand-text">{copy.feedTitle}</Text>
      </View>

      {travelRecords.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6" style={{ paddingBottom: bottomPadding }}>
          <View className="items-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface px-6 py-12">
            <AppIcon name="fileText" size={40} color={ICON_COLOR_MUTED} />
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
          data={travelRecords}
          keyExtractor={item => item.travelRecordId}
          renderItem={({ item }) => (
            <TravelogueFeedRow
              travelRecord={item}
              language={language}
              navigation={navigation}
              onOpenComposer={setCommentTarget}
            />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
        />
      )}

      <TravelogueCommentModal
        visible={commentTarget != null}
        copy={copy}
        userName={userName}
        subtitle={commentTarget?.title ?? undefined}
        onClose={() => setCommentTarget(null)}
        onSubmit={handleSubmitComment}
      />
    </View>
  );
}
