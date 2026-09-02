# 일정 구간 외부 지도 길찾기

- Issue: [#167](https://github.com/B-TING/BU-TING-Mobile/issues/167)
- Status: 구현 중

## 배경

일정 탭에서 구간별 경로와 소요 시간을 앱 안에서 직접 보여주려 했으나 routing API 연동 일정이 없다.
Google Maps / 카카오맵으로 넘겨 A->B 길찾기를 제공한다.

## Product 결정

| 항목 | 결정 |
|------|------|
| 기본 지도 | Google Maps 앱 -> Google Maps 웹 -> 카카오맵 앱 -> 카카오맵 웹 |
| 이동 수단 | walk / transit / drive (3종, 자전거 없음) |
| UX | 길찾기 탭 시 바로 실행 (앱 선택 시트 없음) |
| 구간 UI | 추정 소요시간/거리 제거, 이동 수단 라벨 + 길찾기 버튼만 |

## 데이터

```typescript
type LegDirectionsInput = {
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
  mode: TravelLegMode;
};
```

- `PlanScheduleTab`에서 인접 `RouteItem` 쌍으로 조립
- 좌표가 유효하지 않으면 길찾기 비활성 + 토스트

## URL / 폴백

| Provider | App | Web |
|----------|-----|-----|
| Google | `comgooglemaps://?saddr=&daddr=&directionsmode=` | `https://www.google.com/maps/dir/?api=1&origin=&destination=&travelmode=` |
| Kakao | `kakaomap://route?sp=&ep=&by=` | `https://map.kakao.com/link/route/...` |

Mode mapping:

- walk -> Google `walking`, Kakao `FOOT`
- drive -> Google `driving`, Kakao `CAR`
- transit -> Google `transit`, Kakao `PUBLICTRANSIT`

## 코드 앵커

- `src/utils/map/mapDirections.ts` - URL 빌더, `openLegDirections`
- `src/components/plan/schedule/TravelLegRow.tsx` - 길찾기 CTA
- `src/components/plan/tabs/PlanScheduleTab.tsx` - from/to 조립

## Phase 2 (별도)

- Kakao Directions API로 in-app polyline (`scheduleMapRoutePaths.ts`)
- API `routeToNext`와 `legMode` 동기화
- 네이버맵 지원
