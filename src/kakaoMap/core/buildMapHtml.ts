import type { KakaoMapOverlay } from '../overlays/types';
import type { MapCamera } from './camera';

const KAKAO_MAP_OVERLAY_RUNTIME = `
window.kakaoMapOverlayRefs = [];

window.kakaoMarkerBackground = function (color, active) {
  var base = color || '#4285F4';
  if (active) {
    return 'linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), ' + base;
  }
  return base;
};

window.clearKakaoMapOverlays = function () {
  (window.kakaoMapOverlayRefs || []).forEach(function (item) {
    item.setMap(null);
  });
  window.kakaoMapOverlayRefs = [];
};

window.renderKakaoMapOverlays = function (overlays) {
  window.clearKakaoMapOverlays();
  if (!window.kakao || !window.kakaoMap || !Array.isArray(overlays)) {
    return false;
  }

  overlays.forEach(function (overlay) {
    if (overlay.kind === 'polygon' && overlay.paths && overlay.paths.length > 0) {
      var polygonPath = overlay.paths
        .map(function (ring) {
          return ring
            .map(function (point) {
              return new kakao.maps.LatLng(point.lat, point.lng);
            })
            .filter(function (latLng) {
              return latLng;
            });
        })
        .filter(function (ring) {
          return ring.length >= 3;
        });

      if (polygonPath.length === 0) {
        return;
      }

      var polygon = new kakao.maps.Polygon({
        path: polygonPath.length === 1 ? polygonPath[0] : polygonPath,
        strokeWeight: overlay.strokeWeight != null ? overlay.strokeWeight : 3,
        strokeColor: overlay.strokeColor || '#FFFFFF',
        strokeOpacity: overlay.strokeOpacity != null ? overlay.strokeOpacity : 1,
        fillColor: overlay.fillColor || '#38BDF8',
        fillOpacity: overlay.fillOpacity != null ? overlay.fillOpacity : 0.3,
        zIndex: overlay.zIndex != null ? overlay.zIndex : 0,
      });
      polygon.setMap(window.kakaoMap);
      window.kakaoMapOverlayRefs.push(polygon);
      return;
    }

    if (overlay.kind === 'polyline' && overlay.path && overlay.path.length >= 2) {
      var path = overlay.path.map(function (point) {
        return new kakao.maps.LatLng(point.lat, point.lng);
      });
      var polyline = new kakao.maps.Polyline({
        path: path,
        strokeWeight: overlay.strokeWeight || 4,
        strokeColor: overlay.strokeColor || '#0077B6',
        strokeOpacity: overlay.strokeOpacity != null ? overlay.strokeOpacity : 0.85,
        strokeStyle: 'solid',
        zIndex: overlay.zIndex || 1,
      });
      polyline.setMap(window.kakaoMap);
      window.kakaoMapOverlayRefs.push(polyline);
      return;
    }

    if (overlay.kind === 'numbered') {
      var size = overlay.size || 28;
      var markerEl = document.createElement('div');
      markerEl.style.cssText =
        'width:' +
        size +
        'px;height:' +
        size +
        'px;border-radius:50%;background:' +
        (overlay.color || '#0077B6') +
        ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:' +
        (size >= 30 ? 13 : 11) +
        'px;box-shadow:0 1px 4px rgba(0,0,0,0.25);opacity:' +
        (overlay.opacity != null ? overlay.opacity : 1) +
        ';';
      markerEl.textContent = String(overlay.order);

      var numberedOverlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(overlay.lat, overlay.lng),
        content: markerEl,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: overlay.zIndex || 5,
      });
      numberedOverlay.setMap(window.kakaoMap);
      window.kakaoMapOverlayRefs.push(numberedOverlay);
      return;
    }

    if (overlay.kind === 'rating') {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;';

      var pill = document.createElement('div');
      pill.style.cssText =
        'min-width:44px;padding:4px 8px;border-radius:999px;background:' +
        window.kakaoMarkerBackground(overlay.color, overlay.active) +
        ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;gap:2px;box-shadow:0 1px 4px rgba(0,0,0,0.25);';

      var star = document.createElement('span');
      star.style.cssText = 'color:#fff;font-size:10px;line-height:1;';
      star.textContent = '★';

      var ratingText = document.createElement('span');
      ratingText.style.cssText = 'color:#fff;font-size:11px;font-weight:700;line-height:1;';
      ratingText.textContent = overlay.rating || '—';

      pill.appendChild(star);
      pill.appendChild(ratingText);
      wrap.appendChild(pill);

      if (overlay.active && overlay.caption) {
        var caption = document.createElement('div');
        caption.style.cssText =
          'margin-top:4px;max-width:180px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.95);color:#1e293b;font-size:10px;font-weight:700;text-align:center;line-height:1.3;';
        caption.textContent = overlay.caption;
        wrap.appendChild(caption);
      }

      if (overlay.id) {
        pill.style.cursor = 'pointer';
        pill.addEventListener('click', function () {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'overlayPress', id: overlay.id }),
            );
          }
        });
      }

      var ratingOverlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(overlay.lat, overlay.lng),
        content: wrap,
        yAnchor: 1,
        xAnchor: 0.5,
        zIndex: overlay.active ? 10 : overlay.bookmarked ? 7 : 5,
      });
      ratingOverlay.setMap(window.kakaoMap);
      window.kakaoMapOverlayRefs.push(ratingOverlay);
      return;
    }

    if (overlay.kind === 'locker') {
      var lockerWrap = document.createElement('div');
      lockerWrap.style.cssText =
        'display:flex;flex-direction:column;align-items:center;max-width:128px;';

      var lockerPill = document.createElement('div');
      lockerPill.style.cssText =
        'min-width:44px;padding:4px 8px;border-radius:999px;background:' +
        window.kakaoMarkerBackground(overlay.color, overlay.active) +
        ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;gap:3px;box-shadow:0 1px 4px rgba(0,0,0,0.25);';

      var lockerIcon = document.createElement('span');
      lockerIcon.style.cssText = 'font-size:10px;line-height:1;';
      lockerIcon.textContent = overlay.bookmarked ? '📌' : '🧳';

      var lockerCount = document.createElement('span');
      lockerCount.style.cssText = 'color:#fff;font-size:11px;font-weight:700;line-height:1;';
      lockerCount.textContent = overlay.count || '0';

      lockerPill.appendChild(lockerIcon);
      lockerPill.appendChild(lockerCount);
      lockerWrap.appendChild(lockerPill);

      var lockerName = document.createElement('div');
      lockerName.style.cssText =
        'margin-top:3px;max-width:128px;padding:2px 5px;border-radius:4px;background:rgba(255,255,255,0.94);color:#1e293b;font-size:9px;font-weight:700;text-align:center;line-height:1.25;word-break:keep-all;';
      lockerName.textContent = overlay.stationName || '';
      lockerWrap.appendChild(lockerName);

      if (overlay.active && overlay.subtitle) {
        var lockerSubtitle = document.createElement('div');
        lockerSubtitle.style.cssText =
          'margin-top:2px;max-width:128px;padding:1px 4px;border-radius:3px;background:rgba(0,119,182,0.12);color:#0077B6;font-size:8px;font-weight:600;text-align:center;line-height:1.2;';
        lockerSubtitle.textContent = overlay.subtitle;
        lockerWrap.appendChild(lockerSubtitle);
      }

      if (overlay.id) {
        lockerPill.style.cursor = 'pointer';
        lockerPill.addEventListener('click', function () {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'overlayPress', id: overlay.id }),
            );
          }
        });
      }

      var lockerOverlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(overlay.lat, overlay.lng),
        content: lockerWrap,
        yAnchor: 1,
        xAnchor: 0.5,
        zIndex: overlay.active ? 10 : overlay.bookmarked ? 7 : 5,
      });
      lockerOverlay.setMap(window.kakaoMap);
      window.kakaoMapOverlayRefs.push(lockerOverlay);
    }
  });

  return true;
};
`;

export function buildKakaoMapHtml(appKey: string, camera: MapCamera): string {
  const lat = Number.isFinite(camera.lat) ? camera.lat : 35.1796;
  const lng = Number.isFinite(camera.lng) ? camera.lng : 129.0756;
  const level = Number.isFinite(camera.zoomLevel)
    ? Math.min(14, Math.max(1, Math.round(camera.zoomLevel)))
    : 5;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
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
      ${KAKAO_MAP_OVERLAY_RUNTIME}
      window.onload = function () {
        if (typeof kakao !== 'undefined' && kakao.maps) {
          var mapContainer = document.getElementById('map');
          var mapOption = {
            center: new kakao.maps.LatLng(${lat}, ${lng}),
            level: ${level},
            draggable: true,
            scrollwheel: true,
            disableDoubleClick: false,
            disableDoubleClickZoom: false,
          };
          window.kakaoMap = new kakao.maps.Map(mapContainer, mapOption);
          window.renderKakaoMapOverlays([]);
          kakao.maps.event.addListener(window.kakaoMap, 'dragend', function () {
            var center = window.kakaoMap.getCenter();
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: 'centerChange',
                  lat: center.getLat(),
                  lng: center.getLng(),
                }),
              );
            }
          });
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

export function buildKakaoMapOverlaysScript(overlays: KakaoMapOverlay[]): string {
  const payload = JSON.stringify(overlays);
  return `
    (function () {
      if (typeof window.renderKakaoMapOverlays === 'function') {
        window.renderKakaoMapOverlays(${payload});
        return true;
      }
      return false;
    })();
  `;
}
