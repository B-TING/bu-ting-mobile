import type { AppLanguage } from '../../types/user';
import type { NotificationType } from '../../types/notification';

type NotificationTypeCopy = {
  label: string;
  hint: string;
};

/** @deprecated Use useCopy('notificationSettings') from src/i18n */
export const NOTIFICATION_SETTINGS_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    subtitle: string;
    loginRequired: string;
    loginAction: string;
    masterLabel: string;
    masterHint: string;
    categoriesTitle: string;
    syncFailed: string;
    typeLabels: Record<NotificationType, NotificationTypeCopy>;
  }
> = {
  ko: {
    screenTitle: '알림 설정',
    subtitle: '받고 싶은 알림을 골라 주세요',
    loginRequired: '알림 설정을 저장하려면 로그인이 필요해요.',
    loginAction: '로그인',
    masterLabel: '알림 받기',
    masterHint: '꺼 두면 이 기기에서 푸시를 받지 않아요.',
    categoriesTitle: '알림 종류',
    syncFailed: '설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    typeLabels: {
      ROUND_OPEN: { label: '회차 오픈', hint: '구역 이벤트 회차가 열릴 때' },
      ROUND_PREVIEW: { label: '회차 예고', hint: '곧 시작될 회차 안내' },
      LIKE_DEADLINE: { label: '좋아요 마감', hint: '좋아요 집계 마감 안내' },
      SETTLEMENT: { label: '정산·결과', hint: '미션·정산 결과 알림' },
      TITLE_PROGRESS: { label: '칭호 진행', hint: '구역 칭호·등급 진행' },
      OPERATOR: { label: '운영 공지', hint: '운영자가 보내는 공지' },
    },
  },
  en: {
    screenTitle: 'Notifications',
    subtitle: 'Choose what you want to hear about',
    loginRequired: 'Sign in to save notification preferences.',
    loginAction: 'Sign in',
    masterLabel: 'Allow notifications',
    masterHint: 'Turn this off to stop push on this device.',
    categoriesTitle: 'Categories',
    syncFailed: 'Could not save settings. Try again later.',
    typeLabels: {
      ROUND_OPEN: { label: 'Round open', hint: 'When a zone event round starts' },
      ROUND_PREVIEW: { label: 'Round preview', hint: 'Upcoming round reminders' },
      LIKE_DEADLINE: { label: 'Like deadline', hint: 'Like counting deadline' },
      SETTLEMENT: { label: 'Results', hint: 'Mission and settlement results' },
      TITLE_PROGRESS: { label: 'Title progress', hint: 'Zone title and grade progress' },
      OPERATOR: { label: 'Operator notices', hint: 'Announcements from operators' },
    },
  },
  ja: {
    screenTitle: '通知設定',
    subtitle: '受け取る通知を選んでください',
    loginRequired: '通知設定を保存するにはログインが必要です。',
    loginAction: 'ログイン',
    masterLabel: '通知を受け取る',
    masterHint: 'オフにするとこの端末ではプッシュを受け取りません。',
    categoriesTitle: '通知の種類',
    syncFailed: '設定を保存できませんでした。しばらくしてから再試行してください。',
    typeLabels: {
      ROUND_OPEN: { label: 'ラウンド開始', hint: 'エリアイベントのラウンド開始' },
      ROUND_PREVIEW: { label: 'ラウンド予告', hint: 'まもなく開始のラウンド' },
      LIKE_DEADLINE: { label: 'いいね締切', hint: 'いいね集計の締切' },
      SETTLEMENT: { label: '結果・精算', hint: 'ミッション・精算の結果' },
      TITLE_PROGRESS: { label: '称号の進捗', hint: 'エリア称号・等級の進捗' },
      OPERATOR: { label: '運営のお知らせ', hint: '運営からのお知らせ' },
    },
  },
  zh: {
    screenTitle: '通知设置',
    subtitle: '选择想收到的通知',
    loginRequired: '保存通知设置需要登录。',
    loginAction: '登录',
    masterLabel: '接收通知',
    masterHint: '关闭后此设备将不再接收推送。',
    categoriesTitle: '通知类型',
    syncFailed: '无法保存设置，请稍后再试。',
    typeLabels: {
      ROUND_OPEN: { label: '回合开启', hint: '区域活动回合开始时' },
      ROUND_PREVIEW: { label: '回合预告', hint: '即将开始的回合提醒' },
      LIKE_DEADLINE: { label: '点赞截止', hint: '点赞统计截止提醒' },
      SETTLEMENT: { label: '结果结算', hint: '任务与结算结果' },
      TITLE_PROGRESS: { label: '称号进度', hint: '区域称号与等级进度' },
      OPERATOR: { label: '运营公告', hint: '运营发送的公告' },
    },
  },
};
