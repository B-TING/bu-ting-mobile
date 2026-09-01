/**
 * Metro 0.84 resolves image-size to image-size-next, which breaks Node 22+ asset
 * bundling for some JPEGs. Pin classic image-size@1.2.1 under metro.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const metroDir = path.join(__dirname, '..', 'node_modules', 'metro');
if (!fs.existsSync(metroDir)) {
  process.exit(0);
}

const imageSizePkgPath = path.join(metroDir, 'node_modules', 'image-size', 'package.json');
if (fs.existsSync(imageSizePkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(imageSizePkgPath, 'utf8'));
  if (pkg.name === 'image-size' && pkg.version === '1.2.1') {
    process.exit(0);
  }
}

console.log('[Bu-Ting] Pinning metro image-size@1.2.1 for release bundling');
execSync('npm install image-size@1.2.1 --no-save --no-package-lock', {
  cwd: metroDir,
  stdio: 'inherit',
});
