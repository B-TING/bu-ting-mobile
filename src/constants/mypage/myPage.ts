import type { AppLanguage } from '../../types/user';

/** @deprecated Use useCopy('myPage') from src/i18n */
export const MY_PAGE_COPY: Record<
  AppLanguage,
  {
    title: string;
    profile: string;
    nickname: string;
    changeNickname: string;
    changeNicknameTitle: string;
    changeNicknamePlaceholder: string;
    changeNicknameSave: string;
    changeNicknameCancel: string;
    changeNicknameSuccess: string;
    changeNicknameError: string;
    changeNicknameEmpty: string;
    deleteAccount: string;
    deleteAccountConfirm: string;
    deleteAccountCancel: string;
    deleteAccountError: string;
    email: string;
    provider: string;
    userId: string;
    session: string;
    rememberMe: string;
    rememberMeOn: string;
    rememberMeOff: string;
    hideUserId: string;
    notLoggedIn: string;
    logout: string;
    logoutConfirm: string;
    logoutCancel: string;
    loginAgain: string;
    preferences: string;
    preferencesDesc: string;
    preferencesEmpty: string;
    preferencesSkippedAll: string;
    editPreferences: string;
    preferenceFields: {
      travelStyle: string;
      schedulePace: string;
      companions: string;
      luggage: string;
      purposes: string;
      busanFamiliarity: string;
      notSet: string;
      skipped: string;
    };
    providers: Record<'google' | 'kakao' | 'naver', string>;
  }
> = {
  ko: {
    title: '마이페이지',
    profile: '내 계정',
    nickname: '닉네임',
    changeNickname: '닉네임 변경',
    changeNicknameTitle: '닉네임 변경',
    changeNicknamePlaceholder: '새 닉네임',
    changeNicknameSave: '저장',
    changeNicknameCancel: '취소',
    changeNicknameSuccess: '닉네임이 변경되었습니다.',
    changeNicknameError: '닉네임 변경에 실패했습니다.',
    changeNicknameEmpty: '닉네임을 입력해 주세요.',
    deleteAccount: '계정 탈퇴',
    deleteAccountConfirm: '정말 탈퇴하시겠습니까? 계정과 로그인 정보가 삭제되며 복구할 수 없습니다.',
    deleteAccountCancel: '취소',
    deleteAccountError: '계정 탈퇴에 실패했습니다.',
    email: '이메일',
    provider: '로그인 방식',
    userId: '사용자 ID',
    session: '로그인 세션',
    rememberMe: '자동 로그인',
    rememberMeOn: '켜짐',
    rememberMeOff: '꺼짐',
    hideUserId: '사용자 ID 숨기기',
    notLoggedIn: '로그인되어 있지 않습니다.',
    logout: '로그아웃',
    logoutConfirm: '로그아웃 하시겠습니까?',
    logoutCancel: '취소',
    loginAgain: '다시 로그인',
    preferences: '여행 취향',
    preferencesDesc: 'AI 추천과 일정 생성에 반영되는 설문 응답입니다.',
    preferencesEmpty: '아직 저장된 취향이 없습니다.',
    preferencesSkippedAll: '온보딩을 건너뛰어 취향 정보가 없습니다.',
    editPreferences: '취향 다시 설정',
    preferenceFields: {
      travelStyle: '여행 스타일',
      schedulePace: '일정 페이스',
      companions: '동행',
      luggage: '짐',
      purposes: '관심사',
      busanFamiliarity: '부산 숙련도',
      notSet: '미응답',
      skipped: '건너뜀',
    },
    providers: { google: 'Google', kakao: '카카오', naver: '네이버' },
  },
  en: {
    title: 'My page',
    profile: 'Account',
    nickname: 'Nickname',
    changeNickname: 'Edit nickname',
    changeNicknameTitle: 'Edit nickname',
    changeNicknamePlaceholder: 'New nickname',
    changeNicknameSave: 'Save',
    changeNicknameCancel: 'Cancel',
    changeNicknameSuccess: 'Nickname updated.',
    changeNicknameError: 'Could not update nickname.',
    changeNicknameEmpty: 'Please enter a nickname.',
    deleteAccount: 'Delete account',
    deleteAccountConfirm:
      'Delete your account permanently? Your sign-in and profile data will be removed and cannot be restored.',
    deleteAccountCancel: 'Cancel',
    deleteAccountError: 'Could not delete account.',
    email: 'Email',
    provider: 'Sign-in method',
    userId: 'User ID',
    session: 'Session',
    rememberMe: 'Keep me signed in',
    rememberMeOn: 'On',
    rememberMeOff: 'Off',
    hideUserId: 'Hide user ID',
    notLoggedIn: 'You are not signed in.',
    logout: 'Sign out',
    logoutConfirm: 'Sign out now?',
    logoutCancel: 'Cancel',
    loginAgain: 'Sign in again',
    preferences: 'Travel preferences',
    preferencesDesc: 'Used for AI recommendations and itinerary generation.',
    preferencesEmpty: 'No saved preferences yet.',
    preferencesSkippedAll: 'Onboarding was skipped — no preference data.',
    editPreferences: 'Update preferences',
    preferenceFields: {
      travelStyle: 'Travel style',
      schedulePace: 'Schedule pace',
      companions: 'Companions',
      luggage: 'Luggage',
      purposes: 'Interests',
      busanFamiliarity: 'Busan familiarity',
      notSet: 'Not answered',
      skipped: 'Skipped',
    },
    providers: { google: 'Google', kakao: 'Kakao', naver: 'Naver' },
  },
  ja: {
    title: 'マイページ',
    profile: 'アカウント',
    nickname: 'ニックネーム',
    changeNickname: '変更',
    changeNicknameTitle: 'ニックネーム変更',
    changeNicknamePlaceholder: '新しいニックネーム',
    changeNicknameSave: '保存',
    changeNicknameCancel: 'キャンセル',
    changeNicknameSuccess: 'ニックネームを変更しました。',
    changeNicknameError: 'ニックネームの変更に失敗しました。',
    changeNicknameEmpty: 'ニックネームを入力してください。',
    deleteAccount: 'アカウント削除',
    deleteAccountConfirm:
      '本当に退会しますか？アカウントとログイン情報は削除され、復元できません。',
    deleteAccountCancel: 'キャンセル',
    deleteAccountError: 'アカウント削除に失敗しました。',
    email: 'メール',
    provider: 'ログイン方法',
    userId: 'ユーザーID',
    session: 'セッション',
    rememberMe: '自動ログイン',
    rememberMeOn: 'オン',
    rememberMeOff: 'オフ',
    hideUserId: 'ユーザーIDを隠す',
    notLoggedIn: 'ログインしていません。',
    logout: 'ログアウト',
    logoutConfirm: 'ログアウトしますか？',
    logoutCancel: 'キャンセル',
    loginAgain: '再ログイン',
    preferences: '旅行の好み',
    preferencesDesc: 'AIおすすめと行程作成に反映されます。',
    preferencesEmpty: '保存された好みはまだありません。',
    preferencesSkippedAll: 'オンボーディングをスキップしたため、好み情報がありません。',
    editPreferences: '好みを再設定',
    preferenceFields: {
      travelStyle: '旅行スタイル',
      schedulePace: '日程のペース',
      companions: '同行',
      luggage: '荷物',
      purposes: '興味',
      busanFamiliarity: '釜山の熟悉度',
      notSet: '未回答',
      skipped: 'スキップ',
    },
    providers: { google: 'Google', kakao: 'Kakao', naver: 'Naver' },
  },
  zh: {
    title: '我的',
    profile: '账户',
    nickname: '昵称',
    changeNickname: '修改昵称',
    changeNicknameTitle: '修改昵称',
    changeNicknamePlaceholder: '新昵称',
    changeNicknameSave: '保存',
    changeNicknameCancel: '取消',
    changeNicknameSuccess: '昵称已更新。',
    changeNicknameError: '昵称更新失败。',
    changeNicknameEmpty: '请输入昵称。',
    deleteAccount: '注销账户',
    deleteAccountConfirm: '确定要注销吗？账户与登录信息将被删除且无法恢复。',
    deleteAccountCancel: '取消',
    deleteAccountError: '账户注销失败。',
    email: '邮箱',
    provider: '登录方式',
    userId: '用户 ID',
    session: '会话',
    rememberMe: '自动登录',
    rememberMeOn: '开启',
    rememberMeOff: '关闭',
    hideUserId: '隐藏用户 ID',
    notLoggedIn: '尚未登录。',
    logout: '退出登录',
    logoutConfirm: '确定要退出登录吗？',
    logoutCancel: '取消',
    loginAgain: '重新登录',
    preferences: '旅行偏好',
    preferencesDesc: '用于 AI 推荐与行程生成。',
    preferencesEmpty: '尚未保存偏好。',
    preferencesSkippedAll: '已跳过引导，暂无偏好信息。',
    editPreferences: '重新设置偏好',
    preferenceFields: {
      travelStyle: '旅行风格',
      schedulePace: '行程节奏',
      companions: '同行',
      luggage: '行李',
      purposes: '兴趣',
      busanFamiliarity: '釜山熟悉度',
      notSet: '未回答',
      skipped: '已跳过',
    },
    providers: { google: 'Google', kakao: 'Kakao', naver: 'Naver' },
  },
};
