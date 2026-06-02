import type { AppLanguage } from '../types/user';

export const MAIN_HOME_COPY: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    myPlan: string;
    travelInfo: string;
    travelJournal: string;
    tourismProducts: string;
    festivals: string;
    calendar: string;
    weather: string;
    dday: (n: number) => string;
    ddayToday: string;
    ddayPast: string;
    noPlanHint: string;
    journalSub: string;
    productsSub: string;
    festivalsSub: string;
    weatherToday: string;
    mapTapHint: string;
  }
> = {
  ko: {
    title: '부팅',
    subtitle: '부산 여행 허브',
    myPlan: '내 여행 일정',
    travelInfo: '여행 정보',
    travelJournal: '여행기',
    tourismProducts: '관광 상품',
    festivals: '축제 정보',
    calendar: '여행 캘린더',
    weather: '부산 날씨',
    dday: n => (n > 0 ? `D-${n}` : n === 0 ? 'D-Day' : `D+${Math.abs(n)}`),
    ddayToday: '오늘 출발!',
    ddayPast: '여행 종료',
    noPlanHint: '진행 중인 일정이 없습니다',
    journalSub: '방문 기록과 팁을 남겨 보세요',
    productsSub: '패스·투어·체험 상품',
    festivalsSub: '이번 달 부산 축제',
    weatherToday: '맑음 · 24°C · 미세먼지 좋음',
    mapTapHint: '탭하여 크게 보기',
  },
  en: {
    title: 'Bu-Ting',
    subtitle: 'Busan travel hub',
    myPlan: 'My itinerary',
    travelInfo: 'Trip info',
    travelJournal: 'Travel journal',
    tourismProducts: 'Tour products',
    festivals: 'Festivals',
    calendar: 'Trip calendar',
    weather: 'Busan weather',
    dday: n => (n > 0 ? `D-${n}` : n === 0 ? 'D-Day' : `D+${Math.abs(n)}`),
    ddayToday: 'Trip starts today!',
    ddayPast: 'Trip ended',
    noPlanHint: 'No active itinerary',
    journalSub: 'Save visits and tips',
    productsSub: 'Passes, tours & experiences',
    festivalsSub: 'Festivals this month',
    weatherToday: 'Sunny · 24°C · Good air',
    mapTapHint: 'Tap to expand map',
  },
  ja: {
    title: 'Bu-Ting',
    subtitle: '釜山トラベルハブ',
    myPlan: '私の行程',
    travelInfo: '旅行情報',
    travelJournal: '旅行記',
    tourismProducts: '観光商品',
    festivals: '祭り情報',
    calendar: '旅行カレンダー',
    weather: '釜山の天気',
    dday: n => (n > 0 ? `D-${n}` : n === 0 ? 'D-Day' : `D+${Math.abs(n)}`),
    ddayToday: '今日出発！',
    ddayPast: '旅行終了',
    noPlanHint: '進行中の行程がありません',
    journalSub: '訪問記録とヒント',
    productsSub: 'パス・ツアー・体験',
    festivalsSub: '今月の釜山祭り',
    weatherToday: '晴れ · 24°C',
    mapTapHint: 'タップで拡大',
  },
  zh: {
    title: 'Bu-Ting',
    subtitle: '釜山旅行中心',
    myPlan: '我的行程',
    travelInfo: '旅行信息',
    travelJournal: '旅行记',
    tourismProducts: '旅游产品',
    festivals: '节庆信息',
    calendar: '旅行日历',
    weather: '釜山天气',
    dday: n => (n > 0 ? `D-${n}` : n === 0 ? 'D-Day' : `D+${Math.abs(n)}`),
    ddayToday: '今天出发！',
    ddayPast: '旅行已结束',
    noPlanHint: '暂无进行中的行程',
    journalSub: '记录到访与心得',
    productsSub: '通票·游览·体验',
    festivalsSub: '本月釜山节庆',
    weatherToday: '晴 · 24°C · 空气良好',
    mapTapHint: '点击放大地图',
  },
};

export const MOCK_FESTIVALS = [
  { ko: '부산 바다 축제', en: 'Busan Sea Festival', date: '6/7 - 6/9' },
  { ko: '해운대 모래축제', en: 'Haeundae Sand Festival', date: '6/14 - 6/16' },
];

export const MOCK_PRODUCTS = [
  { ko: '부산 시티투어 버스', en: 'City tour bus', price: '₩15,000' },
  { ko: '해운대 요트 체험', en: 'Yacht experience', price: '₩45,000' },
];

export function calcTripDday(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / 86400000);
}
