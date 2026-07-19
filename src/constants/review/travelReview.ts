import type { AppLanguage } from '../../types/user';

export const REVIEW_TAG_PRESETS: Record<AppLanguage, string[]> = {
  ko: ['맛집', '뷰맛집', '사진스팟', '힐링', '가족', '데이트', '재방문', '추천'],
  en: ['food', 'view', 'photo spot', 'relaxing', 'family', 'date', 'revisit', 'recommend'],
  ja: ['グルメ', '絶景', '写真スポット', '癒し', '家族', 'デート', '再訪', 'おすすめ'],
  zh: ['美食', '风景', '拍照', '放松', '家庭', '约会', '再访', '推荐'],
};

/** @deprecated Use useCopy('travelReview') from src/i18n */
export const TRAVEL_REVIEW_COPY: Record<
  AppLanguage,
  {
    writeReview: string;
    editReview: string;
    deleteReview: string;
    deleteReviewConfirmTitle: string;
    deleteReviewConfirmMessage: string;
    deleteReviewConfirm: string;
    reviewTitle: string;
    placeLabel: string;
    ratingLabel: string;
    tagsLabel: string;
    tagPlaceholder: string;
    commentLabel: string;
    commentPlaceholder: string;
    mediaLabel: string;
    addPhoto: string;
    addVideo: string;
    save: string;
    cancel: string;
    recordsTitle: string;
    recordsSub: string;
    progress: (done: number, total: number) => string;
    noReviewsYet: string;
    allReviewsDone: string;
    composeTravelogue: string;
    editTravelogue: string;
    composeTitle: string;
    composeSub: string;
    editTravelogueTitle: string;
    editTravelogueSub: string;
    travelogueTitle: string;
    travelogueTitlePlaceholder: string;
    overallRating: string;
    overallReview: string;
    overallReviewPlaceholder: string;
    authorLabel: string;
    visibilityLabel: string;
    visibilityPublic: string;
    visibilityPrivate: string;
    visibilityPublicHint: string;
    visibilityPrivateHint: string;
    publish: string;
    saveTravelogue: string;
    published: string;
    publishedPublic: string;
    publishedPrivate: string;
    viewFeed: string;
    viewMyTravelogue: string;
    publishedSuccessPublic: string;
    publishedSuccessPrivate: string;
    updatedSuccessPublic: string;
    updatedSuccessPrivate: string;
    feedTitle: string;
    feedEmpty: string;
    feedEmptySub: string;
    placeReviewsSection: string;
    stars: (n: number) => string;
    visitFirst: string;
    mediaMockHint: string;
    publishedSuccess: string;
    completeTrip: string;
    completeTripConfirmTitle: string;
    completeTripConfirmMessage: string;
    completeTripConfirm: string;
    composePartialHint: string;
    detailBy: (name: string) => string;
    overallSummary: string;
    itinerarySection: string;
    tripEndedSuccess: string;
    noReviewForPlace: string;
    dayLabel: (n: number) => string;
    visitedBadge: string;
    notVisitedBadge: string;
    mapTitle: string;
    mapSubtitle: string;
    tripPeriod: (start: string, end: string) => string;
    totalDuration: (duration: string) => string;
    helpfulLabel: string;
    helpfulCount: (n: number) => string;
    importPlan: string;
    importPlanConfirmTitle: string;
    importPlanConfirmMessage: (title: string) => string;
    importPlanSuccess: string;
    importPlanSuccessSub: string;
    importPlanGo: string;
    importPlanClose: string;
    importPlanNoItinerary: string;
    tripPeriodLabel: string;
    importPlanActivePlanTitle: string;
    importPlanActivePlanMessage: (title: string) => string;
    importPlanActivePlanConfirm: string;
    activePlanLabel: string;
    feedCommentsTitle: string;
    feedCommentPlaceholder: string;
    feedCommentsEmpty: string;
    feedAddComment: string;
    feedViewAllComments: (n: number) => string;
    viewDetail: string;
    feedTapHint: string;
    socialLoginRequired: string;
    socialLikeFailed: string;
    socialCommentFailed: string;
  }
> = {
  ko: {
    writeReview: '후기 남기기',
    editReview: '후기 수정',
    deleteReview: '후기 삭제',
    deleteReviewConfirmTitle: '후기 삭제',
    deleteReviewConfirmMessage:
      '이 장소 후기를 삭제할까요? 일정에서 장소 자체는 유지됩니다.',
    deleteReviewConfirm: '삭제',
    reviewTitle: '여행지 후기',
    placeLabel: '장소',
    ratingLabel: '평점',
    tagsLabel: '태그',
    tagPlaceholder: '태그 입력 후 추가',
    commentLabel: '코멘트',
    commentPlaceholder: '이곳에서의 경험을 남겨 주세요',
    mediaLabel: '사진 / 영상',
    addPhoto: '사진 추가',
    addVideo: '영상 추가',
    save: '저장',
    cancel: '취소',
    recordsTitle: '여행 후기',
    recordsSub: '방문한 여행지마다 후기를 남기고, 원할 때 여행기를 게시할 수 있어요.',
    progress: (done, total) => `${done} / ${total}곳 후기 완료`,
    noReviewsYet: '아직 작성한 후기가 없어요',
    allReviewsDone: '모든 여행지 후기가 완료됐어요!',
    composeTravelogue: '여행기 작성하기',
    editTravelogue: '여행기 수정',
    composeTitle: '여행기 작성',
    composeSub: '작성한 후기를 바탕으로 여행기를 완성해 보세요. 후기가 없어도 등록할 수 있어요.',
    editTravelogueTitle: '여행기 수정',
    editTravelogueSub: '제목·본문과 공개 여부를 수정할 수 있어요.',
    travelogueTitle: '제목',
    travelogueTitlePlaceholder: '예: 부산 3박 4일 맛집 투어',
    overallRating: '종합 평점',
    overallReview: '종합 후기',
    overallReviewPlaceholder: '이번 여행을 한 줄로 요약해 주세요',
    authorLabel: '작성자',
    visibilityLabel: '공개 여부',
    visibilityPublic: '공개',
    visibilityPrivate: '비공개',
    visibilityPublicHint: '다른 여행자들이 피드에서 볼 수 있어요',
    visibilityPrivateHint: '나만 볼 수 있어요. 피드에는 표시되지 않아요',
    publish: '게시하기',
    saveTravelogue: '저장하기',
    published: '게시됨',
    publishedPublic: '공개',
    publishedPrivate: '비공개',
    viewFeed: '여행기 둘러보기',
    viewMyTravelogue: '내 여행기 보기',
    publishedSuccessPublic: '여행기가 공개 게시됐어요!',
    publishedSuccessPrivate: '여행기가 비공개로 저장됐어요!',
    updatedSuccessPublic: '여행기가 수정됐어요!',
    updatedSuccessPrivate: '여행기가 비공개로 저장됐어요!',
    feedTitle: '여행기',
    feedEmpty: '아직 게시된 여행기가 없어요',
    feedEmptySub: '공개로 게시된 여행기가 여기에 표시됩니다.',
    placeReviewsSection: '장소별 후기',
    stars: n => `${n}점`,
    visitFirst: '방문 체크 후 후기를 남길 수 있어요',
    mediaMockHint: '실제 업로드는 API 연동 후 제공됩니다',
    publishedSuccess: '여행기가 게시됐어요!',
    completeTrip: '여행 완료 처리',
    completeTripConfirmTitle: '여행 완료 처리',
    completeTripConfirmMessage:
      '이 여행을 완료 처리할까요? 완료 후에는 활성 여행에서 제외됩니다.',
    completeTripConfirm: '완료 처리',
    composePartialHint: '후기를 모두 작성하지 않아도 여행기를 등록할 수 있어요',
    detailBy: name => `${name}님의 여행기`,
    overallSummary: '종합 후기',
    itinerarySection: '방문 순서',
    tripEndedSuccess: '여행이 종료됐어요. 새 여행을 시작해 보세요!',
    noReviewForPlace: '후기 없음',
    dayLabel: n => `Day ${n}`,
    visitedBadge: '방문',
    notVisitedBadge: '미방문',
    mapTitle: '여행 경로',
    mapSubtitle: '장소를 탭하면 지도가 해당 위치로 이동해요',
    tripPeriod: (start, end) => `${start} ~ ${end}`,
    totalDuration: d => `총 소요시간 ${d}`,
    helpfulLabel: '도움이 되었어요!',
    helpfulCount: n => `${n}명`,
    importPlan: '여행 계획 가져오기',
    importPlanConfirmTitle: '여행 계획 가져오기',
    importPlanConfirmMessage: title =>
      `"${title}" 일정을 내 여행 계획으로 추가할까요?`,
    importPlanSuccess: '여행 계획을 가져왔어요!',
    importPlanSuccessSub: '내 여행 계획 목록에 추가됐어요. 바로 확인해 보세요.',
    importPlanGo: '계획 보기',
    importPlanClose: '확인',
    importPlanNoItinerary: '가져올 수 있는 일정 정보가 없어요.',
    tripPeriodLabel: '기간',
    importPlanActivePlanTitle: '진행 중인 여행이 있어요',
    importPlanActivePlanMessage: title =>
      `현재 "${title}" 여행이 진행 중이에요. 새 계획을 가져오면 해당 계획이 활성 여행이 됩니다. 계속할까요?`,
    importPlanActivePlanConfirm: '그래도 가져오기',
    activePlanLabel: '진행 중인 계획',
    feedCommentsTitle: '댓글',
    feedCommentPlaceholder: '응원의 댓글을 남겨보세요',
    feedCommentsEmpty: '아직 댓글이 없어요. 첫 댓글을 남겨보세요!',
    feedAddComment: '등록',
    feedViewAllComments: n => `댓글 ${n}개 모두 보기`,
    viewDetail: '자세히 보기',
    feedTapHint: '탭하면 상세 여행기를 볼 수 있어요',
    socialLoginRequired: '로그인이 필요해요.',
    socialLikeFailed: '좋아요 처리에 실패했어요.',
    socialCommentFailed: '댓글 등록에 실패했어요.',
  },
  en: {
    writeReview: 'Write review',
    editReview: 'Edit review',
    deleteReview: 'Delete review',
    deleteReviewConfirmTitle: 'Delete review',
    deleteReviewConfirmMessage:
      'Delete this place review? The place stays on your itinerary.',
    deleteReviewConfirm: 'Delete',
    reviewTitle: 'Place review',
    placeLabel: 'Place',
    ratingLabel: 'Rating',
    tagsLabel: 'Tags',
    tagPlaceholder: 'Type a tag and add',
    commentLabel: 'Comment',
    commentPlaceholder: 'Share your experience here',
    mediaLabel: 'Photos / videos',
    addPhoto: 'Add photo',
    addVideo: 'Add video',
    save: 'Save',
    cancel: 'Cancel',
    recordsTitle: 'Trip reviews',
    recordsSub: 'Review each stop and publish a travelogue whenever you are ready.',
    progress: (done, total) => `${done} / ${total} reviews done`,
    noReviewsYet: 'No reviews yet',
    allReviewsDone: 'All place reviews are complete!',
    composeTravelogue: 'Create travelogue',
    editTravelogue: 'Edit travelogue',
    composeTitle: 'Compose travelogue',
    composeSub: 'Complete your travelogue from the reviews you wrote. You can publish without any reviews.',
    editTravelogueTitle: 'Edit travelogue',
    editTravelogueSub: 'Update the title, summary, and visibility.',
    travelogueTitle: 'Title',
    travelogueTitlePlaceholder: 'e.g. 4-day Busan food tour',
    overallRating: 'Overall rating',
    overallReview: 'Overall review',
    overallReviewPlaceholder: 'Summarize this trip in a few sentences',
    authorLabel: 'Author',
    visibilityLabel: 'Visibility',
    visibilityPublic: 'Public',
    visibilityPrivate: 'Private',
    visibilityPublicHint: 'Visible to other travelers in the feed',
    visibilityPrivateHint: 'Only you can see this. It won\'t appear in the feed',
    publish: 'Publish',
    saveTravelogue: 'Save',
    published: 'Published',
    publishedPublic: 'Public',
    publishedPrivate: 'Private',
    viewFeed: 'Browse travelogues',
    viewMyTravelogue: 'View my travelogue',
    publishedSuccessPublic: 'Travelogue published publicly!',
    publishedSuccessPrivate: 'Travelogue saved privately!',
    updatedSuccessPublic: 'Travelogue updated!',
    updatedSuccessPrivate: 'Travelogue saved privately!',
    feedTitle: 'Travelogues',
    feedEmpty: 'No travelogues yet',
    feedEmptySub: 'Public travelogues from other travelers will appear here.',
    placeReviewsSection: 'Place reviews',
    stars: n => `${n} stars`,
    visitFirst: 'Mark visited before writing a review',
    mediaMockHint: 'Real uploads will arrive with API integration',
    publishedSuccess: 'Travelogue published!',
    completeTrip: 'Mark trip complete',
    completeTripConfirmTitle: 'Mark trip complete',
    completeTripConfirmMessage:
      'Mark this trip as complete? It will no longer appear as your active trip.',
    completeTripConfirm: 'Complete',
    composePartialHint: 'You can publish a travelogue without completing every review',
    detailBy: name => `Travelogue by ${name}`,
    overallSummary: 'Overall review',
    itinerarySection: 'Visit order',
    tripEndedSuccess: 'Trip ended. Start a new journey!',
    noReviewForPlace: 'No review',
    dayLabel: n => `Day ${n}`,
    visitedBadge: 'Visited',
    notVisitedBadge: 'Not visited',
    mapTitle: 'Trip route',
    mapSubtitle: 'Tap a place to focus the map',
    tripPeriod: (start, end) => `${start} – ${end}`,
    totalDuration: d => `Total time ${d}`,
    helpfulLabel: 'Helpful!',
    helpfulCount: n => `${n}`,
    importPlan: 'Import trip plan',
    importPlanConfirmTitle: 'Import trip plan',
    importPlanConfirmMessage: title =>
      `Add the itinerary from "${title}" to your plans?`,
    importPlanSuccess: 'Trip plan imported!',
    importPlanSuccessSub: 'It has been added to your plans. Take a look anytime.',
    importPlanGo: 'View plan',
    importPlanClose: 'OK',
    importPlanNoItinerary: 'There is no itinerary available to import.',
    tripPeriodLabel: 'Dates',
    importPlanActivePlanTitle: 'You have a trip in progress',
    importPlanActivePlanMessage: title =>
      `"${title}" is currently active. Importing a new plan will switch your active trip. Continue?`,
    importPlanActivePlanConfirm: 'Import anyway',
    activePlanLabel: 'Active plan',
    feedCommentsTitle: 'Comments',
    feedCommentPlaceholder: 'Leave an encouraging comment',
    feedCommentsEmpty: 'No comments yet. Be the first!',
    feedAddComment: 'Post',
    feedViewAllComments: n => `View all ${n} comments`,
    viewDetail: 'View details',
    feedTapHint: 'Tap to open the full travelogue',
    socialLoginRequired: 'Please sign in to continue.',
    socialLikeFailed: 'Could not update like.',
    socialCommentFailed: 'Could not post comment.',
  },
  ja: {
    writeReview: 'レビューを書く',
    editReview: 'レビューを編集',
    deleteReview: 'レビューを削除',
    deleteReviewConfirmTitle: 'レビューを削除',
    deleteReviewConfirmMessage:
      'このスポットのレビューを削除しますか？日程の場所自体は残ります。',
    deleteReviewConfirm: '削除',
    reviewTitle: 'スポットレビュー',
    placeLabel: '場所',
    ratingLabel: '評価',
    tagsLabel: 'タグ',
    tagPlaceholder: 'タグを入力して追加',
    commentLabel: 'コメント',
    commentPlaceholder: 'ここでの体験を書いてください',
    mediaLabel: '写真 / 動画',
    addPhoto: '写真を追加',
    addVideo: '動画を追加',
    save: '保存',
    cancel: 'キャンセル',
    recordsTitle: '旅行レビュー',
    recordsSub: '訪問した各スポットにレビューを書き、好きなタイミングで旅行記を公開できます。',
    progress: (done, total) => `${done} / ${total} 件完了`,
    noReviewsYet: 'まだレビューがありません',
    allReviewsDone: 'すべてのレビューが完了しました！',
    composeTravelogue: '旅行記を作成',
    editTravelogue: '旅行記を編集',
    composeTitle: '旅行記を作成',
    composeSub: '書いたレビューをもとに旅行記を完成させましょう。レビューがなくても登録できます。',
    editTravelogueTitle: '旅行記を編集',
    editTravelogueSub: 'タイトル・本文・公開設定を変更できます。',
    travelogueTitle: 'タイトル',
    travelogueTitlePlaceholder: '例：釜山3泊4日グルメ旅',
    overallRating: '総合評価',
    overallReview: '総合レビュー',
    overallReviewPlaceholder: '今回の旅行をまとめてください',
    authorLabel: '投稿者',
    visibilityLabel: '公開設定',
    visibilityPublic: '公開',
    visibilityPrivate: '非公開',
    visibilityPublicHint: '他の旅行者がフィードで閲覧できます',
    visibilityPrivateHint: '自分だけが閲覧できます。フィードには表示されません',
    publish: '公開する',
    saveTravelogue: '保存する',
    published: '公開済み',
    publishedPublic: '公開',
    publishedPrivate: '非公開',
    viewFeed: '旅行記を見る',
    viewMyTravelogue: '自分の旅行記を見る',
    publishedSuccessPublic: '旅行記を公開しました！',
    publishedSuccessPrivate: '旅行記を非公開で保存しました！',
    updatedSuccessPublic: '旅行記を更新しました！',
    updatedSuccessPrivate: '旅行記を非公開で保存しました！',
    feedTitle: '旅行記',
    feedEmpty: 'まだ公開された旅行記がありません',
    feedEmptySub: '公開された旅行記がここに表示されます。',
    placeReviewsSection: 'スポット別レビュー',
    stars: n => `${n}点`,
    visitFirst: '訪問チェック後にレビューを書けます',
    mediaMockHint: '実際のアップロードはAPI連携後に提供されます',
    publishedSuccess: '旅行記を公開しました！',
    completeTrip: '旅行完了にする',
    completeTripConfirmTitle: '旅行完了',
    completeTripConfirmMessage:
      'この旅行を完了にしますか？完了後はアクティブな旅行から外れます。',
    completeTripConfirm: '完了にする',
    composePartialHint: 'すべてのレビューがなくても旅行記を登録できます',
    detailBy: name => `${name}さんの旅行記`,
    overallSummary: '総合レビュー',
    itinerarySection: '訪問順',
    tripEndedSuccess: '旅行が終了しました。新しい旅を始めましょう！',
    noReviewForPlace: 'レビューなし',
    dayLabel: n => `Day ${n}`,
    visitedBadge: '訪問済み',
    notVisitedBadge: '未訪問',
    mapTitle: '旅行ルート',
    mapSubtitle: '場所をタップすると地図がその位置に移動します',
    tripPeriod: (start, end) => `${start} 〜 ${end}`,
    totalDuration: d => `総所要時間 ${d}`,
    helpfulLabel: '参考になった！',
    helpfulCount: n => `${n}人`,
    importPlan: '旅行プランを取り込む',
    importPlanConfirmTitle: '旅行プランを取り込む',
    importPlanConfirmMessage: title =>
      `「${title}」の日程を自分の旅行プランに追加しますか？`,
    importPlanSuccess: '旅行プランを取り込みました！',
    importPlanSuccessSub: 'マイ旅行プランに追加されました。すぐに確認できます。',
    importPlanGo: 'プランを見る',
    importPlanClose: '確認',
    importPlanNoItinerary: '取り込める日程情報がありません。',
    tripPeriodLabel: '期間',
    importPlanActivePlanTitle: '進行中の旅行があります',
    importPlanActivePlanMessage: title =>
      `現在「${title}」が進行中です。新しいプランを取り込むと、アクティブな旅行が切り替わります。続けますか？`,
    importPlanActivePlanConfirm: 'それでも取り込む',
    activePlanLabel: '進行中のプラン',
    feedCommentsTitle: 'コメント',
    feedCommentPlaceholder: '応援コメントを書いてみましょう',
    feedCommentsEmpty: 'まだコメントがありません。最初のコメントをどうぞ！',
    feedAddComment: '投稿',
    feedViewAllComments: n => `コメント${n}件をすべて見る`,
    viewDetail: '詳細を見る',
    feedTapHint: 'タップで旅行記の詳細を表示',
    socialLoginRequired: 'ログインが必要です。',
    socialLikeFailed: 'いいねに失敗しました。',
    socialCommentFailed: 'コメント投稿に失敗しました。',
  },
  zh: {
    writeReview: '写点评',
    editReview: '编辑点评',
    deleteReview: '删除点评',
    deleteReviewConfirmTitle: '删除点评',
    deleteReviewConfirmMessage: '要删除此地点评吗？行程中的地点会保留。',
    deleteReviewConfirm: '删除',
    reviewTitle: '地点点评',
    placeLabel: '地点',
    ratingLabel: '评分',
    tagsLabel: '标签',
    tagPlaceholder: '输入标签后添加',
    commentLabel: '评论',
    commentPlaceholder: '分享您在此的体验',
    mediaLabel: '照片 / 视频',
    addPhoto: '添加照片',
    addVideo: '添加视频',
    save: '保存',
    cancel: '取消',
    recordsTitle: '旅行点评',
    recordsSub: '为每个到访地点写点评，随时可发布游记。',
    progress: (done, total) => `已完成 ${done} / ${total}`,
    noReviewsYet: '暂无点评',
    allReviewsDone: '所有地点点评已完成！',
    composeTravelogue: '撰写游记',
    editTravelogue: '编辑游记',
    composeTitle: '撰写游记',
    composeSub: '根据已写点评完成游记。没有点评也可以发布。',
    editTravelogueTitle: '编辑游记',
    editTravelogueSub: '可修改标题、正文与公开设置。',
    travelogueTitle: '标题',
    travelogueTitlePlaceholder: '例：釜山四天美食之旅',
    overallRating: '综合评分',
    overallReview: '综合点评',
    overallReviewPlaceholder: '用几句话总结这次旅行',
    authorLabel: '作者',
    visibilityLabel: '公开设置',
    visibilityPublic: '公开',
    visibilityPrivate: '私密',
    visibilityPublicHint: '其他旅行者可在动态中看到',
    visibilityPrivateHint: '仅自己可见，不会出现在动态中',
    publish: '发布',
    saveTravelogue: '保存',
    published: '已发布',
    publishedPublic: '公开',
    publishedPrivate: '私密',
    viewFeed: '浏览游记',
    viewMyTravelogue: '查看我的游记',
    publishedSuccessPublic: '游记已公开发布！',
    publishedSuccessPrivate: '游记已私密保存！',
    updatedSuccessPublic: '游记已更新！',
    updatedSuccessPrivate: '游记已私密保存！',
    feedTitle: '游记',
    feedEmpty: '暂无已发布游记',
    feedEmptySub: '公开发布的游记会显示在这里。',
    placeReviewsSection: '各地点评',
    stars: n => `${n}分`,
    visitFirst: '标记到访后可写点评',
    mediaMockHint: '实际上传将在 API 接入后提供',
    publishedSuccess: '游记已发布！',
    completeTrip: '标记行程完成',
    completeTripConfirmTitle: '标记行程完成',
    completeTripConfirmMessage: '要将此行程标记为已完成吗？完成后将不再显示为进行中的行程。',
    completeTripConfirm: '完成',
    composePartialHint: '无需完成全部点评即可发布游记',
    detailBy: name => `${name}的游记`,
    overallSummary: '综合点评',
    itinerarySection: '访问顺序',
    tripEndedSuccess: '行程已结束，开始新的旅行吧！',
    noReviewForPlace: '无点评',
    dayLabel: n => `第 ${n} 天`,
    visitedBadge: '已到访',
    notVisitedBadge: '未到访',
    mapTitle: '行程路线',
    mapSubtitle: '点击地点，地图将移动到该位置',
    tripPeriod: (start, end) => `${start} ~ ${end}`,
    totalDuration: d => `总耗时 ${d}`,
    helpfulLabel: '有帮助！',
    helpfulCount: n => `${n}人`,
    importPlan: '导入旅行计划',
    importPlanConfirmTitle: '导入旅行计划',
    importPlanConfirmMessage: title => `将「${title}」的行程添加到我的旅行计划？`,
    importPlanSuccess: '已导入旅行计划！',
    importPlanSuccessSub: '已添加到你的旅行计划，可随时查看。',
    importPlanGo: '查看计划',
    importPlanClose: '确认',
    importPlanNoItinerary: '没有可导入的行程信息。',
    tripPeriodLabel: '日期',
    importPlanActivePlanTitle: '你有进行中的旅行',
    importPlanActivePlanMessage: title =>
      `当前「${title}」正在进行。导入新计划后，活跃旅行将切换为新计划。是否继续？`,
    importPlanActivePlanConfirm: '仍然导入',
    activePlanLabel: '进行中的计划',
    feedCommentsTitle: '评论',
    feedCommentPlaceholder: '留下鼓励的评论吧',
    feedCommentsEmpty: '暂无评论，来发表第一条吧！',
    feedAddComment: '发布',
    feedViewAllComments: n => `查看全部 ${n} 条评论`,
    viewDetail: '查看详情',
    feedTapHint: '点击查看完整游记',
    socialLoginRequired: '请先登录。',
    socialLikeFailed: '点赞失败。',
    socialCommentFailed: '评论发布失败。',
  },
};
