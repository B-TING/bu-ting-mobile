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
    openDetail: string;
    close: string;
    dwell: (m: number) => string;
    legWalk: string;
    legDrive: string;
    legTransit: string;
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
    openDetail: '상세 보기',
    close: '닫기',
    dwell: m => `보통 ${m}분 머무름`,
    legWalk: '도보',
    legDrive: '차량',
    legTransit: '대중교통',
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
    openDetail: 'Details',
    close: 'Close',
    dwell: m => `Usually ${m} min here`,
    legWalk: 'Walk',
    legDrive: 'Drive',
    legTransit: 'Transit',
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
    openDetail: '詳細',
    close: '閉じる',
    dwell: m => `通常${m}分`,
    legWalk: '徒歩',
    legDrive: '車',
    legTransit: '公共交通',
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
    openDetail: '详情',
    close: '关闭',
    dwell: m => `通常停留 ${m} 分钟`,
    legWalk: '步行',
    legDrive: '驾车',
    legTransit: '公共交通',
  },
};
