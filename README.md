# BU-TING-Mobile

나만의 부산 여행 가이드 **부팅** 모바일 애플리케이션

## 기술 스택

- React Native 0.85.3
- React 19
- TypeScript
- ESLint + Prettier
- Jest

## 프로젝트 구조

```
.
├── src/
│   ├── constants/   # 색상, 상수
│   ├── screens/     # 화면 컴포넌트
│   └── types/       # TypeScript 타입 정의
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
npm start
```

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
| `npm start`             | Metro 번들러 시작          |
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
