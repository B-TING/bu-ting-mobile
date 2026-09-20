/** 한국관광공사 detailIntro2 필드 라벨·표시 규칙 */

import {
  DETAIL_FIELD_ORDER_BY_CONTENT_TYPE,
  LODGING_AMENITY_FLAG_KEYS,
  isTourismCheckFlagKey,
  tourismAvailabilityValue,
  tourismDetailLabel,
} from '../../constants/places/tourismDetailLabels';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { AppLanguage } from '../../types/user';

const FESTIVAL_DATE_KEYS = new Set(['eventstartdate', 'eventenddate']);

/** 전화·문의 필드 — 상단 연락처 행에서 처리하거나 중복 억제 */
const PHONE_DETAIL_KEYS = new Set([
  'infocenter',
  'infocenterculture',
  'infocenterlodging',
  'infocenterleports',
  'infocentershopping',
  'infocenterfood',
  'infocentertourcourse',
  'sponsor1tel',
  'sponsor2tel',
]);

const META_SKIP_KEYS = new Set(['contentid', 'contenttypeid']);

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

function formatDetailField(
  key: string,
  value: string,
  language: AppLanguage,
  contentTypeId: string,
): TourismInfoRow | null {
  const normalized = key.toLowerCase();
  if (META_SKIP_KEYS.has(normalized) || PHONE_DETAIL_KEYS.has(normalized)) {
    return null;
  }

  if (shouldSkipRawValue(value) && !isTourismCheckFlagKey(normalized)) {
    return null;
  }

  if (isTourismCheckFlagKey(normalized)) {
    if (!isTruthyFlag(value)) {
      return null;
    }
    return {
      key: normalized,
      label: tourismDetailLabel(normalized, language),
      value: tourismAvailabilityValue(language),
    };
  }

  // 숙박 부대시설 플래그는 위에서 처리. 그 외 텍스트.
  if (
    contentTypeId === PLACE_CONTENT_TYPE.accommodation &&
    LODGING_AMENITY_FLAG_KEYS.has(normalized)
  ) {
    return null;
  }

  return {
    key: normalized,
    label: tourismDetailLabel(normalized, language),
    value: formatFieldValue(normalized, value),
  };
}

function orderedKeysForType(
  contentTypeId: string,
  details: Record<string, string>,
): string[] {
  const preferred = DETAIL_FIELD_ORDER_BY_CONTENT_TYPE[contentTypeId];
  const detailKeys = Object.keys(details);
  if (!preferred) {
    return detailKeys;
  }

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const key of preferred) {
    if (details[key] != null || details[key.toLowerCase()] != null) {
      const actual =
        details[key] != null
          ? key
          : detailKeys.find(k => k.toLowerCase() === key.toLowerCase()) ?? key;
      ordered.push(actual);
      seen.add(actual.toLowerCase());
    }
  }
  for (const key of detailKeys) {
    if (!seen.has(key.toLowerCase())) {
      ordered.push(key);
    }
  }
  return ordered;
}

export function formatTourismInfoRows(
  details: Record<string, string> | undefined,
  contentTypeId: string,
  language: AppLanguage = 'ko',
): TourismInfoRow[] {
  if (!details) {
    return [];
  }

  const typeId = String(contentTypeId).trim();
  const rows: TourismInfoRow[] = [];
  for (const key of orderedKeysForType(typeId, details)) {
    const value = details[key];
    if (value == null) {
      continue;
    }
    const row = formatDetailField(key, value, language, typeId);
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}
