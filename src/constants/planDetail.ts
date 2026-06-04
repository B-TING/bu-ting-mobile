import type { AppLanguage } from '../types/user';

export type PlanDetailTab = 'overview' | 'schedule' | 'explore' | 'budget' | 'records';

export const PLAN_DETAIL_TABS: { id: PlanDetailTab; label: Record<AppLanguage, string> }[] = [
  { id: 'overview', label: { ko: '개요', en: 'Overview', ja: '概要', zh: '概览' } },
  { id: 'schedule', label: { ko: '일정', en: 'Schedule', ja: '日程', zh: '行程' } },
  { id: 'explore', label: { ko: '탐색', en: 'Explore', ja: '探索', zh: '探索' } },
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
    budgetAdd: string;
    budgetEmpty: string;
    exploreSoon: string;
    recordsSoon: string;
    inviteMembers: string;
    tripPeriod: string;
    nights: (n: number) => string;
    dayLabel: (n: number) => string;
    schedulePreview: string;
    dailyHighlights: string;
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
  }
> = {
  ko: {
    routeOptimize: '경로 최적화',
    addPlace: '장소 추가',
    directions: '길찾기',
    mapPlaceholder: '네이버 지도 (준비 중)',
    mapPlaceholderSub: 'API 연동 전 · 좌표 기반 미리보기',
    mapTapHint: '탭하여 크게 보기',
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
    budgetAdd: '지출 추가',
    budgetEmpty: '아직 기록된 지출이 없어요',
    exploreSoon: '탐색 탭은 곧 TourAPI·맵 연동과 함께 제공됩니다.',
    recordsSoon: '사진·메모 기록 기능은 준비 중입니다.',
    inviteMembers: '일행 초대하기',
    tripPeriod: '여행 기간',
    nights: n => `${n}박`,
    dayLabel: n => `Day ${n}`,
    schedulePreview: '일정',
    dailyHighlights: '일정 하이라이트',
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
  },
  en: {
    routeOptimize: 'Optimize route',
    addPlace: 'Add place',
    directions: 'Directions',
    mapPlaceholder: 'Naver Map (coming soon)',
    mapPlaceholderSub: 'Preview by coordinates until API is ready',
    mapTapHint: 'Tap to expand map',
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
    budgetAdd: 'Add expense',
    budgetEmpty: 'No expenses yet',
    exploreSoon: 'Explore will arrive with TourAPI and maps.',
    recordsSoon: 'Photo and note records are coming soon.',
    inviteMembers: 'Invite companions',
    tripPeriod: 'Trip dates',
    nights: n => `${n} night${n === 1 ? '' : 's'}`,
    dayLabel: n => `Day ${n}`,
    schedulePreview: 'Schedule',
    dailyHighlights: 'Daily highlights',
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
  },
  ja: {
    routeOptimize: 'ルート最適化',
    addPlace: '場所を追加',
    directions: '道順',
    mapPlaceholder: 'NAVERマップ（準備中）',
    mapPlaceholderSub: 'API連携前のプレビュー',
    mapTapHint: 'タップで拡大',
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
    budgetAdd: '支出を追加',
    budgetEmpty: '支出記録なし',
    exploreSoon: '探索はTourAPI連携後に提供します。',
    recordsSoon: '記録機能は準備中です。',
    inviteMembers: '同行者を招待',
    tripPeriod: '旅行期間',
    nights: n => `${n}泊`,
    dayLabel: n => `Day ${n}`,
    schedulePreview: '日程',
    dailyHighlights: '日程ハイライト',
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
  },
  zh: {
    routeOptimize: '优化路线',
    addPlace: '添加地点',
    directions: '导航',
    mapPlaceholder: 'Naver 地图（即将上线）',
    mapPlaceholderSub: 'API 接入前的坐标预览',
    mapTapHint: '点击放大地图',
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
    budgetAdd: '添加支出',
    budgetEmpty: '暂无支出记录',
    exploreSoon: '探索将与 TourAPI 和地图一同上线。',
    recordsSoon: '照片与笔记记录即将推出。',
    inviteMembers: '邀请同行',
    tripPeriod: '行程日期',
    nights: n => `${n}晚`,
    dayLabel: n => `第 ${n} 天`,
    schedulePreview: '行程',
    dailyHighlights: '每日亮点',
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
  },
};
