/**
 * .env.local 에 NGROK_AUTHTOKEN 저장
 * Usage: npm run ngrok:auth -- YOUR_TOKEN
 */
const fs = require('fs');
const path = require('path');

const token = process.argv[2]?.trim();

if (!token) {
  console.error(`
Usage: npm run ngrok:auth -- YOUR_NGROK_AUTHTOKEN

발급: https://dashboard.ngrok.com/get-started/your-authtoken
(API Key가 아닌 Authtoken)
`);
  process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env.local');
fs.writeFileSync(
  envPath,
  ['# ngrok tunnel (do not commit)', `NGROK_AUTHTOKEN=${token}`, ''].join(
    '\n',
  ),
  'utf8',
);

console.log(`Saved ${envPath}`);
console.log('Verify: npm run start:tunnel');
