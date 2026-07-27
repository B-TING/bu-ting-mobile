#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'assets', 'map', 'busan.svg');
const outPath = path.join(__dirname, '..', 'src', 'constants', 'eventZone', 'busanMapPaths.ts');

const svg = fs.readFileSync(svgPath, 'utf8');
const labelById = Object.fromEntries(
  [...svg.matchAll(/<text id="L(CD\d+)"[^>]* x="([^"]*)" y="([^"]*)">([^<]+)<\/text>/g)].map(
    m => [m[1], { labelKo: m[4], x: Number(m[2]), y: Number(m[3]) }],
  ),
);

const districts = [...svg.matchAll(/<path id="(CD\d+)" class="OUTLINE" d="([^"]+)"/g)].map(
  ([, id, d]) => {
    const label = labelById[id];
    return {
      id,
      labelKo: label?.labelKo ?? id,
      d,
      labelX: label?.x ?? null,
      labelY: label?.y ?? null,
    };
  },
);

const labelCenters = Object.fromEntries(
  districts
    .filter(district => district.labelX != null && district.labelY != null)
    .map(district => [district.id, { x: district.labelX, y: district.labelY }]),
);

const districtPaths = districts.map(({ labelX, labelY, ...rest }) => rest);

const content = `/** Generated from assets/map/busan.svg — do not edit manually. */
import type { EventZoneId } from '../../types/eventZone';

export const BUSAN_SVG_VIEWBOX = { width: 800, height: 754 } as const;

export type BusanDistrictPath = {
  id: string;
  labelKo: string;
  d: string;
};

export const BUSAN_DISTRICT_PATHS: BusanDistrictPath[] = ${JSON.stringify(districtPaths, null, 2)};

/** SVG text 라벨 위치 — GPS → 구역 매핑용 */
export const BUSAN_DISTRICT_LABEL_CENTERS: Record<string, { x: number; y: number }> = ${JSON.stringify(labelCenters, null, 2)};

export const EVENT_ZONE_DISTRICT_IDS: Record<EventZoneId, string[]> = {
  HAEUNDAE_GIJANG: ['CD26350', 'CD26710'],
  SUYEONG_NAMGU: ['CD26500', 'CD26290'],
  CENTRAL_NORTH: ['CD26410', 'CD26260', 'CD26470', 'CD26230'],
  OLD_DOWNTOWN: ['CD26140', 'CD26110', 'CD26170'],
  YEONGDO: ['CD26200'],
  WESTERN_BUSAN: ['CD26440', 'CD26530', 'CD26380', 'CD26320'],
};

export const BUSAN_DISTRICT_BY_ID: Record<string, BusanDistrictPath> = Object.fromEntries(
  BUSAN_DISTRICT_PATHS.map(district => [district.id, district]),
);
`;

fs.writeFileSync(outPath, content, 'utf8');
console.log(`[Bu-Ting] Wrote ${path.relative(process.cwd(), outPath)} (${districts.length} districts)`);
