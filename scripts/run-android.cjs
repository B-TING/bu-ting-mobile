const { spawnSync } = require('child_process');
const {
  adbReverse,
  envWithAndroidSdk,
  getLanIPv4,
  metroStatus,
  projectRoot,
} = require('./lib/dev-android.cjs');

spawnSync('node', ['scripts/sync-kakao-map-key.cjs'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
});

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

let extraArgs = process.argv.slice(2);
const wantsAvd = extraArgs.includes('--avd');
if (wantsAvd) {
  extraArgs = extraArgs.filter(a => a !== '--avd');
}

const hasDeviceArg =
  extraArgs.some(a => a === '--deviceId' || a.startsWith('--deviceId=')) ||
  wantsAvd;

let deviceLines = [];
if (adb) {
  const devices = spawnSync(adb, ['devices'], { encoding: 'utf8', env });
  deviceLines =
    devices.stdout
      ?.split('\n')
      .filter(line => /\tdevice\s*$/m.test(line))
      .map(line => line.split('\t')[0].trim()) ?? [];
}

function useX86AvdBuild(deviceId, reason) {
  // gradle.properties는 ARM 실기기용만 빌드 → x86 AVD에서 libreactnative.so 누락으로 즉시 종료됨
  env.ORG_GRADLE_PROJECT_reactNativeArchitectures = 'x86_64';
  console.log(`[Bu-Ting] AVD 대상: ${deviceId} (네이티브 ABI: x86_64${reason ? `, ${reason}` : ''})`);
}

if (wantsAvd) {
  const emulator = deviceLines.find(id => id.startsWith('emulator-'));
  if (!emulator) {
    console.error(
      '[Bu-Ting] AVD가 adb에 보이지 않습니다. Android Studio → Device Manager에서 에뮬레이터를 먼저 실행하세요.',
    );
    process.exit(1);
  }
  extraArgs.push('--deviceId', emulator);
  useX86AvdBuild(emulator);
} else {
  const deviceIdArg = extraArgs.find(a => a.startsWith('--deviceId='))?.split('=')[1];
  const deviceIdIdx = extraArgs.indexOf('--deviceId');
  const explicitDeviceId =
    deviceIdArg ?? (deviceIdIdx >= 0 ? extraArgs[deviceIdIdx + 1] : null);
  const targetDeviceId =
    explicitDeviceId ??
    (deviceLines.length === 1 ? deviceLines[0] : null);

  if (targetDeviceId?.startsWith('emulator-')) {
    useX86AvdBuild(
      targetDeviceId,
      explicitDeviceId ? '명시적 deviceId' : '연결된 기기 1대',
    );
  }
}

if (adb && !hasDeviceArg && !wantsAvd && deviceLines.length > 1) {
  const emulators = deviceLines.filter(id => id.startsWith('emulator-'));
  console.warn(
    `[Bu-Ting] 연결된 기기가 ${deviceLines.length}대입니다: ${deviceLines.join(', ')}`,
  );
  if (emulators.length) {
    console.warn(
      `  AVD만 쓰려면: npm run android:avd  또는  npm run android -- --deviceId ${emulators[0]}`,
    );
  }
  console.warn(
    `  지금은 react-native가 첫 번째 기기(${deviceLines[0]})에 설치합니다.\n`,
  );
}

const result = spawnSync(
  'npx',
  ['react-native', 'run-android', ...extraArgs],
  { cwd: projectRoot, env, stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
