import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TravelogueFeedItem } from '../../components/feed/TravelogueFeedItem';
import { ImportPlanModal } from '../../components/feed/modals/ImportPlanModal';
import { TravelogueCommentModal } from '../../components/feed/modals/TravelogueCommentModal';
import {
  TravelogueSocialError,
  useTravelogueSocialActions,
} from '../../components/feed/useTravelogueSocialActions';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { AppIcon } from '../../components/shared/icons/AppIcon';
import { useAppAlert } from '../../components/shared/modals';
import { getNavbarOverlayHeight } from '../../components/shared/navigation/Navbar';
import { useAppLanguage, useCopy } from '../../i18n';
import { ICON_COLOR_MUTED, ICON_COLOR_PRIMARY } from '../../constants/icons';
import type { RootStackParamList } from '../../navigation/types';
import { fetchTravelRecordFeed } from '../../services/travel/travelRecordService';
import { mapTravelRecordFeedItem } from '../../types/travelRecordApi';
import { useAuthStore } from '../../stores';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import type { TravelRecord, TravelRecordComment } from '../../types/travelReview';
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
  onPatchRecord: (travelRecordId: string, patch: Partial<TravelRecord>) => void;
};

function TravelogueFeedRow({
  travelRecord,
  language,
  navigation,
  onPatchRecord,
}: FeedRowProps) {
  const { alert } = useAppAlert();
  const copy = useCopy('travelReview');
  const [commentOpen, setCommentOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<TravelRecordComment | null>(
    null,
  );
  const {
    social,
    userId,
    userName,
    commenting,
    handleToggleLike,
    handleToggleBookmark,
    bookmarkedByMe,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleImportPlan,
    importModalProps,
  } = useTravelogueSocialActions(travelRecord, copy, navigation, {
    onTravelRecordPatch: patch => {
      onPatchRecord(travelRecord.travelRecordId, patch);
    },
  });

  const onToggleBookmark = () => {
    void handleToggleBookmark().catch(error => {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : copy.socialBookmarkFailed,
      });
    });
  };

  const onToggleLike = () => {
    void handleToggleLike().catch(error => {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : copy.socialLikeFailed,
      });
    });
  };

  const onSubmitComment = async (text: string) => {
    try {
      if (editingComment) {
        await handleUpdateComment(editingComment.commentId, text);
      } else {
        await handleAddComment(text);
      }
    } catch (error) {
      alert({
        title:
          error instanceof TravelogueSocialError
            ? error.message
            : editingComment
              ? copy.socialCommentUpdateFailed
              : copy.socialCommentFailed,
      });
      throw error;
    }
  };

  const onDeleteComment = (comment: TravelRecordComment) => {
    alert({
      title: copy.feedDeleteCommentConfirmTitle,
      message: copy.feedDeleteCommentConfirmMessage,
      buttons: [
        { label: copy.cancel, variant: 'secondary', onPress: () => undefined },
        {
          label: copy.feedDeleteComment,
          variant: 'danger',
          onPress: () => {
            void handleDeleteComment(comment.commentId).catch(error => {
              alert({
                title:
                  error instanceof TravelogueSocialError
                    ? error.message
                    : copy.socialCommentDeleteFailed,
              });
            });
          },
        },
      ],
    });
  };

  const closeCommentModal = () => {
    setCommentOpen(false);
    setEditingComment(null);
  };

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
        onToggleLike={onToggleLike}
        onToggleBookmark={onToggleBookmark}
        bookmarkedByMe={bookmarkedByMe}
        onImportPlan={handleImportPlan}
        onOpenComposer={() => {
          setEditingComment(null);
          setCommentOpen(true);
        }}
        onEditComment={comment => {
          setEditingComment(comment);
          setCommentOpen(true);
        }}
        onDeleteComment={onDeleteComment}
      />
      <ImportPlanModal {...importModalProps} />
      <TravelogueCommentModal
        visible={commentOpen}
        copy={copy}
        userName={userName}
        subtitle={travelRecord.title ?? undefined}
        mode={editingComment ? 'edit' : 'create'}
        initialContent={editingComment?.content ?? ''}
        submitting={commenting}
        onClose={closeCommentModal}
        onSubmit={onSubmitComment}
      />
    </>
  );
}

export function TravelogueFeedScreen({ navigation, embeddedInMainTabs = false }: Props) {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const accessToken = useAuthStore(selectReusableAccessToken);
  const copy = useCopy('travelReview');

  const [travelRecords, setTravelRecords] = useState<TravelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bottomPadding = embeddedInMainTabs
    ? getNavbarOverlayHeight(insets.bottom) + 16
    : insets.bottom + 16;

  const loadFeed = useCallback(async () => {
    const page = await fetchTravelRecordFeed(
      { size: 20, sort: 'LATEST' },
      accessToken,
    );
    const mapped = (page.items ?? [])
      .map(mapTravelRecordFeedItem)
      .filter(isTravelRecordPublic);
    setTravelRecords(mapped);
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadFeed()
      .catch(error => {
        if (__DEV__) {
          console.warn('[TravelogueFeed] fetch failed', error);
        }
        if (!cancelled) {
          setTravelRecords([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFeed();
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed]);

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

      {loading && travelRecords.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ICON_COLOR_PRIMARY} />
        </View>
      ) : travelRecords.length === 0 ? (
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ paddingBottom: bottomPadding }}>
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
              onPatchRecord={(id, patch) => {
                setTravelRecords(prev =>
                  prev.map(r => (r.travelRecordId === id ? { ...r, ...patch } : r)),
                );
              }}
            />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void onRefresh();
              }}
              tintColor={ICON_COLOR_PRIMARY}
            />
          }
        />
      )}
    </View>
  );
}
