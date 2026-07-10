import type { MockEvent } from '../home/mainHome';
import type { LucideIconName } from '../icons';
import { getCopyForLanguage } from '../../i18n';
import type { AppLanguage } from '../../types/user';
import type { RouteItem } from '../../types/travelPlan';

export type BusanFestival = {
  id: string;
  tag: 'FESTIVAL' | 'EXHIBITION';
  titleKo: string;
  titleEn: string;
  titleJa: string;
  titleZh: string;
  locationKo: string;
  locationEn: string;
  locationJa: string;
  locationZh: string;
  addressKo: string;
  addressEn: string;
  addressJa: string;
  addressZh: string;
  descriptionKo: string;
  descriptionEn: string;
  descriptionJa: string;
  descriptionZh: string;
  hoursKo: string;
  hoursEn: string;
  hoursJa: string;
  hoursZh: string;
  startDate: string;
  endDate: string;
  /** 0=일 ~ 6=토. 설정 시 기간 내 해당 요일만 진행 */
  recurringWeekday?: number;
  summaryKo: string;
  summaryEn: string;
  summaryJa: string;
  summaryZh: string;
  imageUri: string;
  imageColor: string;
  imageIcon: LucideIconName;
  location: { lat: number; lng: number };
};

export const MONTH_NAMES: Record<AppLanguage, string[]> = {
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

/** @deprecated Use useCopy('festivalCalendar') from src/i18n */
export const FESTIVAL_CALENDAR_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    monthFestivalsLabel: (year: number, month: number) => string;
    emptyMonthList: string;
    emptyMonthListSub: string;
    festivalCount: (n: number) => string;
    prevMonth: string;
    nextMonth: string;
    detailTitle: string;
    locationLabel: string;
    periodLabel: string;
    hoursLabel: string;
    descriptionLabel: string;
    mapTitle: string;
    mapSubtitle: string;
    notFound: string;
    weekDays: string[];
    today: string;
    statusComingSoon: string;
    statusEnded: string;
    commentsTitle: string;
    commentPlaceholder: string;
    commentsEmpty: string;
    commentsComingSoon: string;
    close: string;
    tagFestival: string;
    tagExhibition: string;
  }
> = {
  ko: {
    screenTitle: '축제 캘린더',
    monthFestivalsLabel: (year, month) => `${year}년 ${MONTH_NAMES.ko[month]} 축제`,
    emptyMonthList: '이 달에 예정된 축제가 없어요',
    emptyMonthListSub: '다른 달을 선택해 보세요',
    festivalCount: n => `${n}개 축제`,
    prevMonth: '이전 달',
    nextMonth: '다음 달',
    detailTitle: '축제 상세',
    locationLabel: '장소',
    periodLabel: '기간',
    hoursLabel: '운영 시간',
    descriptionLabel: '소개',
    mapTitle: '카카오맵',
    mapSubtitle: '축제 장소 미리보기',
    notFound: '축제 정보를 찾을 수 없어요',
    weekDays: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘',
    statusComingSoon: 'COMING SOON',
    statusEnded: '종료된 행사입니다',
    commentsTitle: '코멘트',
    commentPlaceholder: '축제 후기를 남겨보세요',
    commentsEmpty: '아직 코멘트가 없어요',
    commentsComingSoon: '코멘트 기능은 준비 중이에요',
    close: '닫기',
    tagFestival: '축제',
    tagExhibition: '전시',
  },
  en: {
    screenTitle: 'Festival Calendar',
    monthFestivalsLabel: (year, month) => `Festivals in ${MONTH_NAMES.en[month]} ${year}`,
    emptyMonthList: 'No festivals this month',
    emptyMonthListSub: 'Try browsing another month',
    festivalCount: n => `${n} festival${n === 1 ? '' : 's'}`,
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    detailTitle: 'Festival details',
    locationLabel: 'Venue',
    periodLabel: 'Period',
    hoursLabel: 'Hours',
    descriptionLabel: 'About',
    mapTitle: 'Kakao Map',
    mapSubtitle: 'Festival venue preview',
    notFound: 'Festival not found',
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'Today',
    statusComingSoon: 'COMING SOON',
    statusEnded: 'This event has ended',
    commentsTitle: 'Comments',
    commentPlaceholder: 'Share your festival experience',
    commentsEmpty: 'No comments yet',
    commentsComingSoon: 'Comments are coming soon',
    close: 'Close',
    tagFestival: 'Festival',
    tagExhibition: 'Exhibition',
  },
  ja: {
    screenTitle: '祭りカレンダー',
    monthFestivalsLabel: (year, month) => `${year}年${MONTH_NAMES.ja[month]}の祭り`,
    emptyMonthList: '今月予定の祭りはありません',
    emptyMonthListSub: '別の月を選んでみてください',
    festivalCount: n => `${n}件の祭り`,
    prevMonth: '前の月',
    nextMonth: '次の月',
    detailTitle: '祭り詳細',
    locationLabel: '会場',
    periodLabel: '期間',
    hoursLabel: '営業時間',
    descriptionLabel: '紹介',
    mapTitle: 'Googleマップ',
    mapSubtitle: '会場プレビュー',
    notFound: '祭り情報が見つかりません',
    weekDays: ['日', '月', '火', '水', '木', '金', '土'],
    today: '今日',
    statusComingSoon: 'COMING SOON',
    statusEnded: '終了したイベントです',
    commentsTitle: 'コメント',
    commentPlaceholder: '祭りの感想を書いてみましょう',
    commentsEmpty: 'まだコメントがありません',
    commentsComingSoon: 'コメント機能は準備中です',
    close: '閉じる',
    tagFestival: '祭り',
    tagExhibition: '展示',
  },
  zh: {
    screenTitle: '节庆日历',
    monthFestivalsLabel: (year, month) => `${year}年${MONTH_NAMES.zh[month]}节庆`,
    emptyMonthList: '本月没有节庆活动',
    emptyMonthListSub: '请尝试浏览其他月份',
    festivalCount: n => `${n} 个节庆`,
    prevMonth: '上个月',
    nextMonth: '下个月',
    detailTitle: '节庆详情',
    locationLabel: '地点',
    periodLabel: '期间',
    hoursLabel: '营业时间',
    descriptionLabel: '介绍',
    mapTitle: 'Google 地图',
    mapSubtitle: '节庆地点预览',
    notFound: '找不到节庆信息',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    today: '今天',
    statusComingSoon: 'COMING SOON',
    statusEnded: '活动已结束',
    commentsTitle: '评论',
    commentPlaceholder: '分享你的节庆体验',
    commentsEmpty: '暂无评论',
    commentsComingSoon: '评论功能即将上线',
    close: '关闭',
    tagFestival: '节庆',
    tagExhibition: '展览',
  },
};

export type FestivalStatus = 'upcoming' | 'ongoing' | 'ended';

const FESTIVAL_STATUS_ORDER: Record<FestivalStatus, number> = {
  ongoing: 0,
  upcoming: 1,
  ended: 2,
};

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameIsoDate(a: string, b: string): boolean {
  return a === b;
}

export function getFestivalStatus(
  festival: BusanFestival,
  refDate: string = todayIso(),
): FestivalStatus {
  const today = parseIsoDate(refDate);
  const start = parseIsoDate(festival.startDate);
  const end = parseIsoDate(festival.endDate);
  if (today < start) {
    return 'upcoming';
  }
  if (today > end) {
    return 'ended';
  }
  return 'ongoing';
}

export function festivalStatusLabel(status: FestivalStatus, language: AppLanguage): string {
  const copy = getCopyForLanguage('festivalCalendar', language);
  return status === 'upcoming' ? copy.statusComingSoon : copy.statusEnded;
}

export function festivalActiveOnDate(festival: BusanFestival, dateIso: string): boolean {
  const d = parseIsoDate(dateIso);
  const start = parseIsoDate(festival.startDate);
  const end = parseIsoDate(festival.endDate);
  if (d < start || d > end) {
    return false;
  }
  if (festival.recurringWeekday != null) {
    return d.getDay() === festival.recurringWeekday;
  }
  return true;
}

export function festivalsOnDate(
  festivals: BusanFestival[],
  dateIso: string,
): BusanFestival[] {
  return festivals.filter(f => festivalActiveOnDate(f, dateIso));
}

export function sortFestivalsByStatus(
  festivals: BusanFestival[],
  refDate: string = todayIso(),
): BusanFestival[] {
  return [...festivals].sort((a, b) => {
    const statusDiff =
      FESTIVAL_STATUS_ORDER[getFestivalStatus(a, refDate)] -
      FESTIVAL_STATUS_ORDER[getFestivalStatus(b, refDate)];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return a.startDate.localeCompare(b.startDate);
  });
}

export function festivalsInMonth(
  festivals: BusanFestival[],
  year: number,
  month: number,
): BusanFestival[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const inMonth = festivals.filter(f => {
    for (let day = 1; day <= daysInMonth; day++) {
      if (festivalActiveOnDate(f, toIsoDate(year, month, day))) {
        return true;
      }
    }
    return false;
  });
  return sortFestivalsByStatus(inMonth);
}

export function festivalDaysInMonth(
  festivals: BusanFestival[],
  year: number,
  month: number,
): Set<number> {
  const days = new Set<number>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toIsoDate(year, month, day);
    if (festivalsOnDate(festivals, iso).length > 0) {
      days.add(day);
    }
  }
  return days;
}

export function festivalTagLabel(
  tag: BusanFestival['tag'],
  language: AppLanguage,
): string {
  const copy = getCopyForLanguage('festivalCalendar', language);
  return tag === 'FESTIVAL' ? copy.tagFestival : copy.tagExhibition;
}

export function festivalToHomeEvent(festival: BusanFestival): MockEvent {
  return {
    id: festival.id,
    tag: festival.tag,
    titleKo: festival.titleKo,
    titleEn: festival.titleEn,
    titleJa: festival.titleJa,
    titleZh: festival.titleZh,
    locationKo: festival.locationKo,
    locationEn: festival.locationEn,
    locationJa: festival.locationJa,
    locationZh: festival.locationZh,
    dateKo: festivalPeriodLabel(festival, 'ko'),
    dateEn: festivalPeriodLabel(festival, 'en'),
    dateJa: festivalPeriodLabel(festival, 'ja'),
    dateZh: festivalPeriodLabel(festival, 'zh'),
    imageColor: festival.imageColor,
    imageIcon: festival.imageIcon,
    imageUri: festival.imageUri || undefined,
  };
}

export function festivalTitle(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.titleKo;
  if (language === 'ja') return festival.titleJa;
  if (language === 'zh') return festival.titleZh;
  return festival.titleEn;
}

export function festivalLocation(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.locationKo;
  if (language === 'ja') return festival.locationJa;
  if (language === 'zh') return festival.locationZh;
  return festival.locationEn;
}

export function festivalAddress(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.addressKo;
  if (language === 'ja') return festival.addressJa;
  if (language === 'zh') return festival.addressZh;
  return festival.addressEn;
}

export function festivalSummary(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.summaryKo;
  if (language === 'ja') return festival.summaryJa;
  if (language === 'zh') return festival.summaryZh;
  return festival.summaryEn;
}

export function festivalDescription(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.descriptionKo;
  if (language === 'ja') return festival.descriptionJa;
  if (language === 'zh') return festival.descriptionZh;
  return festival.descriptionEn;
}

export function festivalHours(festival: BusanFestival, language: AppLanguage): string {
  if (language === 'ko') return festival.hoursKo;
  if (language === 'ja') return festival.hoursJa;
  if (language === 'zh') return festival.hoursZh;
  return festival.hoursEn;
}

export function festivalPeriodLabel(festival: BusanFestival, language: AppLanguage): string {
  const fmt = (iso: string) => {
    const d = parseIsoDate(iso);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return language === 'ko' ? `${m}.${day}` : `${m}/${day}`;
  };
  if (festival.recurringWeekday != null) {
    const weekDay = getCopyForLanguage('festivalCalendar', language).weekDays[festival.recurringWeekday];
    return language === 'ko'
      ? `매주 ${weekDay}요일`
      : language === 'ja'
        ? `毎週${weekDay}曜日`
        : language === 'zh'
          ? `每周${weekDay}`
          : `Every ${weekDay}`;
  }
  if (festival.startDate === festival.endDate) {
    return fmt(festival.startDate);
  }
  return `${fmt(festival.startDate)} - ${fmt(festival.endDate)}`;
}

export function formatSelectedDateLabel(dateIso: string, language: AppLanguage): string {
  const d = parseIsoDate(dateIso);
  const weekDay = getCopyForLanguage('festivalCalendar', language).weekDays[d.getDay()];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (language === 'ko') {
    return `${m}월 ${day}일 (${weekDay})`;
  }
  if (language === 'ja') {
    return `${m}月${day}日（${weekDay}）`;
  }
  if (language === 'zh') {
    return `${m}月${day}日（周${weekDay}）`;
  }
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${day} (${weekDay})`;
}

export function festivalToRouteItem(festival: BusanFestival, language: AppLanguage): RouteItem {
  return {
    itemId: festival.id,
    sequence: 0,
    placeId: festival.id,
    placeName: festivalTitle(festival, language),
    type: 'ATTRACTION',
    location: festival.location,
    isVisited: false,
  };
}
