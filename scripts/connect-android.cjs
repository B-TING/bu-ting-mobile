const {
  adbReverse,
  envWithAndroidSdk,
  getLanIPv4,
  metroStatus,
} = require('./lib/dev-android.cjs');

const port = Number(process.env.RCT_METRO_PORT || 8081);
const { env, adb } = envWithAndroidSdk();

if (!adb) {
  console.error('[Bu-Ting] Android SDK를 찾을 수 없습니다.');
  process.exit(1);
}

const reverse = adbReverse(env, adb, port);
if (reverse.ok) {
  console.log(`[Bu-Ting] adb reverse tcp:${port} tcp:${port} 설정됨 (USB 연결 시 localhost로 Metro 접속)`);
} else if (reverse.reason === 'no-device') {
  console.warn('[Bu-Ting] USB로 연결된 기기가 없습니다. Wi‑Fi만 쓸 때는 아래 LAN 주소를 사용하세요.');
}

const lan = getLanIPv4();
if (lan) {
  console.log(`[Bu-Ting] Wi‑Fi / Dev Menu용 Debug server host: ${lan}:${port}`);
  console.log('  → 흔들기 → Dev Settings → Debug server host → 위 주소 입력 → Reload');
}

if (metroStatus(port)) {
  console.log(`[Bu-Ting] Metro가 포트 ${port}에서 응답 중입니다.`);
} else {
  console.warn(
    `[Bu-Ting] Metro가 포트 ${port}에서 응답하지 않습니다. 터미널 1에서 npm run start:lan (또는 npm start)을 실행하세요.`,
  );
  if (!reverse.ok) {
    console.warn('  8081이 이미 쓰이면: 작업 관리자에서 node 종료 후 다시 시작');
  }
}
