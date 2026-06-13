/**
 * icon-cutout.png → Android mipmap / iOS AppIcon 생성
 * 실행: node scripts/generate-app-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const source = path.join(root, 'assets', 'icon-cutout.png');

if (!fs.existsSync(source)) {
  console.error('Missing source icon:', source);
  process.exit(1);
}

const androidSizes = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resizeWithSharp(input, output, size) {
  execSync(
    `npx --yes sharp-cli resize ${size} ${size} --fit contain --background "#0B1F33" -i "${input}" -o "${output}"`,
    { stdio: 'inherit', cwd: root },
  );
}

console.log('Generating Android launcher icons…');
for (const [folder, size] of androidSizes) {
  const dir = path.join(root, 'android', 'app', 'src', 'main', 'res', folder);
  ensureDir(dir);
  const launcher = path.join(dir, 'ic_launcher.png');
  const round = path.join(dir, 'ic_launcher_round.png');
  resizeWithSharp(source, launcher, size);
  fs.copyFileSync(launcher, round);
}

const iosSizes = [
  ['Icon-40@2x.png', 80],
  ['Icon-40@3x.png', 120],
  ['Icon-60@2x.png', 120],
  ['Icon-60@3x.png', 180],
  ['Icon-20@2x.png', 40],
  ['Icon-20@3x.png', 60],
  ['Icon-29@2x.png', 58],
  ['Icon-29@3x.png', 87],
  ['Icon-1024.png', 1024],
];

const iosDir = path.join(
  root,
  'ios',
  'BUTingMobile',
  'Images.xcassets',
  'AppIcon.appiconset',
);
ensureDir(iosDir);

console.log('Generating iOS app icons…');
for (const [filename, size] of iosSizes) {
  resizeWithSharp(source, path.join(iosDir, filename), size);
}

const contents = {
  images: [
    { size: '20x20', idiom: 'iphone', filename: 'Icon-20@2x.png', scale: '2x' },
    { size: '20x20', idiom: 'iphone', filename: 'Icon-20@3x.png', scale: '3x' },
    { size: '29x29', idiom: 'iphone', filename: 'Icon-29@2x.png', scale: '2x' },
    { size: '29x29', idiom: 'iphone', filename: 'Icon-29@3x.png', scale: '3x' },
    { size: '40x40', idiom: 'iphone', filename: 'Icon-40@2x.png', scale: '2x' },
    { size: '40x40', idiom: 'iphone', filename: 'Icon-40@3x.png', scale: '3x' },
    { size: '60x60', idiom: 'iphone', filename: 'Icon-60@2x.png', scale: '2x' },
    { size: '60x60', idiom: 'iphone', filename: 'Icon-60@3x.png', scale: '3x' },
    {
      size: '1024x1024',
      idiom: 'ios-marketing',
      filename: 'Icon-1024.png',
      scale: '1x',
    },
  ],
  info: { version: 1, author: 'xcode' },
};

fs.writeFileSync(path.join(iosDir, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);
console.log('Done.');
