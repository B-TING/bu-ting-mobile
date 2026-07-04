# BU-TING Mobile

나만의 부산 여행 가이드 **부팅(Bu-Ting)** React Native 앱입니다.

언어 선택 → 여행 취향 온보딩 → OAuth 로그인 후, AI 일정·카카오맵·행사 구역·여행기·마이페이지 등을 이용할 수 있습니다.

## 기술 스택

| 영역 | 스택 |
|------|------|
| 앱 | React Native 0.85 · React 19 · TypeScript |
| UI | NativeWind v4 (Tailwind CSS) |
| 상태 | Zustand + AsyncStorage persist |
| 지도 | WebView + Kakao Map JavaScript SDK |
| 로그인 | Google / Kakao 네이티브 SDK → 백엔드 OAuth (`id_token`) |
| 품질 | ESLint · Prettier · Jest |

## 사전 요구사항

- **Node.js** ≥ 22.11.0
- **JDK** 17+
- **Android Studio** (Android) · **Xcode** (iOS, macOS)

[React Native 환경 설정](https://reactnative.dev/docs/set-up-your-environment)은 공식 문서를 참고하세요.

---

## 빠른 시작

### 1. 저장소 클론 & 의존성 설치

```bash
npm install
```

`postinstall`에서 아래가 자동 실행됩니다.

- `kakao:sync` · `api:sync` · `oauth:sync` — `.env` → 로컬 생성 파일 동기화
- `patch-package`
- `hooks:install` — 커밋 전 보안 검사 훅 설치

### 2. 환경 변수 설정

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

`.env`에 필요한 키를 채운 뒤 동기화 스크립트를 실행합니다.

```bash
npm run api:sync      # API_BASE_URL, OAuth client 설정
npm run oauth:sync    # AndroidManifest, Info.plist, oauth_strings.xml
npm run kakao:sync    # 카카오맵 WebView 설정
```

> `.env`와 동기화로 생성되는 파일은 **git에 올리지 않습니다.** 템플릿은 `.env.example`만 커밋합니다.

### 3. Metro & 앱 실행

**터미널 1 — Metro**

```bash
npm start
# NativeWind 변경 후 캐시 이슈 시
npm start -- --reset-cache
```

**터미널 2 — 앱**

```bash
npm run android    # Android (USB 권장, adb reverse 자동)
npm run ios        # iOS (macOS)
```

---

## 환경 변수

`.env.example`에 전체 목록과 설명이 있습니다. 자주 쓰는 항목만 정리합니다.

| 변수 | 용도 |
|------|------|
| `API_BASE_URL` | 백엔드 API (OAuth, 여행 설문, 프로필 등) |
| `GOOGLE_OAUTH_WEB_CLIENT_ID` | Google 로그인 · 백엔드 `id_token` 검증 |
| `GOOGLE_OAUTH_IOS_CLIENT_ID` | iOS Google Sign-In |
| `GOOGLE_OAUTH_ANDROID_CLIENT_ID_FOR_*` | Android Google Sign-In (debug/release) |
| `KAKAO_REST_API_KEY` | 카카오 OAuth client_id |
| `KAKAO_NATIVE_APP_KEY` | 카카오 로그인 SDK |
| `KAKAO_JAVASCRIPT_KEY` | 앱 내 카카오맵 WebView |
| `NGROK_AUTHTOKEN` | Metro 터널 (`start:tunnel`) |

### OAuth 로그인

- Google · Kakao: 네이티브 SDK에서 **`id_token`**을 받아 `POST /api/v1/auth/oauth/login`으로 전송합니다.
- 키 입력 후 반드시 `npm run oauth:sync`를 실행해 네이티브 매니페스트를 갱신하세요.
- 네이버는 앱 등록 전까지 비활성화 (`src/constants/auth/oauthProviders.ts`).

### 카카오맵

앱 내 지도(일정, 행사 구역, 짐 보관소 등)는 **WebView + 카카오맵 JS SDK**입니다.

1. 카카오 콘솔에서 **Web** 플랫폼 활성화
2. `.env`에 `KAKAO_JAVASCRIPT_KEY` 설정
3. `npm run kakao:sync`

---

## Metro 연결

| 방식 | Metro | 앱 | 비고 |
|------|-------|-----|------|
| **USB** (권장) | `npm start` | `npm run android` | `adb reverse` 자동. `npm run connect:android`로 상태 확인 |
| **같은 Wi‑Fi** | `npm run start:lan` | `npm run android` | Dev Menu → Debug server host에 `192.168.x.x:8081` 입력 |
| **다른 네트워크** | `npm run start:tunnel` | `REACT_NATIVE_PACKAGER_HOSTNAME` 설정 후 실행 | ngrok Authtoken 필요 |

**터널 (ngrok) 최초 설정**

```bash
npm run ngrok:auth -- 여기에_토큰
npm run start:tunnel
```

PowerShell 예시:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="출력된-ngrok-호스트"
npm run android
```

**자주 나는 오류**

- **`Unable to load script`** — Metro가 안 떠 있거나, 폰이 PC Metro에 연결되지 않은 경우. USB + `npm start` 조합을 먼저 확인하세요.
- **`EADDRINUSE` (8081)** — 기존 `node` 프로세스 종료 후 Metro 재시작.

---

## npm 스크립트

### 앱 실행

| 명령 | 설명 |
|------|------|
| `npm start` | Metro (localhost) |
| `npm run start:lan` | Metro — LAN IP 노출 |
| `npm run start:tunnel` | Metro — ngrok 터널 |
| `npm run connect:android` | adb reverse · Metro 연결 상태 확인 |
| `npm run android` | Android 빌드 & 실행 |
| `npm run android:avd` | 지정 AVD로 실행 |
| `npm run ios` | iOS 빌드 & 실행 |

### 설정 동기화

| 명령 | 설명 |
|------|------|
| `npm run api:sync` | `.env` → `apiConfig.ts`, `apiBaseUrl.ts` |
| `npm run oauth:sync` | `.env` → OAuth 네이티브 설정·매니페스트 |
| `npm run kakao:sync` | `.env` → `src/kakaoMap/config.ts` |
| `npm run map:sync` | 부산 지도 SVG 경로 추출 |
| `npm run zone-boundaries:sync` | 구역 경계 GeoJSON 생성 |
| `npm run hooks:install` | pre-commit 보안 훅 설치 |

### 개발·품질

| 명령 | 설명 |
|------|------|
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Jest |
| `npm run ngrok:auth` | ngrok Authtoken 등록 |
| `npm run icons:generate` | 앱 아이콘 생성 |

---

## 프로젝트 구조

```
.
├── src/
│   ├── components/     # 공통·화면별 UI
│   ├── constants/      # 카피·메뉴·API 경로 예시 등
│   ├── hooks/
│   ├── kakaoMap/       # WebView 지도 코어·오버레이
│   ├── navigation/
│   ├── screens/        # 화면 (홈, 일정, 피드, 마이페이지, 설정…)
│   ├── services/       # auth, user, travel survey, plan AI…
│   ├── stores/         # Zustand (auth, app, plan…)
│   ├── types/
│   └── utils/
├── scripts/            # sync·빌드·git hooks
├── android/ · ios/     # 네이티브 (OAuth 매니페스트는 sync로 생성)
├── __tests__/
├── .env.example        # 환경 변수 템플릿 (커밋 O)
└── .env                # 로컬 비밀 (커밋 X)
```

### git에 올리지 않는 파일

`.gitignore` 및 pre-commit 훅으로 보호합니다.

- `.env`, `.env.local` 등 (`.env.example` 제외)
- `src/constants/api/apiConfig.ts`, `apiBaseUrl.ts`
- `src/constants/auth/oauthConfig.ts`
- `src/kakaoMap/config.ts`
- `android/app/src/main/AndroidManifest.xml`, `ios/.../Info.plist` (OAuth sync 결과)

---

## 보안 — pre-commit 훅

`npm install` 시 `.git/hooks/pre-commit`이 설치됩니다. 커밋 직전에 다음을 검사합니다.

- `.env` 등 민감 경로 스테이징 차단
- `.gitignore` 대상 파일의 `git add -f` 차단
- 스테이징된 **추가 줄**에서 API 키·private key·env 비밀값 패턴 감지

차단 시 `git restore --staged <file>`로 스테이징을 해제하세요.

```bash
npm run hooks:install   # 수동 재설치
```

---

## 코드 품질 & 테스트

```bash
npm run lint
npm run format:check
npm test
```

- ESLint: `@react-native/eslint-config`
- Prettier: `.prettierrc.js` (android/ios/node_modules는 ignore)
- Jest: `__tests__/` · `*.test.tsx`

### 에디터 (VS Code / Cursor)

`.vscode/settings.json` — 저장 시 Prettier 포맷 + ESLint fix  
권장 확장: ESLint, Prettier (`.vscode/extensions.json` 참고)

---

## iOS 추가 설정

```bash
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
```

---

## 라이선스

Private — BU-TING 프로젝트 내부용
