import type { MapCamera } from './mapRegion';

export function buildKakaoMapHtml(appKey: string, camera: MapCamera): string {
  const lat = Number.isFinite(camera.lat) ? camera.lat : 35.1796;
  const lng = Number.isFinite(camera.lng) ? camera.lng : 129.0756;
  const level = Number.isFinite(camera.zoomLevel)
    ? Math.min(14, Math.max(1, Math.round(camera.zoomLevel)))
    : 5;

  // https://bori-note.tistory.com/70 — WebView + Kakao JS SDK (window.onload)
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}"></script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
      }
      #map {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      window.onload = function () {
        if (typeof kakao !== 'undefined' && kakao.maps) {
          var mapContainer = document.getElementById('map');
          var mapOption = {
            center: new kakao.maps.LatLng(${lat}, ${lng}),
            level: ${level},
          };
          window.kakaoMap = new kakao.maps.Map(mapContainer, mapOption);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          }
        } else if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'error',
              message: 'Kakao Maps SDK를 불러오지 못했습니다.',
            }),
          );
        }
      };
    </script>
  </body>
</html>`;
}

export function buildKakaoMapMoveScript(camera: MapCamera): string {
  const lat = Number.isFinite(camera.lat) ? camera.lat : 35.1796;
  const lng = Number.isFinite(camera.lng) ? camera.lng : 129.0756;
  const level = Number.isFinite(camera.zoomLevel)
    ? Math.min(14, Math.max(1, Math.round(camera.zoomLevel)))
    : 5;

  return `
    (function () {
      if (!window.kakao || !window.kakaoMap) return true;
      var moveLatLng = new window.kakao.maps.LatLng(${lat}, ${lng});
      window.kakaoMap.setCenter(moveLatLng);
      window.kakaoMap.setLevel(${level});
      return true;
    })();
  `;
}
