#!/usr/bin/env node
/**
 * TourAPI → Google place_id 역추적 테스트
 *
 * Usage:
 *   node scripts/resolve-place-id.cjs "해동용궁사" 35.1885 129.2233
 *   node scripts/resolve-place-id.cjs "자갈치시장" 35.0966 129.0308
 */
const { loadProjectEnv } = require('./lib/load-env.cjs');
const { resolveGooglePlaceId } = require('./lib/google-places-find.cjs');

loadProjectEnv();

async function main() {
  const [, , name, latRaw, lngRaw] = process.argv;
  if (!name || latRaw == null || lngRaw == null) {
    console.error(
      'Usage: node scripts/resolve-place-id.cjs "<장소명>" <위도> <경도>',
    );
    process.exit(1);
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error('위도·경도는 숫자여야 합니다.');
    process.exit(1);
  }

  console.log(`Resolving place_id for "${name}" @ ${lat}, ${lng} ...`);

  const result = await resolveGooglePlaceId({ name, lat, lng });

  console.log(JSON.stringify(result, null, 2));

  if (result.status === 'OK') {
    process.exit(0);
  }
  process.exit(result.status === 'ERROR' ? 2 : 1);
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exit(2);
});
