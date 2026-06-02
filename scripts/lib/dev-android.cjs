const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');

function resolveAndroidSdk() {
  if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }
  if (process.env.ANDROID_SDK_ROOT && fs.existsSync(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT;
  }

  const localProps = path.join(projectRoot, 'android', 'local.properties');
  if (fs.existsSync(localProps)) {
    const match = fs
      .readFileSync(localProps, 'utf8')
      .match(/^\s*sdk\.dir=(.+)\s*$/m);
    if (match) {
      const sdkDir = match[1].trim().replace(/\\/g, '/');
      if (fs.existsSync(sdkDir)) {
        return sdkDir;
      }
    }
  }

  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const defaultSdk = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
    if (fs.existsSync(defaultSdk)) {
      return defaultSdk;
    }
  }

  return null;
}

function prependPath(env, segment) {
  if (!segment || !fs.existsSync(segment)) {
    return env;
  }
  const key = process.platform === 'win32' ? 'Path' : 'PATH';
  const current = env[key] || '';
  if (current.split(path.delimiter).includes(segment)) {
    return env;
  }
  return { ...env, [key]: current ? `${segment}${path.delimiter}${current}` : segment };
}

function envWithAndroidSdk() {
  const env = { ...process.env };
  const sdk = resolveAndroidSdk();
  if (!sdk) {
    return { env, sdk: null, adb: null };
  }
  env.ANDROID_HOME = sdk;
  env.ANDROID_SDK_ROOT = sdk;
  prependPath(env, path.join(sdk, 'platform-tools'));
  prependPath(env, path.join(sdk, 'emulator'));
  const adb = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
  return { env, sdk, adb: fs.existsSync(adb) ? adb : 'adb' };
}

function getLanIPv4() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const entries of Object.values(nets)) {
    if (!entries) {
      continue;
    }
    for (const net of entries) {
      const family = net.family === 'IPv4' || net.family === 4;
      if (family && !net.internal) {
        candidates.push(net.address);
      }
    }
  }
  return (
    candidates.find(ip => ip.startsWith('192.168.') || ip.startsWith('10.')) ??
    candidates[0] ??
    null
  );
}

function hasAdbDevice(env, adb) {
  const result = spawnSync(adb, ['devices'], { encoding: 'utf8', env });
  if (result.status !== 0) {
    return false;
  }
  return result.stdout.split('\n').some(line => /\tdevice\s*$/m.test(line));
}

function adbReverse(env, adb, port = 8081) {
  if (!hasAdbDevice(env, adb)) {
    return { ok: false, reason: 'no-device' };
  }
  const result = spawnSync(adb, ['reverse', `tcp:${port}`, `tcp:${port}`], {
    encoding: 'utf8',
    env,
  });
  return { ok: result.status === 0, reason: result.status === 0 ? null : 'reverse-failed' };
}

function metroStatus(port = 8081) {
  try {
    const result = spawnSync(
      process.platform === 'win32' ? 'curl.exe' : 'curl',
      ['-s', '-o', 'NUL', '-w', '%{http_code}', `http://127.0.0.1:${port}/status`],
      { encoding: 'utf8', timeout: 3000 },
    );
    return result.stdout?.trim() === '200';
  } catch {
    return false;
  }
}

module.exports = {
  projectRoot,
  resolveAndroidSdk,
  envWithAndroidSdk,
  getLanIPv4,
  hasAdbDevice,
  adbReverse,
  metroStatus,
};
