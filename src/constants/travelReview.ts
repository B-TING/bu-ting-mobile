import type { AppLanguage } from '../types/user';

export const REVIEW_TAG_PRESETS: Record<AppLanguage, string[]> = {
  ko: ['맛집', '뷰맛집', '사진스팟', '힐링', '가족', '데이트', '재방문', '추천'],
  en: ['food', 'view', 'photo spot', 'relaxing', 'family', 'date', 'revisit', 'recommend'],
  ja: ['グルメ', '絶景', '写真スポット', '癒し', '家族', 'デート', '再訪', 'おすすめ'],
  zh: ['美食', '风景', '拍照', '放松', '家庭', '约会', '再访', '推荐'],
};

export const TRAVEL_REVIEW_COPY: Record<
  AppLanguage,
  {
    writeReview: string;
    editReview: string;
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
    composeTitle: string;
    composeSub: string;
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
    published: string;
    publishedPublic: string;
    publishedPrivate: string;
    viewFeed: string;
    viewMyTravelogue: string;
    publishedSuccessPublic: string;
    publishedSuccessPrivate: string;
    feedTitle: string;
    feedEmpty: string;
    feedEmptySub: string;
    placeReviewsSection: string;
    stars: (n: number) => string;
    visitFirst: string;
    mediaMockHint: string;
    publishedSuccess: string;
    completeTrip: string;
    composePartialHint: string;
    detailBy: (name: string) => string;
    overallSummary: string;
  }
> = {
  ko: {
    writeReview: '후기 남기기',
    editReview: '후기 수정',
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
    composeTitle: '여행기 작성',
    composeSub: '작성한 후기를 바탕으로 여행기를 완성해 보세요. 후기가 없어도 등록할 수 있어요.',
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
    published: '게시됨',
    publishedPublic: '공개',
    publishedPrivate: '비공개',
    viewFeed: '여행기 둘러보기',
    viewMyTravelogue: '내 여행기 보기',
    publishedSuccessPublic: '여행기가 공개 게시됐어요!',
    publishedSuccessPrivate: '여행기가 비공개로 저장됐어요!',
    feedTitle: '여행기',
    feedEmpty: '아직 게시된 여행기가 없어요',
    feedEmptySub: '공개로 게시된 여행기가 여기에 표시됩니다.',
    placeReviewsSection: '장소별 후기',
    stars: n => `${n}점`,
    visitFirst: '방문 체크 후 후기를 남길 수 있어요',
    mediaMockHint: '실제 업로드는 API 연동 후 제공됩니다',
    publishedSuccess: '여행기가 게시됐어요!',
    completeTrip: '여행 완료 처리',
    composePartialHint: '후기를 모두 작성하지 않아도 여행기를 등록할 수 있어요',
    detailBy: name => `${name}님의 여행기`,
    overallSummary: '종합 후기',
  },
  en: {
    writeReview: 'Write review',
    editReview: 'Edit review',
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
    composeTitle: 'Compose travelogue',
    composeSub: 'Complete your travelogue from the reviews you wrote. You can publish without any reviews.',
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
    published: 'Published',
    publishedPublic: 'Public',
    publishedPrivate: 'Private',
    viewFeed: 'Browse travelogues',
    viewMyTravelogue: 'View my travelogue',
    publishedSuccessPublic: 'Travelogue published publicly!',
    publishedSuccessPrivate: 'Travelogue saved privately!',
    feedTitle: 'Travelogues',
    feedEmpty: 'No travelogues yet',
    feedEmptySub: 'Public travelogues from other travelers will appear here.',
    placeReviewsSection: 'Place reviews',
    stars: n => `${n} stars`,
    visitFirst: 'Mark visited before writing a review',
    mediaMockHint: 'Real uploads will arrive with API integration',
    publishedSuccess: 'Travelogue published!',
    completeTrip: 'Mark trip complete',
    composePartialHint: 'You can publish a travelogue without completing every review',
    detailBy: name => `Travelogue by ${name}`,
    overallSummary: 'Overall review',
  },
  ja: {
    writeReview: 'レビューを書く',
    editReview: 'レビューを編集',
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
    composeTitle: '旅行記を作成',
    composeSub: '書いたレビューをもとに旅行記を完成させましょう。レビューがなくても登録できます。',
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
    published: '公開済み',
    publishedPublic: '公開',
    publishedPrivate: '非公開',
    viewFeed: '旅行記を見る',
    viewMyTravelogue: '自分の旅行記を見る',
    publishedSuccessPublic: '旅行記を公開しました！',
    publishedSuccessPrivate: '旅行記を非公開で保存しました！',
    feedTitle: '旅行記',
    feedEmpty: 'まだ公開された旅行記がありません',
    feedEmptySub: '公開された旅行記がここに表示されます。',
    placeReviewsSection: 'スポット別レビュー',
    stars: n => `${n}点`,
    visitFirst: '訪問チェック後にレビューを書けます',
    mediaMockHint: '実際のアップロードはAPI連携後に提供されます',
    publishedSuccess: '旅行記を公開しました！',
    completeTrip: '旅行完了にする',
    composePartialHint: 'すべてのレビューがなくても旅行記を登録できます',
    detailBy: name => `${name}さんの旅行記`,
    overallSummary: '総合レビュー',
  },
  zh: {
    writeReview: '写点评',
    editReview: '编辑点评',
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
    composeTitle: '撰写游记',
    composeSub: '根据已写点评完成游记。没有点评也可以发布。',
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
    published: '已发布',
    publishedPublic: '公开',
    publishedPrivate: '私密',
    viewFeed: '浏览游记',
    viewMyTravelogue: '查看我的游记',
    publishedSuccessPublic: '游记已公开发布！',
    publishedSuccessPrivate: '游记已私密保存！',
    feedTitle: '游记',
    feedEmpty: '暂无已发布游记',
    feedEmptySub: '公开发布的游记会显示在这里。',
    placeReviewsSection: '各地点评',
    stars: n => `${n}分`,
    visitFirst: '标记到访后可写点评',
    mediaMockHint: '实际上传将在 API 接入后提供',
    publishedSuccess: '游记已发布！',
    completeTrip: '标记行程完成',
    composePartialHint: '无需完成全部点评即可发布游记',
    detailBy: name => `${name}的游记`,
    overallSummary: '综合点评',
  },
};
