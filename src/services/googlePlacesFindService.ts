import {
  DEFAULT_FIND_PLACE_RADIUS_M,
  DEFAULT_PLACES_LANGUAGE,
  GOOGLE_FIND_PLACE_FIELDS,
  GOOGLE_FIND_PLACE_INPUT_TYPE,
  GOOGLE_FIND_PLACE_URL,
  type GooglePlaceIdResolveStatus,
} from '../constants/googlePlacesConfig';

export type FindPlaceResolveResult = {
  placeId: string | null;
  status: GooglePlaceIdResolveStatus;
  triedNames: string[];
  rawStatus?: string;
  errorMessage?: string;
};

type FindPlaceApiResponse = {
  status: string;
  candidates?: { place_id?: string }[];
  error_message?: string;
};

/** TourAPI·공공데이터 장소명 정규화 — Find Place 재시도용 */
export function normalizePlaceNameCandidates(name: string): string[] {
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

function buildFindPlaceUrl(params: {
  input: string;
  lat: number;
  lng: number;
  radiusM: number;
  language: string;
  apiKey: string;
}): string {
  const search = new URLSearchParams({
    input: params.input,
    inputtype: GOOGLE_FIND_PLACE_INPUT_TYPE,
    locationbias: `circle:${params.radiusM}@${params.lat},${params.lng}`,
    fields: GOOGLE_FIND_PLACE_FIELDS,
    language: params.language,
    key: params.apiKey,
  });
  return `${GOOGLE_FIND_PLACE_URL}?${search.toString()}`;
}

async function findPlaceIdOnce(params: {
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  language: string;
  apiKey: string;
}): Promise<FindPlaceResolveResult> {
  const url = buildFindPlaceUrl({
    input: params.name,
    lat: params.lat,
    lng: params.lng,
    radiusM: params.radiusM,
    language: params.language,
    apiKey: params.apiKey,
  });

  const res = await fetch(url);
  if (!res.ok) {
    return {
      placeId: null,
      status: 'ERROR',
      triedNames: [params.name],
      rawStatus: `HTTP_${res.status}`,
    };
  }

  const body = (await res.json()) as FindPlaceApiResponse;

  if (body.status === 'ZERO_RESULTS') {
    return {
      placeId: null,
      status: 'ZERO_RESULTS',
      triedNames: [params.name],
      rawStatus: body.status,
    };
  }

  if (body.status !== 'OK') {
    return {
      placeId: null,
      status: 'ERROR',
      triedNames: [params.name],
      rawStatus: body.status,
      errorMessage: body.error_message,
    };
  }

  const placeId = body.candidates?.[0]?.place_id ?? null;
  return {
    placeId,
    status: placeId ? 'OK' : 'ZERO_RESULTS',
    triedNames: [params.name],
    rawStatus: body.status,
  };
}

/**
 * 공공데이터(TourAPI) 장소명 + 좌표 → Google place_id
 * @param apiKey — 백엔드 env에서 주입 (클라이언트 번들 금지)
 */
export async function resolveGooglePlaceId(params: {
  name: string;
  lat: number;
  lng: number;
  apiKey: string;
  radiusM?: number;
  language?: string;
}): Promise<FindPlaceResolveResult> {
  const radiusM = params.radiusM ?? DEFAULT_FIND_PLACE_RADIUS_M;
  const language = params.language ?? DEFAULT_PLACES_LANGUAGE;
  const triedNames: string[] = [];

  for (const candidate of normalizePlaceNameCandidates(params.name)) {
    triedNames.push(candidate);
    const result = await findPlaceIdOnce({
      name: candidate,
      lat: params.lat,
      lng: params.lng,
      radiusM,
      language,
      apiKey: params.apiKey,
    });

    if (result.placeId) {
      return { ...result, triedNames };
    }
    if (result.status === 'ERROR') {
      return { ...result, triedNames };
    }
  }

  return {
    placeId: null,
    status: 'NOT_FOUND',
    triedNames,
    rawStatus: 'ZERO_RESULTS',
  };
}
