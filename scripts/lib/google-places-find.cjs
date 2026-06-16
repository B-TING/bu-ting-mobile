/**
 * Google Places Find Place from Text (Legacy REST)
 * TourAPI 장소명 + 좌표 → place_id 역추적
 *
 * @see https://developers.google.com/maps/documentation/places/web-service/search-find-place
 */
const { optionalEnvInt, requireEnv } = require('./load-env.cjs');

const FIND_PLACE_URL =
  'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';

const DEFAULT_RADIUS_M = 150;
const DEFAULT_LANGUAGE = 'ko';

/** 괄호·특수문자 제거 후 재검색용 이름 변형 */
function normalizePlaceNameCandidates(name) {
  const trimmed = name.trim();
  const candidates = [trimmed];
  const withoutParens = trimmed.replace(/\s*[\(\（][^)\）]*[\)\）]\s*/g, ' ').trim();
  if (withoutParens && withoutParens !== trimmed) {
    candidates.push(withoutParens);
  }
  const simplified = withoutParens
    .replace(/[^\p{L}\p{N}\s·.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (simplified && !candidates.includes(simplified)) {
    candidates.push(simplified);
  }
  return candidates;
}

function buildFindPlaceUrl({ input, lat, lng, radiusM, language, apiKey }) {
  const params = new URLSearchParams({
    input,
    inputtype: 'textquery',
    locationbias: `circle:${radiusM}@${lat},${lng}`,
    fields: 'place_id',
    language,
    key: apiKey,
  });
  return `${FIND_PLACE_URL}?${params.toString()}`;
}

async function findPlaceIdOnce({ name, lat, lng, radiusM, language, apiKey }) {
  const url = buildFindPlaceUrl({
    input: name,
    lat,
    lng,
    radiusM,
    language,
    apiKey,
  });
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Find Place HTTP ${res.status}`);
  }
  const body = await res.json();
  if (body.status === 'ZERO_RESULTS') {
    return { status: 'ZERO_RESULTS', placeId: null, rawStatus: body.status };
  }
  if (body.status !== 'OK') {
    return {
      status: 'ERROR',
      placeId: null,
      rawStatus: body.status,
      errorMessage: body.error_message,
    };
  }
  const placeId = body.candidates?.[0]?.place_id ?? null;
  return {
    status: placeId ? 'OK' : 'ZERO_RESULTS',
    placeId,
    rawStatus: body.status,
  };
}

/**
 * @param {{ name: string, lat: number, lng: number, radiusM?: number, language?: string, apiKey?: string }} opts
 * @returns {Promise<{ placeId: string | null, status: 'OK'|'ZERO_RESULTS'|'NOT_FOUND'|'ERROR', triedNames: string[], rawStatus?: string, errorMessage?: string }>}
 */
async function resolveGooglePlaceId(opts) {
  const apiKey = opts.apiKey ?? requireEnv('GOOGLE_PLACES_API_KEY');
  const radiusM =
    opts.radiusM ?? optionalEnvInt('GOOGLE_PLACES_FIND_RADIUS_M', DEFAULT_RADIUS_M);
  const language = opts.language ?? process.env.GOOGLE_PLACES_LANGUAGE ?? DEFAULT_LANGUAGE;

  const triedNames = [];
  for (const candidate of normalizePlaceNameCandidates(opts.name)) {
    triedNames.push(candidate);
    const result = await findPlaceIdOnce({
      name: candidate,
      lat: opts.lat,
      lng: opts.lng,
      radiusM,
      language,
      apiKey,
    });
    if (result.placeId) {
      return {
        placeId: result.placeId,
        status: 'OK',
        triedNames,
        rawStatus: result.rawStatus,
      };
    }
    if (result.status === 'ERROR') {
      return {
        placeId: null,
        status: 'ERROR',
        triedNames,
        rawStatus: result.rawStatus,
        errorMessage: result.errorMessage,
      };
    }
  }

  return {
    placeId: null,
    status: 'NOT_FOUND',
    triedNames,
    rawStatus: 'ZERO_RESULTS',
  };
}

module.exports = {
  FIND_PLACE_URL,
  DEFAULT_RADIUS_M,
  normalizePlaceNameCandidates,
  resolveGooglePlaceId,
};
