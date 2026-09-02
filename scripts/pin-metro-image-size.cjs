/**
 * Metro 0.84 resolves image-size to image-size-next, which breaks Node 22+ asset
 * bundling for some JPEGs. Pin classic image-size@1.2.1 under metro only.
 *
 * Do NOT run npm install inside node_modules/metro — that reinstalls Metro's full
 * dependency tree and breaks NativeWind / Metro resolution.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const metroDir = path.join(rootDir, 'node_modules', 'metro');
const targetDir = path.join(metroDir, 'node_modules', 'image-size');
const stubDir = path.join(rootDir, 'node_modules', '.metro-image-size-stub');

if (!fs.existsSync(metroDir)) {
  process.exit(0);
}

if (fs.existsSync(path.join(targetDir, 'package.json'))) {
  const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
  if (pkg.name === 'image-size' && pkg.version === '1.2.1') {
    process.exit(0);
  }
}

console.log('[Bu-Ting] Pinning metro image-size@1.2.1 for release bundling');

fs.rmSync(stubDir, { recursive: true, force: true });
fs.mkdirSync(stubDir, { recursive: true });
fs.writeFileSync(
  path.join(stubDir, 'package.json'),
  JSON.stringify({ name: 'metro-image-size-stub', version: '0.0.0', private: true }),
);

execSync('npm install image-size@1.2.1 --no-save --no-package-lock', {
  cwd: stubDir,
  stdio: 'inherit',
});

const installed = path.join(stubDir, 'node_modules', 'image-size');
if (!fs.existsSync(installed)) {
  throw new Error('Failed to download image-size@1.2.1 for metro pin');
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(installed, targetDir, { recursive: true });
fs.rmSync(stubDir, { recursive: true, force: true });
