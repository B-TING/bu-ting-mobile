import type { AppLanguage } from '../../types/user';

/**
 * Google Play Prominent Disclosure 권장 형식 기반:
 * "[App] collects location data to enable [features] while the app is in use."
 * @see https://support.google.com/googleplay/android-developer/answer/10144311
 */
export type LocationConsentCopy = {
  title: string;
  /** Play 정책용 핵심 고지 문장 (location + 사용 목적 + 앱 사용 중) */
  disclosure: string;
  detail: string;
  accept: string;
  decline: string;
};

export const LOCATION_CONSENT_COPY: Record<AppLanguage, LocationConsentCopy> = {
  ko: {
    title: '위치 정보 사용 안내',
    disclosure:
      '부팅은 앱 사용 중 위치 정보를 수집하여 인근 시설 검색, 여행지 검색, 채팅 구역 설정을 제공합니다.',
    detail:
      '위치 정보는 앱이 화면에 열려 있는 동안에만 사용하며, 광고에 사용하지 않습니다. 동의 후에도 기기 설정에서 권한을 변경할 수 있습니다.',
    accept: '동의하고 계속',
    decline: '지금은 안 함',
  },
  en: {
    title: 'Location data notice',
    disclosure:
      'Bu-Ting collects location data to enable nearby facility search, destination search, and chat zone settings while the app is in use.',
    detail:
      'Location is used only while the app is on screen and is not used for advertising. You can change this permission later in device settings.',
    accept: 'Agree and continue',
    decline: 'Not now',
  },
  ja: {
    title: '位置情報の利用について',
    disclosure:
      'ブティングは、アプリ使用中に位置情報を収集し、近隣施設検索・旅行先検索・チャットゾーン設定を提供します。',
    detail:
      '位置情報はアプリが表示されている間のみ使用し、広告には使用しません。同意後も端末設定で権限を変更できます。',
    accept: '同意して続行',
    decline: '今はしない',
  },
  zh: {
    title: '位置信息使用说明',
    disclosure:
      'Bu-Ting 在应用使用期间收集位置信息，用于附近设施搜索、目的地搜索和聊天区域设置。',
    detail:
      '位置信息仅在应用显示于屏幕时使用，不会用于广告。同意后仍可在设备设置中更改权限。',
    accept: '同意并继续',
    decline: '暂不',
  },
};

export function getLocationConsentCopy(
  language: AppLanguage | null | undefined,
): LocationConsentCopy {
  return LOCATION_CONSENT_COPY[language ?? 'ko'];
}
