/** 한국관광공사 detailIntro2 필드 라벨·표시 규칙 */

import {
  FESTIVAL_DETAIL_FIELD_ORDER,
  tourismDetailLabel,
} from '../../constants/places/tourismDetailLabels';
import type { AppLanguage } from '../../types/user';

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

const FESTIVAL_DATE_KEYS = new Set(['eventstartdate', 'eventenddate']);

/** 전화·문의 필드 — 상단 연락처 행에서 처리 */
const PHONE_DETAIL_KEYS = new Set(['infocenterlodging', 'infocenter', 'sponsor1tel', 'sponsor2tel']);

export type TourismInfoRow = { key: string; label: string; value: string };

function isTruthyFlag(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '1' || trimmed.toLowerCase() === 'y' || trimmed === '가능' || trimmed === '있음';
}

function shouldSkipRawValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '0';
}

function formatYyyymmddValue(value: string): string {
  const trimmed = value.trim();
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}.${trimmed.slice(4, 6)}.${trimmed.slice(6, 8)}`;
  }
  return trimmed;
}

function formatFieldValue(key: string, value: string): string {
  const normalized = key.toLowerCase();
  if (FESTIVAL_DATE_KEYS.has(normalized)) {
    return formatYyyymmddValue(value);
  }
  return value.trim();
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
    return { key, label: amenityLabel, value: '있음' };
  }

  const textLabel = LODGING_TEXT_FIELDS[key];
  if (textLabel) {
    if (shouldSkipRawValue(value)) {
      return null;
    }
    return { key, label: textLabel, value: value.trim() };
  }

  return null;
}

function formatGeneralField(
  key: string,
  value: string,
  language: AppLanguage,
): TourismInfoRow | null {
  if (PHONE_DETAIL_KEYS.has(key) || shouldSkipRawValue(value)) {
    return null;
  }
  return {
    key,
    label: tourismDetailLabel(key, language),
    value: formatFieldValue(key, value),
  };
}

function formatFestivalField(
  key: string,
  value: string,
  language: AppLanguage,
): TourismInfoRow | null {
  if (PHONE_DETAIL_KEYS.has(key) || shouldSkipRawValue(value)) {
    return null;
  }
  return {
    key,
    label: tourismDetailLabel(key, language),
    value: formatFieldValue(key, value),
  };
}

export function formatTourismInfoRows(
  details: Record<string, string> | undefined,
  contentTypeId: string,
  language: AppLanguage = 'ko',
): TourismInfoRow[] {
  if (!details) {
    return [];
  }

  if (contentTypeId === '32') {
    const rows: TourismInfoRow[] = [];
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

  if (contentTypeId === '15') {
    const rows: TourismInfoRow[] = [];
    for (const key of FESTIVAL_DETAIL_FIELD_ORDER) {
      const value = details[key];
      if (value == null) {
        continue;
      }
      const row = formatFestivalField(key, value, language);
      if (row) {
        rows.push(row);
      }
    }
    return rows;
  }

  const rows: TourismInfoRow[] = [];
  for (const [key, value] of Object.entries(details)) {
    const row = formatGeneralField(key, value, language);
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}
