import type { AppLanguage } from '../types/user';

export const LUGGAGE_STORAGE_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    mapTitle: string;
    mapSubtitle: string;
    summary: (stations: number, lockers: number) => string;
    loading: string;
    empty: string;
    emptySub: string;
    dataHint: string;
    stationLabel: string;
    locationDetailLabel: string;
    totalLockers: string;
    sizeSmall: string;
    sizeMedium: string;
    sizeLarge: string;
    sizeExtraLarge: string;
    companyLabel: string;
    costLabel: string;
    lockerTableType: string;
    lockerTableCount: string;
    lockerTablePrice: string;
    feeDefault: string;
    feeWeekday: string;
    feeWeekend: string;
    feePer3Hours: string;
    feeCurrency: string;
    close: string;
    selectStationHint: string;
    lineLabel: (line: number) => string;
    pinA11y: (name: string, count: number) => string;
    bookmark: string;
    unbookmark: string;
    bookmarkedPinA11y: (name: string, count: number) => string;
  }
> = {
  ko: {
    screenTitle: '짐 보관소',
    mapTitle: '네이버 지도 (준비 중)',
    mapSubtitle: '지하철역 물품보관함 위치',
    summary: (stations, lockers) => `${stations}개 역 · 보관함 ${lockers}개`,
    loading: '역시설물 정보를 불러오는 중…',
    empty: '물품보관함이 있는 역이 없어요',
    emptySub: '다른 지역을 확인해 보세요',
    dataHint: '부산 도시철도 물품보관함 공식 안내 데이터 기준',
    stationLabel: '역명',
    locationDetailLabel: '상세 위치',
    totalLockers: '총 보관함',
    sizeSmall: '소형',
    sizeMedium: '중형',
    sizeLarge: '대형',
    sizeExtraLarge: '특대형',
    companyLabel: '운영',
    costLabel: '이용 요금',
    lockerTableType: '종류',
    lockerTableCount: '개수',
    lockerTablePrice: '가격',
    feeDefault: '기본 요금',
    feeWeekday: '평일',
    feeWeekend: '주말',
    feePer3Hours: ' (3시간당)',
    feeCurrency: '원',
    close: '닫기',
    selectStationHint: '지도에서 역을 선택하면 상세 정보를 볼 수 있어요',
    lineLabel: line => `${line}호선`,
    pinA11y: (name, count) => `${name}역 물품보관함 ${count}개`,
    bookmark: '북마크',
    unbookmark: '북마크 해제',
    bookmarkedPinA11y: (name, count) => `북마크한 ${name}역 물품보관함 ${count}개`,
  },
  en: {
    screenTitle: 'Luggage storage',
    mapTitle: 'Naver Map (coming soon)',
    mapSubtitle: 'Subway locker locations',
    summary: (stations, lockers) => `${stations} stations · ${lockers} lockers`,
    loading: 'Loading station facilities…',
    empty: 'No stations with lockers found',
    emptySub: 'Try another area',
    dataHint: 'Based on official Busan Metro locker information',
    stationLabel: 'Station',
    locationDetailLabel: 'Location',
    totalLockers: 'Total lockers',
    sizeSmall: 'Small',
    sizeMedium: 'Medium',
    sizeLarge: 'Large',
    sizeExtraLarge: 'Extra large',
    companyLabel: 'Operator',
    costLabel: 'Fees',
    lockerTableType: 'Type',
    lockerTableCount: 'Qty',
    lockerTablePrice: 'Price',
    feeDefault: 'Standard',
    feeWeekday: 'Weekday',
    feeWeekend: 'Weekend',
    feePer3Hours: ' (per 3 hours)',
    feeCurrency: ' KRW',
    close: 'Close',
    selectStationHint: 'Tap a station on the map to see details',
    lineLabel: line => `Line ${line}`,
    pinA11y: (name, count) => `${name} station, ${count} lockers`,
    bookmark: 'Bookmark',
    unbookmark: 'Remove bookmark',
    bookmarkedPinA11y: (name, count) => `Bookmarked ${name} station, ${count} lockers`,
  },
  ja: {
    screenTitle: '荷物預かり',
    mapTitle: 'NAVERマップ（準備中）',
    mapSubtitle: '地下鉄駅ロッカー位置',
    summary: (stations, lockers) => `${stations}駅 · ロッカー${lockers}個`,
    loading: '駅施設情報を読み込み中…',
    empty: 'ロッカーのある駅がありません',
    emptySub: '別のエリアを確認してください',
    dataHint: '釜山都市鉄道の公式ロッカー案内データに基づく',
    stationLabel: '駅名',
    locationDetailLabel: '詳細位置',
    totalLockers: 'ロッカー合計',
    sizeSmall: '小型',
    sizeMedium: '中型',
    sizeLarge: '大型',
    sizeExtraLarge: '特大',
    companyLabel: '運営',
    costLabel: '利用料金',
    lockerTableType: '種類',
    lockerTableCount: '個数',
    lockerTablePrice: '料金',
    feeDefault: '基本料金',
    feeWeekday: '平日',
    feeWeekend: '週末',
    feePer3Hours: '（3時間あたり）',
    feeCurrency: 'ウォン',
    close: '閉じる',
    selectStationHint: '地図の駅をタップすると詳細が表示されます',
    lineLabel: line => `${line}号線`,
    pinA11y: (name, count) => `${name}駅 ロッカー${count}個`,
    bookmark: 'ブックマーク',
    unbookmark: 'ブックマーク解除',
    bookmarkedPinA11y: (name, count) => `ブックマーク済み ${name}駅 ロッカー${count}個`,
  },
  zh: {
    screenTitle: '行李寄存',
    mapTitle: 'Naver 地图（即将上线）',
    mapSubtitle: '地铁站寄存柜位置',
    summary: (stations, lockers) => `${stations} 个站 · ${lockers} 个柜子`,
    loading: '正在加载车站设施信息…',
    empty: '没有找到有寄存柜的车站',
    emptySub: '请尝试查看其他区域',
    dataHint: '基于釜山都市铁路官方寄存柜指南数据',
    stationLabel: '站名',
    locationDetailLabel: '详细位置',
    totalLockers: '柜子总数',
    sizeSmall: '小型',
    sizeMedium: '中型',
    sizeLarge: '大型',
    sizeExtraLarge: '特大型',
    companyLabel: '运营方',
    costLabel: '使用费用',
    lockerTableType: '种类',
    lockerTableCount: '数量',
    lockerTablePrice: '价格',
    feeDefault: '基本费用',
    feeWeekday: '平日',
    feeWeekend: '周末',
    feePer3Hours: '（每3小时）',
    feeCurrency: '韩元',
    close: '关闭',
    selectStationHint: '点击地图上的车站查看详情',
    lineLabel: line => `${line}号线`,
    pinA11y: (name, count) => `${name}站 寄存柜 ${count} 个`,
    bookmark: '收藏',
    unbookmark: '取消收藏',
    bookmarkedPinA11y: (name, count) => `已收藏 ${name}站 寄存柜 ${count} 个`,
  },
};
