# BU-TING-Mobile

나만의 부산 여행 가이드 **부팅** 모바일 애플리케이션

## 기술 스택

- React Native 0.85.3
- React 19
- TypeScript
- [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS)
- [Zustand](https://zustand.docs.pmnd.rs/) (전역 상태 + AsyncStorage persist)
- ESLint + Prettier
- Jest

## 프로젝트 구조

```
.
├── src/
│   ├── components/  # UI (NativeWind)
│   ├── constants/   # 온보딩·언어 상수
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── stores/      # Zustand (useAppStore)
│   ├── types/
│   └── utils/
├── __tests__/       # Jest 테스트
├── .vscode/         # 에디터 설정 (저장 시 자동 포맷)
├── .eslintrc.js     # ESLint 설정
├── .prettierrc.js   # Prettier 설정
└── jest.config.js   # Jest 설정
```

## 사전 요구사항

- Node.js >= 22.11.0
- JDK 17+
- Android Studio (Android 개발)
- Xcode (iOS 개발, macOS)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Metro 번들러 실행

```bash
npm start -- --reset-cache
```

NativeWind 설정 변경 후에는 Metro 캐시 초기화가 필요할 수 있습니다.

#### `Unable to load script` / Metro 연결 안 됨

같은 Wi‑Fi여도 **`npm start`만으로는 폰이 PC Metro에 붙지 않는 경우가 많습니다.** `npm start`는 PC의 `localhost`만 엽니다.

| 연결 방식 | 터미널 1 (Metro) | 터미널 2 (앱) | 비고 |
|-----------|------------------|---------------|------|
| **USB** (권장) | `npm start` | `npm run android` | `adb reverse`가 자동 설정됨. `npm run connect:android`로 상태 확인 |
| **같은 Wi‑Fi** (무선) | `npm run start:lan` | `npm run android` | Dev Menu → **Debug server host**에 터미널에 출력된 `192.168.x.x:8081` 입력 후 Reload. Windows 방화벽에서 Node/8081 허용 |
| **다른 네트워크** | `npm run start:tunnel` | `REACT_NATIVE_PACKAGER_HOSTNAME` 설정 후 `npm run android` | ngrok |

포트 `8081`이 이미 사용 중이면(`EADDRINUSE`) Metro가 안 뜬 상태로 앱만 실행되어 이 오류가 납니다. 8081을 쓰는 `node` 프로세스를 종료한 뒤 Metro를 다시 켜세요.

#### localhost로 연결이 안 될 때

| 상황 | 명령 | 설명 |
|------|------|------|
| PC와 폰이 **같은 Wi‑Fi** | `npm run start:lan` | PC LAN IP로 Metro 노출 (`--host lan`) |
| **다른 네트워크** / USB만 | `npm run start:tunnel` | ngrok 터널 (Expo `--tunnel`과 유사) |

**터널 사용 순서**

1. 터미널 1: `npm run start:tunnel` (또는 `npm run start:tunnel -- --reset-cache`)
2. 출력된 `Packager` 호스트명 확인
3. 터미널 2 (앱 설치·실행):

```bash
# PowerShell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="출력된-ngrok-호스트"; npm run android
```

실기기에서 이미 앱이 켜져 있다면: **흔들기 → Dev Settings → Debug server host**에 위 호스트만 입력 후 Reload.

> 터널은 공식 `@ngrok/ngrok` SDK를 사용합니다. **ngrok Authtoken**(무료 가입)이 필수이며, API Key와 다릅니다.

**ngrok 토큰 등록 (최초 1회)**

1. [ngrok 대시보드](https://dashboard.ngrok.com/get-started/your-authtoken)에서 토큰 복사
2. 프로젝트 루트에서:

```bash
npm run ngrok:auth -- 여기에_토큰_붙여넣기
```

또는 PowerShell:

```powershell
$env:NGROK_AUTHTOKEN="여기에_토큰"
npm run start:tunnel
```

`env.local.example`을 `.env.local`로 복사해 `NGROK_AUTHTOKEN=`에 넣어도 됩니다.  
또는 `.env.example` → `.env` 로 복사해 한 파일에 ngrok·Google 키를 함께 관리할 수 있습니다.

#### Google Places API (TourAPI ↔ place_id 연동)

공공데이터 장소명·좌표로 Google `place_id`를 역추적할 때 사용합니다. **API 키는 `.env`에만 두고 git에 올리지 마세요.**

```bash
# 1) 템플릿 복사
copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux

# 2) .env 에 GOOGLE_PLACES_API_KEY= 발급 키 입력

# 3) Find Place 테스트 (장소명, 위도, 경도)
npm run places:resolve -- "해동용궁사" 35.1885 129.2233
```

| 변수 | 설명 |
|------|------|
| `GOOGLE_PLACES_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) Places API 키 |
| `GOOGLE_PLACES_FIND_RADIUS_M` | Find Place `locationbias` 반경(m). 기본 `150` (50~200 권장) |
| `GOOGLE_PLACES_LANGUAGE` | 응답 언어. 기본 `ko` |

> Find Place·Place Details 호출은 **백엔드**에서 수행하고, 모바일 앱에는 `place_id`와 캐시된 상세만 내려주는 구성을 권장합니다. Node 스크립트(`scripts/resolve-place-id.cjs`)는 배치 매핑·로컬 검증용입니다.

#### Google Maps (앱 내 지도)

숙소·짐 보관소·여행 일정 등 **모든 지도**는 `react-native-maps` + Google Maps SDK를 사용합니다.

```bash
# 1) .env 에 Maps SDK 키 (없으면 GOOGLE_PLACES_API_KEY 사용)
GOOGLE_MAPS_API_KEY=발급키

# 2) 네이티브 설정 동기화 (npm install / npm run android 시 자동)
npm run maps:sync
```

| 변수 | 설명 |
|------|------|
| `GOOGLE_MAPS_API_KEY` | [Maps SDK for Android / iOS](https://console.cloud.google.com/google/maps-apis) 키 |
| `GOOGLE_PLACES_API_KEY` | `GOOGLE_MAPS_API_KEY` 미설정 시 fallback |

Cloud Console에서 **Maps SDK for Android**와 **Maps SDK for iOS** API를 활성화하세요. 키 제한은 앱 패키지명·SHA-1(Android) / Bundle ID(iOS)로 설정하는 것을 권장합니다.

iOS 빌드 시 `cd ios && pod install` 후 실행합니다.

### 3. 앱 실행

**Android**

```bash
npm run android
```

**iOS** (macOS)

```bash
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
```

## 스크립트

| 명령어                  | 설명                       |
| ----------------------- | -------------------------- |
| `npm start`             | Metro 번들러 시작 (기본 localhost) |
| `npm run start:lan`     | Metro — 같은 Wi‑Fi용 LAN IP |
| `npm run connect:android` | adb reverse + LAN IP / Metro 상태 확인 |
| `npm run start:tunnel`  | Metro — ngrok 터널        |
| `npm run android`       | Android 앱 실행            |
| `npm run ios`           | iOS 앱 실행                |
| `npm run lint`          | ESLint 검사                |
| `npm run lint:fix`      | ESLint 자동 수정           |
| `npm run format`        | Prettier로 코드 포맷       |
| `npm run format:check`  | Prettier 포맷 검사 (CI용)  |
| `npm test`              | Jest 테스트 실행           |
| `npm test -- --watch`   | Jest watch 모드            |

## 코드 품질

### ESLint

React Native 공식 ESLint 설정(`@react-native/eslint-config`)을 사용합니다.

```bash
npm run lint       # 검사
npm run lint:fix   # 자동 수정
```

### Prettier

`.prettierrc.js`에 정의된 규칙(작은따옴표, trailing comma 등)으로 코드 스타일을 맞춥니다.

```bash
npm run format        # 전체 포맷
npm run format:check  # 포맷 검사만
```

`android/`, `ios/`, `node_modules/` 등은 `.prettierignore`에서 제외됩니다.

## 테스트

Jest와 `@react-native/jest-preset`으로 React Native 환경에서 테스트합니다.

```bash
npm test
```

테스트 파일은 `__tests__/` 폴더 또는 `*.test.tsx` / `*.spec.tsx` 형식으로 작성합니다.

현재 `__tests__/App.test.tsx`에서 `App` 컴포넌트 렌더링을 검증합니다.

## 에디터 설정

`.vscode/settings.json`에 다음이 설정되어 있습니다.

- 저장 시 Prettier 자동 포맷
- 저장 시 ESLint 자동 수정

Cursor/VS Code에서 아래 확장 프로그램 설치를 권장합니다 (`.vscode/extensions.json` 참고).

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 개발 환경 설정

React Native 개발 환경 설정은 [공식 문서](https://reactnative.dev/docs/set-up-your-environment)를 참고하세요.
