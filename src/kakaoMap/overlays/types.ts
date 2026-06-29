export type KakaoMapNumberedMarkerOverlay = {
  kind: 'numbered';
  id: string;
  lat: number;
  lng: number;
  order: number;
  color: string;
  opacity?: number;
  size?: number;
  zIndex?: number;
};

export type KakaoMapRatingMarkerOverlay = {
  kind: 'rating';
  id: string;
  lat: number;
  lng: number;
  rating: string;
  color: string;
  active?: boolean;
  bookmarked?: boolean;
  caption?: string;
};

export type KakaoMapLockerMarkerOverlay = {
  kind: 'locker';
  id: string;
  lat: number;
  lng: number;
  count: string;
  stationName: string;
  color: string;
  active?: boolean;
  bookmarked?: boolean;
  subtitle?: string;
};

export type KakaoMapPolylineOverlay = {
  kind: 'polyline';
  id: string;
  path: { lat: number; lng: number }[];
  strokeColor: string;
  strokeOpacity?: number;
  strokeWeight: number;
  zIndex?: number;
};

export type KakaoMapPolygonOverlay = {
  kind: 'polygon';
  id: string;
  paths: { lat: number; lng: number }[][];
  fillColor: string;
  fillOpacity?: number;
  strokeColor: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  zIndex?: number;
};

export type KakaoMapOverlay =
  | KakaoMapNumberedMarkerOverlay
  | KakaoMapRatingMarkerOverlay
  | KakaoMapLockerMarkerOverlay
  | KakaoMapPolylineOverlay
  | KakaoMapPolygonOverlay;
