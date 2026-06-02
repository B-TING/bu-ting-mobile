const { spawnSync } = require('child_process');
const {
  adbReverse,
  envWithAndroidSdk,
  getLanIPv4,
  metroStatus,
  projectRoot,
} = require('./lib/dev-android.cjs');

const port = Number(process.env.RCT_METRO_PORT || 8081);
const { env, adb } = envWithAndroidSdk();

let reverseOk = false;
if (adb) {
  const reverse = adbReverse(env, adb, port);
  reverseOk = reverse.ok;
  if (reverseOk) {
    console.log(`[Bu-Ting] adb reverse tcp:${port} tcp:${port}`);
  }
}

const lan = getLanIPv4();
if (!process.env.REACT_NATIVE_PACKAGER_HOSTNAME && lan) {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = lan;
}

if (!metroStatus(port)) {
  console.warn(
    `\n[Bu-Ting] Metro가 http://127.0.0.1:${port} 에서 응답하지 않습니다.`,
  );
  console.warn('  터미널 1: npm run start:lan  (같은 Wi‑Fi) 또는 npm start (USB + adb reverse)');
  console.warn('  포트 충돌 시: 8081을 쓰는 node 프로세스를 종료한 뒤 다시 시작\n');
} else if (!reverseOk && lan) {
  console.log(
    `[Bu-Ting] Wi‑Fi만 사용 시 Dev Menu → Debug server host → ${lan}:${port}`,
  );
}

const result = spawnSync(
  'npx',
  ['react-native', 'run-android', ...process.argv.slice(2)],
  { cwd: projectRoot, env, stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
