import { BUSAN_SVG_VIEWBOX } from '../../constants/eventZone/busanMapPaths';
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

/** 랜드마크 무게중심이 화면 좌상단(헤더 아래)에 오도록 하는 앵커 */
const LANDMARK_SCREEN_ANCHOR_X = 0.30;
const LANDMARK_SCREEN_ANCHOR_Y = 0.27;

const MIN_FOCUS_ZOOM_WIDTH = 260;
const MIN_FOCUS_ZOOM_HEIGHT = 240;

export function focusRectToViewBox(rect: MapFocusRect): string {
  return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`;
}

export function getLandmarkCentroid(zoneId: EventZoneId): { x: number; y: number } {
  const zone = EVENT_ZONE_BY_ID[zoneId];
  const points = zone.landmarks.map(landmark => landmark.mapPoint);

  if (points.length === 0) {
    return {
      x: BUSAN_SVG_VIEWBOX.width / 2,
      y: BUSAN_SVG_VIEWBOX.height / 2,
    };
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

export function getZoneFocusRect(
  zoneId: EventZoneId,
  options?: { layoutForPanel?: boolean },
): MapFocusRect {
  const zone = EVENT_ZONE_BY_ID[zoneId];
  const landmarkPoints = zone.landmarks.map(landmark => landmark.mapPoint);

  if (landmarkPoints.length === 0) {
    return FULL_MAP_FOCUS;
  }

  const centroid = getLandmarkCentroid(zoneId);

  let minX = Math.min(...landmarkPoints.map(point => point.x));
  let maxX = Math.max(...landmarkPoints.map(point => point.x));
  let minY = Math.min(...landmarkPoints.map(point => point.y));
  let maxY = Math.max(...landmarkPoints.map(point => point.y));

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const padX = Math.max(80, spanX * 0.65);
  const padY = Math.max(80, spanY * 0.65);

  let width = Math.max(MIN_FOCUS_ZOOM_WIDTH, maxX - minX + padX * 2);
  let height = Math.max(MIN_FOCUS_ZOOM_HEIGHT, maxY - minY + padY * 2);

  let x: number;
  let y: number;

  if (options?.layoutForPanel) {
    x = centroid.x - LANDMARK_SCREEN_ANCHOR_X * width;
    y = centroid.y - LANDMARK_SCREEN_ANCHOR_Y * height;
  } else {
    x = centroid.x - width / 2;
    y = centroid.y - height / 2;
  }

  return clampFocusRect({ x, y, width, height });
}

const MIN_FOCUS_WIDTH = 120;
const MIN_FOCUS_HEIGHT = 110;

export function clampFocusRect(rect: MapFocusRect): MapFocusRect {
  let { x, y, width, height } = rect;

  width = Math.max(MIN_FOCUS_WIDTH, Math.min(BUSAN_SVG_VIEWBOX.width, width));
  height = Math.max(MIN_FOCUS_HEIGHT, Math.min(BUSAN_SVG_VIEWBOX.height, height));

  x = Math.max(0, Math.min(BUSAN_SVG_VIEWBOX.width - width, x));
  y = Math.max(0, Math.min(BUSAN_SVG_VIEWBOX.height - height, y));

  return { x, y, width, height };
}

export function resolveMapFocusRect(
  selectedZoneId: EventZoneId | null,
  options?: { layoutForPanel?: boolean },
): MapFocusRect {
  if (!selectedZoneId) {
    return FULL_MAP_FOCUS;
  }

  return getZoneFocusRect(selectedZoneId, {
    layoutForPanel: options?.layoutForPanel,
  });
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
