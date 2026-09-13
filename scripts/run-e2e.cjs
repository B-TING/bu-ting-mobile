const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { envWithAndroidSdk } = require('./lib/dev-android.cjs');

function resolveMaestro() {
  const home = os.homedir();
  const names =
    process.platform === 'win32'
      ? ['maestro.bat', 'maestro.cmd', 'maestro.exe']
      : ['maestro'];
  const extraDirs = [
    path.join(home, 'maestro', 'maestro', 'bin'),
    path.join(home, 'maestro', 'bin'),
    path.join(home, '.maestro', 'bin'),
  ];
  const pathDirs = (process.env.PATH || process.env.Path || '')
    .split(path.delimiter)
    .filter(Boolean);
  const dirs = [...extraDirs, ...pathDirs];

  for (const dir of dirs) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function listReadyDevices(adb, env) {
  const result = spawnSync(adb, ['devices'], { encoding: 'utf8', env });
  return (
    result.stdout
      ?.split('\n')
      .filter(line => /\tdevice\s*$/m.test(line))
      .map(line => line.split('\t')[0].trim())
      .filter(Boolean) ?? []
  );
}

function isMdnsSerial(id) {
  return id.includes('_adb-tls-connect._tcp');
}

function resolveMdnsAddress(adb, env, serial) {
  const instance = serial.replace(/\._adb-tls-connect\._tcp\.?$/i, '');
  const result = spawnSync(adb, ['mdns', 'services'], { encoding: 'utf8', env });
  const lines = result.stdout?.split('\n') ?? [];
  for (const line of lines) {
    if (!line.includes('_adb-tls-connect') || !line.includes(instance)) {
      continue;
    }
    const match = line.match(/(\d+\.\d+\.\d+\.\d+):(\d+)/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }
  return null;
}

/**
 * Maestro dadb는 무선 ADB mDNS 시리얼을 기기로 세지 않는다.
 * IP:포트로 다시 붙인 뒤 그 시리얼을 --udid 로 넘긴다.
 */
function prepareMaestroDevice(adb, env) {
  let devices = listReadyDevices(adb, env);
  for (const serial of devices.filter(isMdnsSerial)) {
    const ipPort = resolveMdnsAddress(adb, env, serial);
    if (!ipPort) {
      continue;
    }
    spawnSync(adb, ['connect', ipPort], { encoding: 'utf8', env });
    spawnSync(adb, ['disconnect', serial], { encoding: 'utf8', env });
  }
  return listReadyDevices(adb, env).filter(id => !isMdnsSerial(id));
}

function hasExplicitUdid(args) {
  return args.some(
    a =>
      a === '--udid' ||
      a === '--device' ||
      a.startsWith('--udid=') ||
      a.startsWith('--device='),
  );
}

const maestro = resolveMaestro();
if (!maestro) {
  console.error('[Bu-Ting] Maestro CLI를 찾을 수 없습니다. Cursor를 재시작해도 같으면 CLI를 설치하세요.');
  console.error(
    '  Windows: https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip',
  );
  console.error(
    `  압축을 푼 뒤 bin을 PATH에 넣거나 ${path.join(os.homedir(), 'maestro', 'maestro', 'bin')} 에 두세요.`,
  );
  process.exit(1);
}

const { env, adb } = envWithAndroidSdk();
const args = process.argv.slice(2);
let maestroArgs = args;

if (adb) {
  const devices = prepareMaestroDevice(adb, env);
  if (devices.length === 0) {
    console.error('[Bu-Ting] Maestro가 쓸 수 있는 Android 기기가 없습니다.');
    console.error('  USB: 케이블 연결 후 개발자 옵션 → USB 디버깅 허용');
    console.error('  무선: 개발자 옵션 → 무선 디버깅 → IP:포트 로 adb connect');
    console.error('        (페어링 포트가 아니라 연결 포트를 씁니다)');
    console.error('  확인: adb devices   → device 여야 합니다. offline 이면 다시 connect');
    process.exit(1);
  }
  if (!hasExplicitUdid(args)) {
    const target = devices[0];
    if (devices.length > 1) {
      console.warn(
        `[Bu-Ting] 기기가 ${devices.length}대입니다: ${devices.join(', ')}`,
      );
      console.warn(`  지금은 ${target} 에서 실행합니다. 다른 기기는 끄거나 --udid 를 지정하세요.\n`);
    } else {
      console.log(`[Bu-Ting] E2E 대상: ${target}\n`);
    }
    maestroArgs = ['--udid', target, ...args];
  }
}

const result = spawnSync(maestro, maestroArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env,
});

process.exit(result.status ?? 1);
