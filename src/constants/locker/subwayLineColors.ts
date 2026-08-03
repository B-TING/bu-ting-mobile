/** 부산 도시철도 노선 공식 색상 */
export const BUSAN_SUBWAY_LINE_COLORS: Record<number, string> = {
  1: '#F06A00',
  2: '#3CB44A',
  3: '#BB8930',
  4: '#2E8ED6',
};

/** 호선 정보 없을 때 / 미등록 노선 */
export const BUSAN_SUBWAY_LINE_COLOR_FALLBACK = '#64748B';

export function hasKnownSubwayLine(line: number | null | undefined): boolean {
  return (
    typeof line === 'number' &&
    Number.isFinite(line) &&
    line > 0 &&
    BUSAN_SUBWAY_LINE_COLORS[line] != null
  );
}

export function getSubwayLineColor(line: number | null | undefined): string {
  if (!hasKnownSubwayLine(line)) {
    return BUSAN_SUBWAY_LINE_COLOR_FALLBACK;
  }
  return BUSAN_SUBWAY_LINE_COLORS[line as number];
}

/** 배지/칩용 연한 배경 (약 14% opacity) */
export function getSubwayLineTint(line: number | null | undefined): string {
  const hex = getSubwayLineColor(line).replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.14)`;
}
