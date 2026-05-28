# BU-TING-Mobile

나만의 부산 여행 가이드 **부팅** 모바일 애플리케이션

## 기술 스택

- React Native 0.85.3
- React 19
- TypeScript

## 프로젝트 구조

```
src/
├── constants/   # 색상, 상수
├── screens/     # 화면 컴포넌트
└── types/       # TypeScript 타입 정의
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

| 명령어 | 설명 |
|--------|------|
| `npm start` | Metro 번들러 시작 |
| `npm run android` | Android 앱 실행 |
| `npm run ios` | iOS 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npm test` | Jest 테스트 실행 |

## 개발 환경 설정

React Native 개발 환경 설정은 [공식 문서](https://reactnative.dev/docs/set-up-your-environment)를 참고하세요.
