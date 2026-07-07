/**
 * KakaoMap 모듈 — 지도 표시, 마커·경로 오버레이, 장소 데이터
 *
 * core/     WebView 지도 셸, HTML 빌더, 카메라
 * overlays/ 마커·폴리라인 타입 및 빌더
 * views/    RouteMapView, ScheduleMapView
 * places/   지도 연동 장소 목록·상세 조회
 * hooks/    일정 지도 오버레이 상태
 */

// --- 지도 표시 ---
export { KakaoMapShell, type KakaoMapShellSize } from './core/KakaoMapShell';
export {
  buildKakaoMapHtml,
  buildKakaoMapMoveScript,
  buildKakaoMapOverlaysScript,
} from './core/buildMapHtml';
export {
  cameraFromPoints,
  regionFromPoints,
  toMapCoordinate,
  kmSpanToZoomLevel,
  SCHEDULE_DAY_FOCUS_KM_SPAN,
  SCHEDULE_DAY_FOCUS_ZOOM_LEVEL,
  type MapCamera,
  type MapPoint,
  type MapRegion,
} from './core/camera';

// --- 마커·경로 ---
export type {
  KakaoMapOverlay,
  KakaoMapNumberedMarkerOverlay,
  KakaoMapRatingMarkerOverlay,
  KakaoMapLockerMarkerOverlay,
  KakaoMapPolylineOverlay,
  KakaoMapPolygonOverlay,
} from './overlays/types';
export {
  kakaoOverlaysFromSchedule,
  kakaoOverlaysFromRoutes,
  kakaoOverlaysFromPlaces,
  kakaoOverlaysFromLockerStations,
} from './overlays/builders';
export { kakaoOverlaysFromEventZones } from './overlays/zoneOverlays';
export {
  buildScheduleMapOverlays,
  filterValidCoordinates,
  type ScheduleMapLineOverlay,
  type ScheduleMapMarkerOverlay,
  type LatLng,
} from './overlays/scheduleOverlays';
export {
  buildScheduleMapDays,
  buildScheduleMapRevisionKey,
  buildScheduleDayRevisionKey,
  collectScheduleMapPoints,
  type ScheduleMapDay,
} from './overlays/scheduleSnapshot';

// --- 뷰 ---
export { RouteMapView } from './views/RouteMapView';
export { ScheduleMapView } from './views/ScheduleMapView';

// --- 훅 ---
export { useScheduleMapOverlays } from './hooks/useScheduleMapOverlays';

// --- 설정 ---
export { KAKAO_MAP_JS_KEY } from './config';
