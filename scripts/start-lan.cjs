const { spawn } = require('child_process');
const { getLanIPv4, projectRoot } = require('./lib/dev-android.cjs');

const port = Number(process.env.RCT_METRO_PORT || 8081);
const lan = getLanIPv4();
const metroArgs = process.argv.slice(2);

console.log('\n[Bu-Ting] Metro LAN 모드 (--host lan)');
if (lan) {
  console.log(`  폰 Dev Menu → Debug server host: ${lan}:${port}`);
  console.log('  Windows 방화벽에서 Node.js / 포트 8081 인바운드 허용이 필요할 수 있습니다.\n');
} else {
  console.warn('  LAN IP를 찾지 못했습니다. Wi‑Fi 연결을 확인하세요.\n');
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(
  npx,
  ['react-native', 'start', '--host', 'lan', '--port', String(port), ...metroArgs],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ...(lan ? { REACT_NATIVE_PACKAGER_HOSTNAME: lan } : {}),
    },
  },
);

child.on('exit', code => process.exit(code ?? 1));
