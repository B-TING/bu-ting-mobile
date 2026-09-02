import type { AppLanguage } from '../../types/user';

export type PlanDetailTab = 'overview' | 'schedule' | 'budget' | 'records';

export const PLAN_DETAIL_TABS: { id: PlanDetailTab; label: Record<AppLanguage, string> }[] = [
  { id: 'overview', label: { ko: '개요', en: 'Overview', ja: '概要', zh: '概览' } },
  { id: 'schedule', label: { ko: '일정', en: 'Schedule', ja: '日程', zh: '行程' } },
  { id: 'budget', label: { ko: '가계부', en: 'Budget', ja: '家計', zh: '账本' } },
  { id: 'records', label: { ko: '기록', en: 'Records', ja: '記録', zh: '记录' } },
];

/** @deprecated Use useCopy('planDetail') from src/i18n */
export const PLAN_DETAIL_COPY: Record<
  AppLanguage,
  {
    routeOptimize: string;
    addPlace: string;
    directions: string;
    directionsGoogleButton: string;
    directionsKakaoButton: string;
    directionsFailed: string;
    directionsUnavailable: string;
    mapPlaceholder: string;
    mapPlaceholderSub: string;
    mapTapHint: string;
    mapDragLabel: string;
    mapClosedHint: string;
    membersTitle: string;
    roleLeader: string;
    roleMember: string;
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
    inviteModalTitle: string;
    inviteModalSubtitle: string;
    inviteQrHint: string;
    inviteCopyLink: string;
    inviteCopyLinkSoon: string;
    inviteCopied: string;
    inviteLinkLoading: string;
    inviteLinkError: string;
    inviteRetry: string;
    inviteExpiresAt: (date: string) => string;
    inviteLeaderOnly: string;
    inviteScanTitle: string;
    inviteScanWorking: string;
    inviteScanCameraDenied: string;
    inviteScanInvalid: string;
    inviteScanVerifyFailed: string;
    inviteScanAcceptFailed: string;
    inviteScanManualHint: string;
    inviteScanManualPlaceholder: string;
    inviteScanManualSubmit: string;
    inviteConfirmTitle: string;
    inviteConfirmSubtitle: (travelName: string) => string;
    inviteConfirmJoin: string;
    leaveTrip: string;
    leaveTripConfirmTitle: string;
    leaveTripConfirmMessage: string;
    leaveTripConfirm: string;
    leaveTripLeaderBlocked: string;
    leaveTripFailed: string;
    transferLeader: string;
    transferLeaderConfirmTitle: string;
    transferLeaderConfirmMessage: (name: string) => string;
    transferLeaderConfirm: string;
    transferLeaderSuccess: (name: string) => string;
    transferLeaderFailed: string;
    kickMember: string;
    kickMemberConfirmTitle: string;
    kickMemberConfirmMessage: (name: string) => string;
    kickMemberConfirm: string;
    kickMemberSuccess: (name: string) => string;
    kickMemberFailed: string;
    memberActionsNone: string;
    memberActionsWorking: string;
    tripPeriod: string;
    nights: (n: number) => string;
    dayLabel: (n: number) => string;
    addDay: string;
    removeDay: string;
    removeDayConfirmTitle: string;
    removeDayConfirmMessage: (date: string, dayNumber: number) => string;
    removeDayConfirm: string;
    cannotRemoveLastDay: string;
    cannotAddMoreDays: string;
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
    scheduleDetailLoading: string;
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
    placeMemoTitle: string;
    placeMemoPlaceholder: string;
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
    budgetSettlementTitle: string;
    budgetSettlementPreview: string;
    budgetSettlementPreviewBadge: string;
    budgetSettlementConfirmed: string;
    budgetSettlementConfirmedAt: (date: string) => string;
    budgetSettlementEmpty: string;
    budgetSettlementNoTransfers: string;
    budgetSettlementTransfers: string;
    budgetSettlementBalances: string;
    budgetSettlementPaid: string;
    budgetSettlementShare: string;
    budgetSettlementReceive: string;
    budgetSettlementOwe: string;
    budgetSettlementEven: string;
    budgetSettlementTransfer: (from: string, to: string) => string;
    budgetSettlementConfirm: string;
    budgetSettlementConfirmTitle: string;
    budgetSettlementConfirmMessage: string;
    budgetSettlementConfirmAction: string;
    budgetSettlementLocked: string;
    budgetSettlementLeaderOnly: string;
    budgetSettlementLoading: string;
    budgetSettlementError: string;
    dayDuration: (m: string) => string;
    dayZoneCount: (n: number) => string;
    offlineSyncNotice: string;
  }
> = {
  ko: {
    routeOptimize: '경로 최적화',
    addPlace: '장소 추가',
    directions: '길찾기',
    directionsGoogleButton: '구글에서 경로 보기',
    directionsKakaoButton: '카카오맵에서 경로 보기',
    directionsFailed: '지도 앱을 열지 못했습니다.',
    directionsUnavailable: '길찾기에 필요한 위치 정보가 없습니다.',
    mapPlaceholder: '카카오맵',
    mapPlaceholderSub: '일정·장소 위치',
    mapTapHint: '탭하여 크게 보기',
    mapDragLabel: '일정 크기 조절',
    mapClosedHint: '위로 당겨 일정 열기',
    membersTitle: '함께하는 일행',
    roleLeader: '방장',
    roleMember: '일행',
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
    inviteModalTitle: '일행 초대',
    inviteModalSubtitle: 'QR을 보여 줘 일행을 초대하세요.',
    inviteQrHint: '상대방이 앱에서 QR을 스캔하면 일행에 합류할 수 있어요.',
    inviteCopyLink: '링크 복사',
    inviteCopyLinkSoon: '링크 복사 · 준비중',
    inviteCopied: '복사됨',
    inviteLinkLoading: '초대 링크를 불러오는 중…',
    inviteLinkError: '초대 링크를 불러오지 못했습니다.',
    inviteRetry: '다시 시도',
    inviteExpiresAt: date => `만료: ${date}`,
    inviteLeaderOnly: '방장만 초대 링크를 생성할 수 있습니다.',
    inviteScanTitle: '초대 QR 스캔',
    inviteScanWorking: '확인 중…',
    inviteScanCameraDenied: '카메라 권한이 필요합니다. 설정에서 허용해 주세요.',
    inviteScanInvalid: '유효한 초대 QR/링크가 아닙니다.',
    inviteScanVerifyFailed: '초대 정보를 확인하지 못했습니다.',
    inviteScanAcceptFailed: '일행 합류에 실패했습니다.',
    inviteScanManualHint: 'QR을 스캔하거나 아래에 초대 링크·토큰을 붙여넣으세요.',
    inviteScanManualPlaceholder: '초대 링크 또는 토큰',
    inviteScanManualSubmit: '초대로 확인',
    inviteConfirmTitle: '이 여행에 합류할까요?',
    inviteConfirmSubtitle: name => `「${name}」에 일행으로 참여합니다.`,
    inviteConfirmJoin: '합류하기',
    leaveTrip: '여행 나가기',
    leaveTripConfirmTitle: '이 여행에서 나갈까요?',
    leaveTripConfirmMessage: '나가면 일행에서 제외되며, 이 기기에서 일정도 더 이상 보이지 않습니다.',
    leaveTripConfirm: '나가기',
    leaveTripLeaderBlocked:
      '다른 일행이 남아 있으면 방장은 나갈 수 없습니다. 일행을 눌러 방장을 위임한 뒤 나가 주세요.',
    leaveTripFailed: '여행 나가기에 실패했습니다.',
    transferLeader: '방장 위임',
    transferLeaderConfirmTitle: '방장을 위임할까요?',
    transferLeaderConfirmMessage: name =>
      `「${name}」님에게 방장 권한을 넘깁니다. 위임 후에는 일반 일행이 됩니다.`,
    transferLeaderConfirm: '위임하기',
    transferLeaderSuccess: name => `「${name}」님에게 방장을 위임했습니다.`,
    transferLeaderFailed: '방장 위임에 실패했습니다.',
    kickMember: '일행 내보내기',
    kickMemberConfirmTitle: '이 일행을 내보낼까요?',
    kickMemberConfirmMessage: name =>
      `「${name}」님을 여행에서 제외합니다. 다시 초대하려면 초대 링크가 필요합니다.`,
    kickMemberConfirm: '내보내기',
    kickMemberSuccess: name => `「${name}」님을 내보냈습니다.`,
    kickMemberFailed: '일행 내보내기에 실패했습니다.',
    memberActionsNone: '이 일행에 대해 할 수 있는 작업이 없습니다.',
    memberActionsWorking: '처리 중…',
    tripPeriod: '여행 기간',
    nights: n => `${n}박`,
    dayLabel: n => `Day ${n}`,
    addDay: '일자 추가',
    removeDay: '일자 삭제',
    removeDayConfirmTitle: '이 일자를 삭제할까요?',
    removeDayConfirmMessage: (date, dayNumber) =>
      `${date} · Day ${dayNumber} 일정과 포함된 장소가 모두 삭제됩니다.`,
    removeDayConfirm: '삭제',
    cannotRemoveLastDay: '최소 하루는 남겨야 해요.',
    cannotAddMoreDays: '여행 기간 내에 추가할 수 있는 일자가 없어요.',
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
    scheduleDetailLoading: '세부 정보를 불러오는 중입니다...',
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
    placeRatingSummary: (rating, count) => {
      const r = Number(rating) || 0;
      const c = Number(count) || 0;
      return `★ ${r.toFixed(1)} · 리뷰 ${c.toLocaleString()}개`;
    },
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
    placeMemoTitle: '장소 메모',
    placeMemoPlaceholder: '이 장소에 대한 메모를 남겨 보세요',
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
    budgetSettlementTitle: '정산',
    budgetSettlementPreview: '현재 경비 기준 미리보기입니다. 확정 전에도 확인할 수 있어요.',
    budgetSettlementPreviewBadge: '미리보기',
    budgetSettlementConfirmed: '확정됨',
    budgetSettlementConfirmedAt: date =>
      date ? `확정 일시 ${date}` : '정산이 확정되었습니다',
    budgetSettlementEmpty: '정산할 내역이 아직 없어요',
    budgetSettlementNoTransfers: '송금이 필요한 내역이 없어요',
    budgetSettlementTransfers: '송금 목록',
    budgetSettlementBalances: '멤버별 잔액',
    budgetSettlementPaid: '결제',
    budgetSettlementShare: '부담',
    budgetSettlementReceive: '받을 금액',
    budgetSettlementOwe: '보낼 금액',
    budgetSettlementEven: '차액 없음',
    budgetSettlementTransfer: (from, to) => `${from} → ${to}`,
    budgetSettlementConfirm: '정산 확정',
    budgetSettlementConfirmTitle: '정산을 확정할까요?',
    budgetSettlementConfirmMessage:
      '확정하면 송금 목록이 저장되고, 이후에는 경비를 추가·수정·삭제할 수 없습니다.',
    budgetSettlementConfirmAction: '확정',
    budgetSettlementLocked: '정산이 확정되어 경비를 변경할 수 없습니다',
    budgetSettlementLeaderOnly: '정산 확정은 방장만 할 수 있어요',
    budgetSettlementLoading: '정산 정보를 불러오는 중…',
    budgetSettlementError: '정산 정보를 불러오지 못했어요',
    dayDuration: m => `예상 소요 ${m}`,
    dayZoneCount: n => `방문 영역 ${n}곳`,
    offlineSyncNotice:
      '서버 동기화에 실패해 저장된 정보를 표시합니다. 이 상태에서는 일정 수정이 불가능합니다.',
  },
  en: {
    routeOptimize: 'Optimize route',
    addPlace: 'Add place',
    directions: 'Directions',
    directionsGoogleButton: 'View route on Google',
    directionsKakaoButton: 'View route on Kakao Map',
    directionsFailed: 'Could not open a maps app.',
    directionsUnavailable: 'Location data is missing for directions.',
    mapPlaceholder: 'Kakao Map',
    mapPlaceholderSub: 'Trip stops and places',
    mapTapHint: 'Tap to expand map',
    mapDragLabel: 'Resize schedule panel',
    mapClosedHint: 'Drag up to open schedule',
    membersTitle: 'Travel companions',
    roleLeader: 'Leader',
    roleMember: 'Member',
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
    inviteModalTitle: 'Invite companions',
    inviteModalSubtitle: 'Show this QR code to invite companions.',
    inviteQrHint: 'Companions can join by scanning this QR in the app.',
    inviteCopyLink: 'Copy link',
    inviteCopyLinkSoon: 'Copy link · Coming soon',
    inviteCopied: 'Copied',
    inviteLinkLoading: 'Loading invite link…',
    inviteLinkError: 'Could not load the invite link.',
    inviteRetry: 'Try again',
    inviteExpiresAt: date => `Expires: ${date}`,
    inviteLeaderOnly: 'Only the trip leader can create an invite link.',
    inviteScanTitle: 'Scan invite QR',
    inviteScanWorking: 'Checking…',
    inviteScanCameraDenied: 'Camera permission is required. Allow it in Settings.',
    inviteScanInvalid: 'This is not a valid invite QR or link.',
    inviteScanVerifyFailed: 'Could not verify the invite.',
    inviteScanAcceptFailed: 'Could not join the trip.',
    inviteScanManualHint: 'Scan a QR code or paste the invite link/token below.',
    inviteScanManualPlaceholder: 'Invite link or token',
    inviteScanManualSubmit: 'Check invite',
    inviteConfirmTitle: 'Join this trip?',
    inviteConfirmSubtitle: name => `You’ll join “${name}” as a companion.`,
    inviteConfirmJoin: 'Join',
    leaveTrip: 'Leave trip',
    leaveTripConfirmTitle: 'Leave this trip?',
    leaveTripConfirmMessage:
      'You’ll be removed from the party, and this itinerary will no longer appear on this device.',
    leaveTripConfirm: 'Leave',
    leaveTripLeaderBlocked:
      'As leader, you can’t leave while others remain. Tap a companion to transfer leadership first.',
    leaveTripFailed: 'Could not leave the trip.',
    transferLeader: 'Transfer leadership',
    transferLeaderConfirmTitle: 'Transfer leadership?',
    transferLeaderConfirmMessage: name =>
      `${name} will become the trip leader. You’ll become a regular companion.`,
    transferLeaderConfirm: 'Transfer',
    transferLeaderSuccess: name => `Leadership transferred to ${name}.`,
    transferLeaderFailed: 'Could not transfer leadership.',
    kickMember: 'Remove companion',
    kickMemberConfirmTitle: 'Remove this companion?',
    kickMemberConfirmMessage: name =>
      `${name} will be removed from this trip. They’ll need a new invite to rejoin.`,
    kickMemberConfirm: 'Remove',
    kickMemberSuccess: name => `${name} was removed.`,
    kickMemberFailed: 'Could not remove the companion.',
    memberActionsNone: 'No actions available for this companion.',
    memberActionsWorking: 'Working…',
    tripPeriod: 'Trip dates',
    nights: n => `${n} night${n === 1 ? '' : 's'}`,
    dayLabel: n => `Day ${n}`,
    addDay: 'Add day',
    removeDay: 'Remove day',
    removeDayConfirmTitle: 'Remove this day?',
    removeDayConfirmMessage: (date, dayNumber) =>
      `${date} · Day ${dayNumber} and all places on this day will be removed.`,
    removeDayConfirm: 'Remove',
    cannotRemoveLastDay: 'At least one day must remain.',
    cannotAddMoreDays: 'No more days can be added within the trip dates.',
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
    scheduleDetailLoading: 'Loading place details…',
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
    placeRatingSummary: (rating, count) => {
      const r = Number(rating) || 0;
      const c = Number(count) || 0;
      return `★ ${r.toFixed(1)} · ${c.toLocaleString()} reviews`;
    },
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
    placeMemoTitle: 'Place memo',
    placeMemoPlaceholder: 'Notes about this stop (optional)',
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
    budgetSettlementTitle: 'Settlement',
    budgetSettlementPreview: 'Preview based on current expenses. You can review before confirming.',
    budgetSettlementPreviewBadge: 'Preview',
    budgetSettlementConfirmed: 'Confirmed',
    budgetSettlementConfirmedAt: date =>
      date ? `Confirmed at ${date}` : 'Settlement confirmed',
    budgetSettlementEmpty: 'Nothing to settle yet',
    budgetSettlementNoTransfers: 'No transfers needed',
    budgetSettlementTransfers: 'Transfers',
    budgetSettlementBalances: 'Member balances',
    budgetSettlementPaid: 'Paid',
    budgetSettlementShare: 'Share',
    budgetSettlementReceive: 'To receive',
    budgetSettlementOwe: 'To pay',
    budgetSettlementEven: 'Even',
    budgetSettlementTransfer: (from, to) => `${from} → ${to}`,
    budgetSettlementConfirm: 'Confirm settlement',
    budgetSettlementConfirmTitle: 'Confirm settlement?',
    budgetSettlementConfirmMessage:
      'Once confirmed, transfers are saved and expenses can no longer be added, edited, or deleted.',
    budgetSettlementConfirmAction: 'Confirm',
    budgetSettlementLocked: 'Settlement is confirmed — expenses are locked',
    budgetSettlementLeaderOnly: 'Only the trip leader can confirm settlement',
    budgetSettlementLoading: 'Loading settlement…',
    budgetSettlementError: 'Could not load settlement',
    dayDuration: m => `Est. ${m}`,
    dayZoneCount: n => `${n} zone${n === 1 ? '' : 's'}`,
    offlineSyncNotice:
      'Server sync failed. Showing saved data. Schedule edits are unavailable until sync recovers.',
  },
  ja: {
    routeOptimize: 'ルート最適化',
    addPlace: '場所を追加',
    directions: '道順',
    directionsGoogleButton: 'Googleで経路を見る',
    directionsKakaoButton: 'カカオマップで経路を見る',
    directionsFailed: '地図アプリを開けませんでした。',
    directionsUnavailable: '道順に必要な位置情報がありません。',
    mapPlaceholder: 'Googleマップ',
    mapPlaceholderSub: '日程・スポットの位置',
    mapTapHint: 'タップで拡大',
    mapDragLabel: '日程サイズ調整',
    mapClosedHint: '上にドラッグして日程を開く',
    membersTitle: '同行者',
    roleLeader: 'リーダー',
    roleMember: '同行者',
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
    inviteModalTitle: '同行者を招待',
    inviteModalSubtitle: 'QRコードを見せて同行者を招待してください。',
    inviteQrHint: '相手がアプリでこのQRをスキャンすると同行者に参加できます。',
    inviteCopyLink: 'リンクをコピー',
    inviteCopyLinkSoon: 'リンクをコピー · 準備中',
    inviteCopied: 'コピーしました',
    inviteLinkLoading: '招待リンクを読み込み中…',
    inviteLinkError: '招待リンクを読み込めませんでした。',
    inviteRetry: '再試行',
    inviteExpiresAt: date => `有効期限: ${date}`,
    inviteLeaderOnly: 'リーダーのみ招待リンクを作成できます。',
    inviteScanTitle: '招待QRをスキャン',
    inviteScanWorking: '確認中…',
    inviteScanCameraDenied: 'カメラ権限が必要です。設定で許可してください。',
    inviteScanInvalid: '有効な招待QR/リンクではありません。',
    inviteScanVerifyFailed: '招待情報を確認できませんでした。',
    inviteScanAcceptFailed: '同行者への参加に失敗しました。',
    inviteScanManualHint: 'QRをスキャンするか、下に招待リンク・トークンを貼り付けてください。',
    inviteScanManualPlaceholder: '招待リンクまたはトークン',
    inviteScanManualSubmit: '招待を確認',
    inviteConfirmTitle: 'この旅行に参加しますか？',
    inviteConfirmSubtitle: name => `「${name}」に同行者として参加します。`,
    inviteConfirmJoin: '参加する',
    leaveTrip: '旅行から退出',
    leaveTripConfirmTitle: 'この旅行から退出しますか？',
    leaveTripConfirmMessage:
      '退出すると同行者から外れ、この端末でも行程が表示されなくなります。',
    leaveTripConfirm: '退出する',
    leaveTripLeaderBlocked:
      '他の同行者が残っている場合、リーダーは退出できません。同行者をタップしてリーダーを委任してから退出してください。',
    leaveTripFailed: '旅行からの退出に失敗しました。',
    transferLeader: 'リーダー委任',
    transferLeaderConfirmTitle: 'リーダーを委任しますか？',
    transferLeaderConfirmMessage: name =>
      `「${name}」さんにリーダー権限を渡します。委任後は通常の同行者になります。`,
    transferLeaderConfirm: '委任する',
    transferLeaderSuccess: name => `「${name}」さんにリーダーを委任しました。`,
    transferLeaderFailed: 'リーダーの委任に失敗しました。',
    kickMember: '同行者を退出させる',
    kickMemberConfirmTitle: 'この同行者を退出させますか？',
    kickMemberConfirmMessage: name =>
      `「${name}」さんを旅行から外します。再参加には新しい招待が必要です。`,
    kickMemberConfirm: '退出させる',
    kickMemberSuccess: name => `「${name}」さんを退出させました。`,
    kickMemberFailed: '同行者の退出処理に失敗しました。',
    memberActionsNone: 'この同行者に対してできる操作はありません。',
    memberActionsWorking: '処理中…',
    tripPeriod: '旅行期間',
    nights: n => `${n}泊`,
    dayLabel: n => `Day ${n}`,
    addDay: '日程を追加',
    removeDay: '日程を削除',
    removeDayConfirmTitle: 'この日程を削除しますか？',
    removeDayConfirmMessage: (date, dayNumber) =>
      `${date} · Day ${dayNumber} の日程と含まれる場所がすべて削除されます。`,
    removeDayConfirm: '削除',
    cannotRemoveLastDay: '最低1日は残してください。',
    cannotAddMoreDays: '旅行期間内に追加できる日程がありません。',
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
    scheduleDetailLoading: '詳細情報を読み込み中です...',
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
    placeRatingSummary: (rating, count) => {
      const r = Number(rating) || 0;
      const c = Number(count) || 0;
      return `★ ${r.toFixed(1)} · レビュー ${c.toLocaleString()}件`;
    },
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
    placeMemoTitle: '場所メモ',
    placeMemoPlaceholder: 'この場所についてメモを残しましょう',
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
    budgetSettlementTitle: '精算',
    budgetSettlementPreview: '現在の経費に基づくプレビューです。確定前にも確認できます。',
    budgetSettlementPreviewBadge: 'プレビュー',
    budgetSettlementConfirmed: '確定済み',
    budgetSettlementConfirmedAt: date =>
      date ? `確定日時 ${date}` : '精算が確定しました',
    budgetSettlementEmpty: '精算する内容はまだありません',
    budgetSettlementNoTransfers: '送金が必要な内容はありません',
    budgetSettlementTransfers: '送金一覧',
    budgetSettlementBalances: 'メンバー別残高',
    budgetSettlementPaid: '支払',
    budgetSettlementShare: '負担',
    budgetSettlementReceive: '受け取り',
    budgetSettlementOwe: '支払い',
    budgetSettlementEven: '差額なし',
    budgetSettlementTransfer: (from, to) => `${from} → ${to}`,
    budgetSettlementConfirm: '精算を確定',
    budgetSettlementConfirmTitle: '精算を確定しますか？',
    budgetSettlementConfirmMessage:
      '確定すると送金一覧が保存され、以降は経費の追加・編集・削除ができなくなります。',
    budgetSettlementConfirmAction: '確定',
    budgetSettlementLocked: '精算が確定されたため経費を変更できません',
    budgetSettlementLeaderOnly: '精算の確定はリーダーのみ可能です',
    budgetSettlementLoading: '精算情報を読み込み中…',
    budgetSettlementError: '精算情報を読み込めませんでした',
    dayDuration: m => `所要約 ${m}`,
    dayZoneCount: n => `訪問エリア ${n}箇所`,
    offlineSyncNotice:
      'サーバー同期に失敗したため、保存済みの情報を表示しています。この状態では日程の編集はできません。',
  },
  zh: {
    routeOptimize: '优化路线',
    addPlace: '添加地点',
    directions: '导航',
    directionsGoogleButton: '在 Google 查看路线',
    directionsKakaoButton: '在 Kakao 地图查看路线',
    directionsFailed: '无法打开地图应用。',
    directionsUnavailable: '缺少导航所需的位置信息。',
    mapPlaceholder: 'Google 地图',
    mapPlaceholderSub: '行程与地点位置',
    mapTapHint: '点击放大地图',
    mapDragLabel: '调整行程大小',
    mapClosedHint: '向上拖动打开行程',
    membersTitle: '同行伙伴',
    roleLeader: '房主',
    roleMember: '同行',
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
    inviteModalTitle: '邀请同行',
    inviteModalSubtitle: '展示二维码邀请同行伙伴。',
    inviteQrHint: '对方在应用内扫描此二维码即可加入行程。',
    inviteCopyLink: '复制链接',
    inviteCopyLinkSoon: '复制链接 · 准备中',
    inviteCopied: '已复制',
    inviteLinkLoading: '正在加载邀请链接…',
    inviteLinkError: '无法加载邀请链接。',
    inviteRetry: '重试',
    inviteExpiresAt: date => `过期时间: ${date}`,
    inviteLeaderOnly: '仅旅行房主可创建邀请链接。',
    inviteScanTitle: '扫描邀请二维码',
    inviteScanWorking: '确认中…',
    inviteScanCameraDenied: '需要相机权限。请在设置中允许。',
    inviteScanInvalid: '不是有效的邀请二维码或链接。',
    inviteScanVerifyFailed: '无法验证邀请信息。',
    inviteScanAcceptFailed: '加入行程失败。',
    inviteScanManualHint: '扫描二维码，或在下方粘贴邀请链接/令牌。',
    inviteScanManualPlaceholder: '邀请链接或令牌',
    inviteScanManualSubmit: '确认邀请',
    inviteConfirmTitle: '要加入此行程吗？',
    inviteConfirmSubtitle: name => `将以同行身份加入「${name}」。`,
    inviteConfirmJoin: '加入',
    leaveTrip: '退出行程',
    leaveTripConfirmTitle: '要退出此行程吗？',
    leaveTripConfirmMessage: '退出后将从同行中移除，此设备上也不再显示该行程。',
    leaveTripConfirm: '退出',
    leaveTripLeaderBlocked: '仍有其他同行时，房主无法退出。请先点选同行转让房主后再退出。',
    leaveTripFailed: '退出行程失败。',
    transferLeader: '转让房主',
    transferLeaderConfirmTitle: '要转让房主吗？',
    transferLeaderConfirmMessage: name =>
      `将把房主权限交给「${name}」。转让后您将变为普通同行。`,
    transferLeaderConfirm: '转让',
    transferLeaderSuccess: name => `已将房主转让给「${name}」。`,
    transferLeaderFailed: '转让房主失败。',
    kickMember: '移出同行',
    kickMemberConfirmTitle: '要移出该同行吗？',
    kickMemberConfirmMessage: name =>
      `将把「${name}」移出此行程。重新加入需要新的邀请。`,
    kickMemberConfirm: '移出',
    kickMemberSuccess: name => `已移出「${name}」。`,
    kickMemberFailed: '移出同行失败。',
    memberActionsNone: '对该同行没有可用操作。',
    memberActionsWorking: '处理中…',
    tripPeriod: '行程日期',
    nights: n => `${n}晚`,
    dayLabel: n => `第 ${n} 天`,
    addDay: '添加日程',
    removeDay: '删除日程',
    removeDayConfirmTitle: '要删除这一天吗？',
    removeDayConfirmMessage: (date, dayNumber) =>
      `${date} · 第 ${dayNumber} 天的行程及所有地点将被删除。`,
    removeDayConfirm: '删除',
    cannotRemoveLastDay: '至少需要保留一天。',
    cannotAddMoreDays: '旅行期间内没有可添加的日程。',
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
    scheduleDetailLoading: '正在加载详细信息...',
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
    placeRatingSummary: (rating, count) => {
      const r = Number(rating) || 0;
      const c = Number(count) || 0;
      return `★ ${r.toFixed(1)} · ${c.toLocaleString()} 条评价`;
    },
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
    placeMemoTitle: '地点备注',
    placeMemoPlaceholder: '记录关于此地点的备注（可选）',
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
    budgetSettlementTitle: '结算',
    budgetSettlementPreview: '基于当前费用的预览，确认前也可查看。',
    budgetSettlementPreviewBadge: '预览',
    budgetSettlementConfirmed: '已确认',
    budgetSettlementConfirmedAt: date =>
      date ? `确认时间 ${date}` : '结算已确认',
    budgetSettlementEmpty: '暂无需要结算的内容',
    budgetSettlementNoTransfers: '无需转账',
    budgetSettlementTransfers: '转账列表',
    budgetSettlementBalances: '成员余额',
    budgetSettlementPaid: '已付',
    budgetSettlementShare: '应摊',
    budgetSettlementReceive: '应收',
    budgetSettlementOwe: '应付',
    budgetSettlementEven: '无差额',
    budgetSettlementTransfer: (from, to) => `${from} → ${to}`,
    budgetSettlementConfirm: '确认结算',
    budgetSettlementConfirmTitle: '确认结算吗？',
    budgetSettlementConfirmMessage:
      '确认后将保存转账列表，之后无法再添加、修改或删除费用。',
    budgetSettlementConfirmAction: '确认',
    budgetSettlementLocked: '结算已确认，无法更改费用',
    budgetSettlementLeaderOnly: '仅旅行房主可确认结算',
    budgetSettlementLoading: '正在加载结算信息…',
    budgetSettlementError: '无法加载结算信息',
    dayDuration: m => `预计 ${m}`,
    dayZoneCount: n => `访问 ${n} 个区域`,
    offlineSyncNotice:
      '服务器同步失败，正在显示已保存的信息。此状态下无法修改行程。',
  },
};
