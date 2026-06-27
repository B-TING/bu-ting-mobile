import {
  BUSAN_DISTRICT_LABEL_CENTERS,
  BUSAN_SVG_VIEWBOX,
  EVENT_ZONE_DISTRICT_IDS,
} from '../../constants/eventZone/busanMapPaths';
import { EVENT_ZONE_BY_ID } from '../../constants/eventZone/eventZone';
import type { EventZoneId } from '../../types/eventZone';

export type MapFocusRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const FULL_MAP_FOCUS: MapFocusRect = {
  x: 0,
  y: 0,
  width: BUSAN_SVG_VIEWBOX.width,
  height: BUSAN_SVG_VIEWBOX.height,
};

export function focusRectToViewBox(rect: MapFocusRect): string {
  return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`;
}

export function getZoneFocusRect(zoneId: EventZoneId): MapFocusRect {
  const zone = EVENT_ZONE_BY_ID[zoneId];
  const points: { x: number; y: number }[] = [];

  for (const districtId of EVENT_ZONE_DISTRICT_IDS[zoneId]) {
    const center = BUSAN_DISTRICT_LABEL_CENTERS[districtId];
    if (center) {
      points.push(center);
    }
  }

  for (const landmark of zone.landmarks) {
    points.push(landmark.mapPoint);
  }

  let minX = Math.min(...points.map(point => point.x));
  let maxX = Math.max(...points.map(point => point.x));
  let minY = Math.min(...points.map(point => point.y));
  let maxY = Math.max(...points.map(point => point.y));

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const padX = Math.max(56, spanX * 0.28);
  const padY = Math.max(56, spanY * 0.28);

  minX -= padX;
  maxX += padX;
  minY -= padY;
  maxY += padY;

  let width = maxX - minX;
  let height = maxY - minY;

  const minWidth = 240;
  const minHeight = 220;
  if (width < minWidth) {
    const extra = (minWidth - width) / 2;
    minX -= extra;
    width = minWidth;
  }
  if (height < minHeight) {
    const extra = (minHeight - height) / 2;
    minY -= extra;
    height = minHeight;
  }

  minX = Math.max(0, minX);
  minY = Math.max(0, minY);
  width = Math.min(BUSAN_SVG_VIEWBOX.width - minX, width);
  height = Math.min(BUSAN_SVG_VIEWBOX.height - minY, height);

  return { x: minX, y: minY, width, height };
}

export function resolveMapFocusRect(selectedZoneId: EventZoneId | null): MapFocusRect {
  if (!selectedZoneId) {
    return FULL_MAP_FOCUS;
  }
  return getZoneFocusRect(selectedZoneId);
}

export function interpolateFocusRect(
  from: MapFocusRect,
  to: MapFocusRect,
  progress: number,
): MapFocusRect {
  const t = Math.max(0, Math.min(1, progress));
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  };
}
