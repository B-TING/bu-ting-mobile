import type { AppLanguage } from '../../types/user';

export type PlanDetailTab = 'overview' | 'schedule' | 'budget' | 'records';

export const PLAN_DETAIL_TABS: { id: PlanDetailTab; label: Record<AppLanguage, string> }[] = [
  { id: 'overview', label: { ko: '개요', en: 'Overview', ja: '概要', zh: '概览' } },
  { id: 'schedule', label: { ko: '일정', en: 'Schedule', ja: '日程', zh: '行程' } },
  { id: 'budget', label: { ko: '가계부', en: 'Budget', ja: '家計', zh: '账本' } },
  { id: 'records', label: { ko: '기록', en: 'Records', ja: '記録', zh: '记录' } },
];

export const PLAN_DETAIL_COPY: Record<
  AppLanguage,
  {
    routeOptimize: string;
    addPlace: string;
    directions: string;
    mapPlaceholder: string;
    mapPlaceholderSub: string;
    mapTapHint: string;
    mapDragLabel: string;
    mapClosedHint: string;
    membersTitle: string;
    roleOwner: string;
    roleEditor: string;
    roleViewer: string;
    visited: string;
    markVisited: string;
    closedHint: string;
    hotelHint: string;
    hotelCta: string;
    budgetTotal: string;
    budgetExpenseCount: (count: number) => string;
    budgetCategoryBreakdown: string;
    budgetExpenseList: string;
    budgetDayEmpty: string;
    budgetAdd: string;
    budgetEmpty: string;
    exploreSoon: string;
    recordsProgress: (done: number, total: number) => string;
    recordsReady: string;
    recordsPublished: string;
    recordsHint: string;
    inviteMembers: string;
    tripPeriod: string;
    nights: (n: number) => string;
    dayLabel: (n: number) => string;
    schedulePreview: string;
    dailyHighlights: string;
    nextScheduleTitle: string;
    explorePreview: string;
    budgetPreview: string;
    recordsPreview: string;
    viewTab: string;
    placesCount: (n: number) => string;
    noRouteThatDay: string;
    morePlaces: (n: number) => string;
    openDetail: string;
    close: string;
    dwell: (m: number) => string;
    legWalk: string;
    legDrive: string;
    legTransit: string;
    reorderLongPressHint: string;
    reorderHandleHint: string;
    reorderHandleHintSelected: string;
    reorderActiveHint: string;
    editRoute: string;
    rebootFabLabel: string;
    rebootActionSub: (name: string) => string;
    rebootDelete: string;
    rebootReplace: string;
    rebootCancel: string;
    rebootModalTitle: string;
    rebootModalSub: (name: string) => string;
    rebootNearbyTitle: string;
    rebootSearchPlaceholder: string;
    rebootSearchEmpty: string;
    rebootApply: string;
    rebootDistance: (d: string) => string;
    addPlaceTitle: string;
    addPlaceSub: string;
    addPlaceBrowseTitle: string;
    addPlaceClose: string;
    addPlaceConfirm: string;
    writeReview: string;
    editReview: string;
    visitFirstReview: string;
    recordReview: string;
    quickRatingHint: string;
    detailLoading: string;
    notFound: string;
    addressLabel: string;
    phoneLabel: string;
    hoursLabel: string;
    openNow: string;
    closedNow: string;
    reviewsTitle: string;
    reviewsSource: string;
    openInGoogleMaps: string;
    placeRatingSummary: (rating: number, count: number) => string;
    transportModeTitle: string;
    routeOptimized: string;
    budgetPayer: string;
    budgetSplit: string;
    budgetDate: string;
    budgetItem: string;
    budgetColCategory: string;
    budgetAmount: string;
    budgetMemo: string;
    budgetMemoPlaceholder: string;
    budgetCategoryFood: string;
    budgetCategoryShopping: string;
    budgetCategoryAccommodation: string;
    budgetCategoryTransport: string;
    budgetCategoryEntertainment: string;
    budgetCategoryOther: string;
    budgetSplitAll: string;
    budgetOcrScan: string;
    budgetOcrSoon: string;
    budgetSave: string;
    budgetCancel: string;
    dayDuration: (m: string) => string;
    dayZoneCount: (n: number) => string;
  }
> = {
  ko: {
    routeOptimize: '경로 최적화',
    addPlace: '장소 추가',
    directions: '길찾기',
    mapPlaceholder: '카카오맵',
    mapPlaceholderSub: '일정·장소 위치',
    mapTapHint: '탭하여 크게 보기',
    mapDragLabel: '일정 크기 조절',
    mapClosedHint: '위로 당겨 일정 열기',
    membersTitle: '함께하는 일행',
    roleOwner: '방장',
    roleEditor: '편집',
    roleViewer: '보기',
    visited: '방문 완료',
    markVisited: '방문 체크',
    closedHint: '해당 요일 휴무일 수 있어요',
    hotelHint: '숙소가 아직 없어요. 일정에 맞는 숙소를 예약해 보세요.',
    hotelCta: '숙소 찾기',
    budgetTotal: '총 지출',
    budgetExpenseCount: n => `${n}건의 지출`,
    budgetCategoryBreakdown: '유형별 합계',
    budgetExpenseList: '지출 내역',
    budgetDayEmpty: '이 날짜에 기록된 지출이 없어요',
    budgetAdd: '지출 추가',
    budgetEmpty: '아직 기록된 지출이 없어요',
    exploreSoon: '탐색 탭은 곧 TourAPI·맵 연동과 함께 제공됩니다.',
    recordsProgress: (done, total) => `${done} / ${total}곳 후기 완료`,
    recordsReady: '여행기 작성 가능',
    recordsPublished: '여행기 게시 완료',
    recordsHint: '방문한 여행지마다 후기를 남겨 보세요',
    inviteMembers: '일행 초대하기',
    tripPeriod: '여행 기간',
    nights: n => `${n}박`,
    dayLabel: n => `Day ${n}`,
    schedulePreview: '일정',
    dailyHighlights: '일정 하이라이트',
    nextScheduleTitle: '다음 일정',
    explorePreview: '탐색',
    budgetPreview: '가계부',
    recordsPreview: '기록',
    viewTab: '보기 →',
    placesCount: n => `총 ${n}곳`,
    noRouteThatDay: '일정 없음',
    morePlaces: n => `외 ${n}곳`,
    openDetail: '상세 보기',
    close: '닫기',
    dwell: m => `보통 ${m}분 머무름`,
    legWalk: '도보',
    legDrive: '차량',
    legTransit: '대중교통',
    reorderLongPressHint: '바꿀 두 일정의 왼쪽 번호를 차례로 탭하세요.',
    reorderHandleHint: '탭하여 선택',
    reorderHandleHintSelected: '다시 탭하면 취소',
    reorderActiveHint: '다른 번호를 탭하면 두 일정의 순서가 바뀝니다.',
    editRoute: '수정',
    rebootFabLabel: '리부트',
    rebootActionSub: name => `「${name}」 일정을 삭제하거나 인근 장소로 대체할 수 있어요.`,
    rebootDelete: '일정에서 삭제',
    rebootReplace: '인근 장소로 대체 (리부트)',
    rebootCancel: '취소',
    rebootModalTitle: '리부트',
    rebootModalSub: name => `「${name}」 대신 방문할 인근 관광지를 골라 주세요.`,
    rebootNearbyTitle: '인근 추천',
    rebootSearchPlaceholder: '관광지 이름 검색',
    rebootSearchEmpty: '검색 결과가 없어요',
    rebootApply: '이 장소로 교체',
    rebootDistance: d => `약 ${d}`,
    addPlaceTitle: '장소 추가',
    addPlaceSub: '검색하거나 추천 목록에서 오늘 일정에 넣을 곳을 선택하세요.',
    addPlaceBrowseTitle: '추천 장소',
    addPlaceClose: '닫기',
    addPlaceConfirm: '일정에 추가',
    writeReview: '후기 남기기',
    editReview: '후기 수정',
    visitFirstReview: '방문 체크 후 후기를 남길 수 있어요',
    recordReview: '기록 남기기',
    quickRatingHint: '별점만 남기기',
    detailLoading: '리뷰·평점을 불러오는 중…',
    notFound: '장소 정보를 찾을 수 없어요.',
    addressLabel: '주소',
    phoneLabel: '전화',
    hoursLabel: '영업 시간',
    openNow: '영업 중',
    closedNow: '영업 종료',
    reviewsTitle: 'Google 리뷰',
    reviewsSource: 'Google Maps에서 제공하는 리뷰입니다.',
    openInGoogleMaps: 'Google 지도에서 보기',
    placeRatingSummary: (rating, count) =>
      `★ ${rating.toFixed(1)} · 리뷰 ${count.toLocaleString()}개`,
    transportModeTitle: '이동 수단',
    routeOptimized: '경로를 최적화했어요',
    budgetPayer: '지불자',
    budgetSplit: '나누기',
    budgetDate: '날짜',
    budgetItem: '항목',
    budgetColCategory: '분류',
    budgetAmount: '금액',
    budgetMemo: '메모',
    budgetMemoPlaceholder: '세부 사항 (선택)',
    budgetCategoryFood: '식비',
    budgetCategoryShopping: '쇼핑',
    budgetCategoryAccommodation: '숙박비',
    budgetCategoryTransport: '교통비',
    budgetCategoryEntertainment: '관람·체험',
    budgetCategoryOther: '기타',
    budgetSplitAll: '전원',
    budgetOcrScan: '영수증 OCR',
    budgetOcrSoon: '곧 제공 예정',
    budgetSave: '저장',
    budgetCancel: '취소',
    dayDuration: m => `예상 소요 ${m}`,
    dayZoneCount: n => `방문 영역 ${n}곳`,
  },
  en: {
    routeOptimize: 'Optimize route',
    addPlace: 'Add place',
    directions: 'Directions',
    mapPlaceholder: 'Kakao Map',
    mapPlaceholderSub: 'Trip stops and places',
    mapTapHint: 'Tap to expand map',
    mapDragLabel: 'Resize schedule panel',
    mapClosedHint: 'Drag up to open schedule',
    membersTitle: 'Travel companions',
    roleOwner: 'Owner',
    roleEditor: 'Editor',
    roleViewer: 'Viewer',
    visited: 'Visited',
    markVisited: 'Mark visited',
    closedHint: 'May be closed on this weekday',
    hotelHint: 'No stay booked yet for these dates.',
    hotelCta: 'Find stays',
    budgetTotal: 'Total spent',
    budgetExpenseCount: n => `${n} expense${n === 1 ? '' : 's'}`,
    budgetCategoryBreakdown: 'By category',
    budgetExpenseList: 'Expenses',
    budgetDayEmpty: 'No expenses on this date',
    budgetAdd: 'Add expense',
    budgetEmpty: 'No expenses yet',
    exploreSoon: 'Explore will arrive with TourAPI and maps.',
    recordsProgress: (done, total) => `${done} / ${total} reviews done`,
    recordsReady: 'Ready to publish travelogue',
    recordsPublished: 'Travelogue published',
    recordsHint: 'Leave a review for each place you visit',
    inviteMembers: 'Invite companions',
    tripPeriod: 'Trip dates',
    nights: n => `${n} night${n === 1 ? '' : 's'}`,
    dayLabel: n => `Day ${n}`,
    schedulePreview: 'Schedule',
    dailyHighlights: 'Daily highlights',
    nextScheduleTitle: 'Up next',
    explorePreview: 'Explore',
    budgetPreview: 'Budget',
    recordsPreview: 'Records',
    viewTab: 'View →',
    placesCount: n => `${n} places`,
    noRouteThatDay: 'No plans',
    morePlaces: n => `+${n} more`,
    openDetail: 'Details',
    close: 'Close',
    dwell: m => `Usually ${m} min here`,
    legWalk: 'Walk',
    legDrive: 'Drive',
    legTransit: 'Transit',
    reorderLongPressHint: 'Tap two route numbers in order to swap them.',
    reorderHandleHint: 'Tap to select',
    reorderHandleHintSelected: 'Tap again to cancel',
    reorderActiveHint: 'Tap another number to swap positions.',
    editRoute: 'Edit',
    rebootFabLabel: 'Reboot',
    rebootActionSub: name =>
      `You can remove 「${name}」 or replace it with a nearby place.`,
    rebootDelete: 'Remove from schedule',
    rebootReplace: 'Replace nearby (Reboot)',
    rebootCancel: 'Cancel',
    rebootModalTitle: 'Reboot',
    rebootModalSub: name => `Pick a nearby spot to replace 「${name}」.`,
    rebootNearbyTitle: 'Nearby picks',
    rebootSearchPlaceholder: 'Search attractions',
    rebootSearchEmpty: 'No results',
    rebootApply: 'Use this place',
    rebootDistance: d => `~${d}`,
    addPlaceTitle: 'Add place',
    addPlaceSub: 'Search or pick a spot to add to today’s schedule.',
    addPlaceBrowseTitle: 'Suggested places',
    addPlaceClose: 'Close',
    addPlaceConfirm: 'Add to schedule',
    writeReview: 'Write review',
    editReview: 'Edit review',
    visitFirstReview: 'Mark visited before writing a review',
    recordReview: 'Leave a record',
    quickRatingHint: 'Quick rating',
    detailLoading: 'Loading ratings and reviews…',
    notFound: 'Place not found.',
    addressLabel: 'Address',
    phoneLabel: 'Phone',
    hoursLabel: 'Hours',
    openNow: 'Open now',
    closedNow: 'Closed',
    reviewsTitle: 'Google reviews',
    reviewsSource: 'Reviews provided by Google Maps.',
    openInGoogleMaps: 'Open in Google Maps',
    placeRatingSummary: (rating, count) =>
      `★ ${rating.toFixed(1)} · ${count.toLocaleString()} reviews`,
    transportModeTitle: 'Transport mode',
    routeOptimized: 'Route optimized',
    budgetPayer: 'Paid by',
    budgetSplit: 'Split with',
    budgetDate: 'Date',
    budgetItem: 'Item',
    budgetColCategory: 'Category',
    budgetAmount: 'Amount',
    budgetMemo: 'Memo',
    budgetMemoPlaceholder: 'Details (optional)',
    budgetCategoryFood: 'Food',
    budgetCategoryShopping: 'Shopping',
    budgetCategoryAccommodation: 'Lodging',
    budgetCategoryTransport: 'Transport',
    budgetCategoryEntertainment: 'Activities',
    budgetCategoryOther: 'Other',
    budgetSplitAll: 'Everyone',
    budgetOcrScan: 'Receipt OCR',
    budgetOcrSoon: 'Coming soon',
    budgetSave: 'Save',
    budgetCancel: 'Cancel',
    dayDuration: m => `Est. ${m}`,
    dayZoneCount: n => `${n} zone${n === 1 ? '' : 's'}`,
  },
  ja: {
    routeOptimize: 'ルート最適化',
    addPlace: '場所を追加',
    directions: '道順',
    mapPlaceholder: 'Googleマップ',
    mapPlaceholderSub: '日程・スポットの位置',
    mapTapHint: 'タップで拡大',
    mapDragLabel: '日程サイズ調整',
    mapClosedHint: '上にドラッグして日程を開く',
    membersTitle: '同行者',
    roleOwner: 'オーナー',
    roleEditor: '編集',
    roleViewer: '閲覧',
    visited: '訪問済み',
    markVisited: '訪問チェック',
    closedHint: 'この曜日は休みの可能性',
    hotelHint: '宿泊がまだありません。',
    hotelCta: '宿を探す',
    budgetTotal: '合計支出',
    budgetExpenseCount: n => `${n}件の支出`,
    budgetCategoryBreakdown: '分類別合計',
    budgetExpenseList: '支出明細',
    budgetDayEmpty: 'この日の支出はありません',
    budgetAdd: '支出を追加',
    budgetEmpty: '支出記録なし',
    exploreSoon: '探索はTourAPI連携後に提供します。',
    recordsProgress: (done, total) => `${done} / ${total} 件完了`,
    recordsReady: '旅行記を作成できます',
    recordsPublished: '旅行記を公開済み',
    recordsHint: '訪問した各スポットにレビューを書きましょう',
    inviteMembers: '同行者を招待',
    tripPeriod: '旅行期間',
    nights: n => `${n}泊`,
    dayLabel: n => `Day ${n}`,
    schedulePreview: '日程',
    dailyHighlights: '日程ハイライト',
    nextScheduleTitle: '次の予定',
    explorePreview: '探索',
    budgetPreview: '家計',
    recordsPreview: '記録',
    viewTab: '見る →',
    placesCount: n => `全${n}箇所`,
    noRouteThatDay: '予定なし',
    morePlaces: n => `他${n}箇所`,
    openDetail: '詳細',
    close: '閉じる',
    dwell: m => `通常${m}分`,
    legWalk: '徒歩',
    legDrive: '車',
    legTransit: '公共交通',
    reorderLongPressHint: '入れ替える2つの番号を順にタップしてください。',
    reorderHandleHint: 'タップして選択',
    reorderHandleHintSelected: 'もう一度タップで解除',
    reorderActiveHint: '別の番号をタップすると入れ替わります。',
    editRoute: '編集',
    rebootFabLabel: 'リブート',
    rebootActionSub: name =>
      `「${name}」を削除するか、近くの場所に差し替えできます。`,
    rebootDelete: '予定から削除',
    rebootReplace: '近くで差し替え（リブート）',
    rebootCancel: 'キャンセル',
    rebootModalTitle: 'リブート',
    rebootModalSub: name => `「${name}」の代わりに近くの観光地を選んでください。`,
    rebootNearbyTitle: '近くのおすすめ',
    rebootSearchPlaceholder: '観光地名で検索',
    rebootSearchEmpty: '該当なし',
    rebootApply: 'この場所に差し替え',
    rebootDistance: d => `約${d}`,
    addPlaceTitle: '場所を追加',
    addPlaceSub: '検索するか、おすすめから今日の予定に追加する場所を選んでください。',
    addPlaceBrowseTitle: 'おすすめ',
    addPlaceClose: '閉じる',
    addPlaceConfirm: '予定に追加',
    writeReview: 'レビューを書く',
    editReview: 'レビューを編集',
    visitFirstReview: '訪問チェック後にレビューを書けます',
    recordReview: '記録を残す',
    quickRatingHint: '星だけ付ける',
    detailLoading: '評価・レビューを読み込み中…',
    notFound: '場所情報が見つかりません。',
    addressLabel: '住所',
    phoneLabel: '電話',
    hoursLabel: '営業時間',
    openNow: '営業中',
    closedNow: '営業終了',
    reviewsTitle: 'Googleレビュー',
    reviewsSource: 'Google Mapsのレビューです。',
    openInGoogleMaps: 'Googleマップで見る',
    placeRatingSummary: (rating, count) =>
      `★ ${rating.toFixed(1)} · レビュー ${count.toLocaleString()}件`,
    transportModeTitle: '移動手段',
    routeOptimized: 'ルートを最適化しました',
    budgetPayer: '支払者',
    budgetSplit: '割り勘',
    budgetDate: '日付',
    budgetItem: '項目',
    budgetColCategory: '分類',
    budgetAmount: '金額',
    budgetMemo: 'メモ',
    budgetMemoPlaceholder: '詳細（任意）',
    budgetCategoryFood: '食費',
    budgetCategoryShopping: '買い物',
    budgetCategoryAccommodation: '宿泊',
    budgetCategoryTransport: '交通',
    budgetCategoryEntertainment: '体験',
    budgetCategoryOther: 'その他',
    budgetSplitAll: '全員',
    budgetOcrScan: 'レシートOCR',
    budgetOcrSoon: '近日提供',
    budgetSave: '保存',
    budgetCancel: 'キャンセル',
    dayDuration: m => `所要約 ${m}`,
    dayZoneCount: n => `訪問エリア ${n}箇所`,
  },
  zh: {
    routeOptimize: '优化路线',
    addPlace: '添加地点',
    directions: '导航',
    mapPlaceholder: 'Google 地图',
    mapPlaceholderSub: '行程与地点位置',
    mapTapHint: '点击放大地图',
    mapDragLabel: '调整行程大小',
    mapClosedHint: '向上拖动打开行程',
    membersTitle: '同行伙伴',
    roleOwner: '房主',
    roleEditor: '可编辑',
    roleViewer: '仅查看',
    visited: '已到访',
    markVisited: '标记到访',
    closedHint: '该日可能休息',
    hotelHint: '尚未预订住宿。',
    hotelCta: '查找住宿',
    budgetTotal: '总支出',
    budgetExpenseCount: n => `${n} 笔支出`,
    budgetCategoryBreakdown: '分类合计',
    budgetExpenseList: '支出明细',
    budgetDayEmpty: '该日期暂无支出记录',
    budgetAdd: '添加支出',
    budgetEmpty: '暂无支出记录',
    exploreSoon: '探索将与 TourAPI 和地图一同上线。',
    recordsProgress: (done, total) => `已完成 ${done} / ${total}`,
    recordsReady: '可发布游记',
    recordsPublished: '游记已发布',
    recordsHint: '为每个到访地点写点评',
    inviteMembers: '邀请同行',
    tripPeriod: '行程日期',
    nights: n => `${n}晚`,
    dayLabel: n => `第 ${n} 天`,
    schedulePreview: '行程',
    dailyHighlights: '每日亮点',
    nextScheduleTitle: '下一行程',
    explorePreview: '探索',
    budgetPreview: '账本',
    recordsPreview: '记录',
    viewTab: '查看 →',
    placesCount: n => `共 ${n} 处`,
    noRouteThatDay: '暂无安排',
    morePlaces: n => `等 ${n} 处`,
    openDetail: '详情',
    close: '关闭',
    dwell: m => `通常停留 ${m} 分钟`,
    legWalk: '步行',
    legDrive: '驾车',
    legTransit: '公共交通',
    reorderLongPressHint: '依次点击两个左侧序号即可互换顺序。',
    reorderHandleHint: '点击选择',
    reorderHandleHintSelected: '再次点击取消',
    reorderActiveHint: '点击另一个序号即可互换位置。',
    editRoute: '编辑',
    rebootFabLabel: 'Reboot',
    rebootActionSub: name => `可删除「${name}」或替换为附近景点。`,
    rebootDelete: '从行程中删除',
    rebootReplace: '替换为附近景点（Reboot）',
    rebootCancel: '取消',
    rebootModalTitle: 'Reboot',
    rebootModalSub: name => `请选择替代「${name}」的附近景点。`,
    rebootNearbyTitle: '附近推荐',
    rebootSearchPlaceholder: '搜索景点名称',
    rebootSearchEmpty: '无搜索结果',
    rebootApply: '使用此地点',
    rebootDistance: d => `约 ${d}`,
    addPlaceTitle: '添加地点',
    addPlaceSub: '搜索或从推荐中选择要加入今日行程的地点。',
    addPlaceBrowseTitle: '推荐地点',
    addPlaceClose: '关闭',
    addPlaceConfirm: '加入行程',
    writeReview: '写点评',
    editReview: '编辑点评',
    visitFirstReview: '标记到访后可写点评',
    recordReview: '留下记录',
    quickRatingHint: '仅评分',
    detailLoading: '正在加载评分与评价…',
    notFound: '未找到地点信息。',
    addressLabel: '地址',
    phoneLabel: '电话',
    hoursLabel: '营业时间',
    openNow: '营业中',
    closedNow: '已打烊',
    reviewsTitle: 'Google 评价',
    reviewsSource: '评价来自 Google Maps。',
    openInGoogleMaps: '在 Google 地图中打开',
    placeRatingSummary: (rating, count) =>
      `★ ${rating.toFixed(1)} · ${count.toLocaleString()} 条评价`,
    transportModeTitle: '交通方式',
    routeOptimized: '路线已优化',
    budgetPayer: '付款人',
    budgetSplit: '分摊',
    budgetDate: '日期',
    budgetItem: '项目',
    budgetColCategory: '分类',
    budgetAmount: '金额',
    budgetMemo: '备注',
    budgetMemoPlaceholder: '详情（可选）',
    budgetCategoryFood: '餐饮',
    budgetCategoryShopping: '购物',
    budgetCategoryAccommodation: '住宿',
    budgetCategoryTransport: '交通',
    budgetCategoryEntertainment: '体验',
    budgetCategoryOther: '其他',
    budgetSplitAll: '全员',
    budgetOcrScan: '收据 OCR',
    budgetOcrSoon: '即将上线',
    budgetSave: '保存',
    budgetCancel: '取消',
    dayDuration: m => `预计 ${m}`,
    dayZoneCount: n => `访问 ${n} 个区域`,
  },
};
