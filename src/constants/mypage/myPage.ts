import type { AppLanguage } from '../../types/user';

export const MY_PAGE_COPY: Record<
  AppLanguage,
  {
    title: string;
    profile: string;
    nickname: string;
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
    providers: Record<'google' | 'kakao' | 'naver', string>;
  }
> = {
  ko: {
    title: '마이페이지',
    profile: '내 계정',
    nickname: '닉네임',
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
    providers: { google: 'Google', kakao: '카카오', naver: '네이버' },
  },
  en: {
    title: 'My page',
    profile: 'Account',
    nickname: 'Nickname',
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
    providers: { google: 'Google', kakao: 'Kakao', naver: 'Naver' },
  },
  ja: {
    title: 'マイページ',
    profile: 'アカウント',
    nickname: 'ニックネーム',
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
    providers: { google: 'Google', kakao: 'Kakao', naver: 'Naver' },
  },
  zh: {
    title: '我的',
    profile: '账户',
    nickname: '昵称',
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
    providers: { google: 'Google', kakao: 'Kakao', naver: 'Naver' },
  },
};
