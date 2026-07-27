#!/usr/bin/env node
/**
 * Pretendard static OTF를 assets/fonts 에 동기화합니다.
 * 출처: https://github.com/orioncactus/pretendard
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const PRETENDARD_VERSION = '1.3.9';
const CDN_BASE = `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v${PRETENDARD_VERSION}/packages/pretendard/dist/public/static`;

const FONT_FILES = [
  'Pretendard-Regular.otf',
  'Pretendard-Medium.otf',
  'Pretendard-SemiBold.otf',
  'Pretendard-Bold.otf',
  'Pretendard-ExtraBold.otf',
  'Pretendard-Black.otf',
];

const projectRoot = path.join(__dirname, '..');
const fontsDir = path.join(projectRoot, 'assets', 'fonts');
const androidFontsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets', 'fonts');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url} (${response.statusCode})`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      })
      .on('error', error => {
        fs.unlink(destPath, () => reject(error));
      });
  });
}

async function main() {
  fs.mkdirSync(fontsDir, { recursive: true });

  for (const fileName of FONT_FILES) {
    const destPath = path.join(fontsDir, fileName);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      console.log(`[Bu-Ting] Pretendard skip (exists): ${fileName}`);
      continue;
    }

    const url = `${CDN_BASE}/${fileName}`;
    console.log(`[Bu-Ting] Pretendard download: ${fileName}`);
    await downloadFile(url, destPath);
  }

  console.log(`[Bu-Ting] Pretendard fonts synced → ${path.relative(projectRoot, fontsDir)}`);

  fs.mkdirSync(androidFontsDir, { recursive: true });
  for (const fileName of FONT_FILES) {
    fs.copyFileSync(path.join(fontsDir, fileName), path.join(androidFontsDir, fileName));
  }
  console.log(`[Bu-Ting] Pretendard fonts linked → ${path.relative(projectRoot, androidFontsDir)}`);
}

main().catch(error => {
  console.error('[Bu-Ting] Pretendard font sync failed:', error.message);
  process.exit(1);
});
