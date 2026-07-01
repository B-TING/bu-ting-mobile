/** 한국관광공사 detailIntro2 숙박(contentTypeId=32) 필드 라벨·표시 규칙 */

const LODGING_TEXT_FIELDS: Record<string, string> = {
  roomcount: '객실 수',
  roomtype: '객실 유형',
  scalelodging: '규모',
  accomcountlodging: '수용 인원',
  chkcooking: '객실 내 취사',
  checkintime: '체크인',
  checkouttime: '체크아웃',
  parkinglodging: '주차',
  foodplace: '식음료장',
  reservationurl: '예약',
  uselodging: '이용 안내',
  subfacility: '부대시설',
};

/** 숙박 부대시설 여부 필드 — 값 1=있음, 0=미제공(숨김) */
const LODGING_AMENITY_FLAGS: Record<string, string> = {
  seminar: '세미나실',
  beverage: '식음료장(시설)',
  sports: '스포츠시설',
  sauna: '사우나실',
  beauty: '뷰티시설',
  karaoke: '노래방',
  barbecue: '바비큐장',
  campfire: '캠프파이어',
  bicycle: '자전거대여',
  fitness: '휘트니스센터',
  publicpc: '공용 PC실',
  publicbath: '공용 샤워실',
};

const LODGING_FIELD_ORDER = [
  'roomcount',
  'roomtype',
  'scalelodging',
  'accomcountlodging',
  'chkcooking',
  'checkintime',
  'checkouttime',
  'parkinglodging',
  'foodplace',
  'reservationurl',
  'uselodging',
  'subfacility',
  ...Object.keys(LODGING_AMENITY_FLAGS),
] as const;

const GENERAL_DETAIL_LABELS: Record<string, string> = {
  usetime: '이용 시간',
  restdate: '휴무일',
  parking: '주차',
  infocenter: '문의',
  expguide: '체험 안내',
  expagerange: '체험 연령',
  festivalgrade: '축제 등급',
  eventstartdate: '행사 시작',
  eventenddate: '행사 종료',
  playtime: '관람 소요',
  usetimefestival: '행사 시간',
  discountinfofestival: '할인 정보',
  spendtime: '소요 시간',
  heritage1: '세계문화유산',
  heritage2: '세계자연유산',
  heritage3: '세계기록유산',
  opendatefood: '개업일',
  restdatefood: '쉬는 날',
  packing: '포장',
  reservationfood: '예약',
  treatmenu: '대표 메뉴',
  lcnsno: '인허가 번호',
  firstmenu: '대표 메뉴',
  opentimefood: '영업 시간',
  scalefood: '규모',
  seat: '좌석',
  smoking: '흡연',
  parkingfood: '주차',
  chkbabycarriage: '유모차',
  chkcreditcard: '신용카드',
  chkpet: '반려동물',
};

/** 전화·문의 필드 — 상단 연락처 행에서 처리 */
const PHONE_DETAIL_KEYS = new Set(['infocenterlodging', 'infocenter']);

export type TourismInfoRow = { label: string; value: string };

function isTruthyFlag(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '1' || trimmed.toLowerCase() === 'y' || trimmed === '가능' || trimmed === '있음';
}

function shouldSkipRawValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '0';
}

function formatLodgingField(key: string, value: string): TourismInfoRow | null {
  if (PHONE_DETAIL_KEYS.has(key)) {
    return null;
  }

  const amenityLabel = LODGING_AMENITY_FLAGS[key];
  if (amenityLabel) {
    if (!isTruthyFlag(value)) {
      return null;
    }
    return { label: amenityLabel, value: '있음' };
  }

  const textLabel = LODGING_TEXT_FIELDS[key];
  if (textLabel) {
    if (shouldSkipRawValue(value)) {
      return null;
    }
    return { label: textLabel, value: value.trim() };
  }

  return null;
}

function formatGeneralField(key: string, value: string): TourismInfoRow | null {
  if (PHONE_DETAIL_KEYS.has(key) || shouldSkipRawValue(value)) {
    return null;
  }
  return {
    label: GENERAL_DETAIL_LABELS[key] ?? key,
    value: value.trim(),
  };
}

export function formatTourismInfoRows(
  details: Record<string, string> | undefined,
  contentTypeId: string,
): TourismInfoRow[] {
  if (!details) {
    return [];
  }

  const isLodging = contentTypeId === '32';
  const rows: TourismInfoRow[] = [];

  if (isLodging) {
    for (const key of LODGING_FIELD_ORDER) {
      const value = details[key];
      if (value == null) {
        continue;
      }
      const row = formatLodgingField(key, value);
      if (row) {
        rows.push(row);
      }
    }
    return rows;
  }

  for (const [key, value] of Object.entries(details)) {
    const row = formatGeneralField(key, value);
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}
