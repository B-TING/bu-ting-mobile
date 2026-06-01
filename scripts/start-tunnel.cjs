/**
 * Metro → 공식 @ngrok/ngrok 터널
 * .env.local 의 NGROK_AUTHTOKEN 사용
 */
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const ngrok = require('@ngrok/ngrok');

const port = Number(process.env.RCT_METRO_PORT || 8081);
const metroArgs = process.argv.slice(2);
const projectRoot = path.join(__dirname, '..');

function readAuthtokenFromEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (key !== 'NGROK_AUTHTOKEN' && key !== 'NGROK_AUTH_TOKEN') {
      continue;
    }
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value || null;
  }
  return null;
}

function readAuthtokenFromNgrokYaml(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^\s*authtoken:\s*(\S+)\s*$/m);
  return match ? match[1].trim() : null;
}

function resolveNgrokAuthtoken() {
  const fromEnv =
    process.env.NGROK_AUTHTOKEN?.trim() ||
    process.env.NGROK_AUTH_TOKEN?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const fromEnvLocal = readAuthtokenFromEnvFile(
    path.join(projectRoot, '.env.local'),
  );
  if (fromEnvLocal) {
    return fromEnvLocal;
  }

  const home = os.homedir();
  const yamlPaths = [
    path.join(home, 'AppData', 'Local', 'ngrok', 'ngrok.yml'),
    path.join(home, '.ngrok2', 'ngrok.yml'),
    path.join(home, 'Library', 'Application Support', 'ngrok', 'ngrok.yml'),
  ];

  for (const yamlPath of yamlPaths) {
    const token = readAuthtokenFromNgrokYaml(yamlPath);
    if (token) {
      return token;
    }
  }

  return null;
}

function waitForPort(targetPort, timeoutMs = 90_000) {
  const host = '127.0.0.1';
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ port: targetPort, host }, () => {
        socket.end();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(
            new Error(
              `Metro가 ${targetPort} 포트에서 응답하지 않습니다. 방화벽·다른 Metro 프로세스를 확인하세요.`,
            ),
          );
        } else {
          setTimeout(attempt, 400);
        }
      });
    };
    attempt();
  });
}

function printSetupHelp() {
  console.error(`
ngrok 설정을 확인하세요.

1) https://dashboard.ngrok.com/get-started/your-authtoken 에서 Authtoken 복사
   (API Key / License가 아닌 Authtoken)

2) .env.local (따옴표 없이 한 줄):
   NGROK_AUTHTOKEN=2abc...

3) npm run start:tunnel

같은 Wi-Fi: npm run start:lan
`);
}

function formatNgrokError(error) {
  const msg = error?.message || String(error);
  if (/authtoken|authentication|401|403/i.test(msg)) {
    return 'ngrok이 authtoken을 거부했습니다. 대시보드에서 새 토큰을 발급해 .env.local을 갱신하세요.';
  }
  if (/remote gone away|502|103/i.test(msg)) {
    return 'ngrok 에이전트 연결 실패(구버전 클라이언트 문제였을 수 있음). 이 스크립트는 공식 @ngrok/ngrok을 사용합니다. 다시 시도해 보세요.';
  }
  return msg;
}

async function main() {
  const authtoken = resolveNgrokAuthtoken();
  if (!authtoken) {
    printSetupHelp();
    process.exit(1);
  }

  console.log(
    `Using authtoken: ${authtoken.slice(0, 6)}...${authtoken.slice(-4)} (${authtoken.length} chars)`,
  );

  let metroProcess;
  let listener;

  const cleanup = async () => {
    if (metroProcess && !metroProcess.killed) {
      metroProcess.kill();
    }
    try {
      await ngrok.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log('Starting Metro...');
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  metroProcess = spawn(
    npx,
    ['react-native', 'start', '--port', String(port), ...metroArgs],
    {
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot,
      env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: 'localhost' },
    },
  );

  metroProcess.on('exit', code => {
    if (listener) {
      ngrok.disconnect().finally(() => process.exit(code ?? 0));
    } else {
      process.exit(code ?? 0);
    }
  });

  await waitForPort(port);
  console.log(`Metro ready on port ${port}. Opening ngrok tunnel...`);

  listener = await ngrok.forward({
    addr: port,
    authtoken,
  });

  const publicUrl = listener.url();
  const hostname = new URL(publicUrl).hostname;

  // Metro가 광고하는 번들 URL을 터널 호스트로 맞춤 (재시작 없이 env 갱신은 앱 쪽 debug host로 처리)
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = hostname;

  console.log('\n--- Tunnel ready ---');
  console.log(`Public URL:  ${publicUrl}`);
  console.log(`Packager:    ${hostname}`);
  console.log('--------------------\n');
  console.log('PowerShell (앱 실행 / 재실행):');
  console.log(`  $env:REACT_NATIVE_PACKAGER_HOSTNAME="${hostname}"`);
  console.log('  npm run android\n');
  console.log(
    '이미 앱이 켜져 있으면: 흔들기 → Dev Settings → Debug server host → 위 Packager 호스트',
  );
  console.log(
    '\n같은 PC에서 USB 디버깅이면: adb reverse tcp:8081 tcp:8081 후 Reload만 해도 됩니다.',
  );
}

main().catch(error => {
  console.error('Tunnel failed:', formatNgrokError(error));
  if (error?.errorCode || error?.msg) {
    console.error('Details:', error.errorCode || error.msg);
  }
  printSetupHelp();
  process.exit(1);
});
