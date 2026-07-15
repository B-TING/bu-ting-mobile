import { API_BASE_URL, TRAVEL_RECORD_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  PlaceReviewCreateRequest,
  PlaceReviewResponse,
  PlaceReviewSummaryResponse,
  PlaceReviewUpdateRequest,
  PlaceTravelRecordsQuery,
  TravelRecordBookmarkResponse,
  TravelRecordCommentCreateRequest,
  TravelRecordCommentUpdateRequest,
  TravelRecordCreateRequest,
  TravelRecordFeedPageResponse,
  TravelRecordFeedQuery,
  TravelRecordLikeResponse,
  TravelRecordManageResponse,
  TravelRecordResponse,
  TravelRecordUpdateRequest,
} from '../../types/travelRecordApi';
import type { TravelRecordComment } from '../../types/travelReview';
import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from '../api/apiClient';

export class TravelRecordServiceError extends ApiClientError {
  constructor(message: string, options?: { status?: number; url?: string; responseBody?: unknown }) {
    super(message, {
      status: options?.status,
      url: options?.url,
      responseBody: options?.responseBody,
    });
    this.name = 'TravelRecordServiceError';
  }
}

function mapError(error: ApiClientError): TravelRecordServiceError {
  return new TravelRecordServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
  });
}

function url(path: string) {
  return `${API_BASE_URL}${path}`;
}

function auth(accessToken: string) {
  return {
    accessToken,
    errorMessagePrefix: 'Travel record request failed',
    mapError,
  };
}

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** POST /api/v1/travels/{travelId}/records */
export async function createTravelRecordDraft(
  accessToken: string,
  travelId: string,
  body?: TravelRecordCreateRequest,
): Promise<TravelRecordResponse> {
  return apiPost(url(TRAVEL_RECORD_ENDPOINTS.createDraft(travelId)), {
    ...auth(accessToken),
    body: body ?? {},
  });
}

/** GET /api/v1/travels/{travelId}/records/{travelRecordId} */
export async function fetchTravelRecordDraft(
  accessToken: string,
  travelId: string,
  travelRecordId: string,
): Promise<TravelRecordResponse> {
  return apiGet(url(TRAVEL_RECORD_ENDPOINTS.draftById(travelId, travelRecordId)), auth(accessToken));
}

/** PATCH /api/v1/travels/{travelId}/records/{travelRecordId} */
export async function updateTravelRecordDraft(
  accessToken: string,
  travelId: string,
  travelRecordId: string,
  body?: TravelRecordUpdateRequest,
): Promise<TravelRecordResponse> {
  return apiPatch(url(TRAVEL_RECORD_ENDPOINTS.draftById(travelId, travelRecordId)), {
    ...auth(accessToken),
    body: body ?? {},
  });
}

/** POST .../publish */
export async function publishTravelRecord(
  accessToken: string,
  travelId: string,
  travelRecordId: string,
): Promise<TravelRecordResponse> {
  return apiPost(url(TRAVEL_RECORD_ENDPOINTS.publish(travelId, travelRecordId)), auth(accessToken));
}

/** POST /travels/{travelId}/plans/places/{planPlaceId}/review */
export async function createPlaceReview(
  accessToken: string,
  travelId: string,
  planPlaceId: string,
  body: PlaceReviewCreateRequest,
): Promise<PlaceReviewResponse> {
  return apiPost(url(TRAVEL_RECORD_ENDPOINTS.placeReview(travelId, planPlaceId)), {
    ...auth(accessToken),
    body,
  });
}

export async function fetchPlaceReview(
  accessToken: string,
  travelId: string,
  planPlaceId: string,
): Promise<PlaceReviewResponse> {
  return apiGet(
    url(TRAVEL_RECORD_ENDPOINTS.placeReview(travelId, planPlaceId)),
    auth(accessToken),
  );
}

export async function updatePlaceReview(
  accessToken: string,
  travelId: string,
  planPlaceId: string,
  body?: PlaceReviewUpdateRequest,
): Promise<PlaceReviewResponse> {
  return apiPatch(url(TRAVEL_RECORD_ENDPOINTS.placeReview(travelId, planPlaceId)), {
    ...auth(accessToken),
    body: body ?? {},
  });
}

export async function deletePlaceReview(
  accessToken: string,
  travelId: string,
  planPlaceId: string,
): Promise<void> {
  await apiDelete(
    url(TRAVEL_RECORD_ENDPOINTS.placeReview(travelId, planPlaceId)),
    auth(accessToken),
  );
}

/** GET /api/v1/travel-records */
export async function fetchTravelRecordFeed(
  query: TravelRecordFeedQuery = {},
  accessToken?: string | null,
): Promise<TravelRecordFeedPageResponse> {
  const qs = toQuery({
    cursor: query.cursor,
    size: query.size,
    keyword: query.keyword,
    placeId: query.placeId,
    travelStartDate: query.travelStartDate,
    travelEndDate: query.travelEndDate,
    region: query.region,
    city: query.city,
    sort: query.sort,
  });
  return apiGet(url(`${TRAVEL_RECORD_ENDPOINTS.feed}${qs}`), {
    accessToken: accessToken ?? undefined,
    errorMessagePrefix: 'Travel record request failed',
    mapError,
  });
}

/** GET /api/v1/travel-records/{id} */
export async function fetchPublicTravelRecord(
  travelRecordId: string,
): Promise<TravelRecordResponse> {
  return apiGet(url(TRAVEL_RECORD_ENDPOINTS.feedById(travelRecordId)), {
    errorMessagePrefix: 'Travel record request failed',
    mapError,
  });
}

/** GET /api/v1/travel-records/me */
export async function fetchMyTravelRecords(
  accessToken: string,
): Promise<TravelRecordManageResponse[]> {
  const data = await apiGet<TravelRecordManageResponse[]>(
    url(TRAVEL_RECORD_ENDPOINTS.me),
    auth(accessToken),
  );
  return data ?? [];
}

/** GET /api/v1/travel-records/me/bookmarks */
export async function fetchMyTravelRecordBookmarks(
  accessToken: string,
): Promise<TravelRecordBookmarkResponse[]> {
  const data = await apiGet<TravelRecordBookmarkResponse[]>(
    url(TRAVEL_RECORD_ENDPOINTS.meBookmarks),
    auth(accessToken),
  );
  return data ?? [];
}

/** GET /api/v1/travel-records/me/{id} */
export async function fetchMyTravelRecord(
  accessToken: string,
  travelRecordId: string,
): Promise<TravelRecordResponse> {
  return apiGet(url(TRAVEL_RECORD_ENDPOINTS.meById(travelRecordId)), auth(accessToken));
}

/** PATCH /api/v1/travel-records/me/{id} */
export async function updateMyTravelRecord(
  accessToken: string,
  travelRecordId: string,
  body?: TravelRecordUpdateRequest,
): Promise<TravelRecordResponse> {
  return apiPatch(url(TRAVEL_RECORD_ENDPOINTS.meById(travelRecordId)), {
    ...auth(accessToken),
    body: body ?? {},
  });
}

export async function hideMyTravelRecord(
  accessToken: string,
  travelRecordId: string,
): Promise<TravelRecordResponse> {
  return apiPost(url(TRAVEL_RECORD_ENDPOINTS.hide(travelRecordId)), auth(accessToken));
}

export async function republishMyTravelRecord(
  accessToken: string,
  travelRecordId: string,
): Promise<TravelRecordResponse> {
  return apiPost(url(TRAVEL_RECORD_ENDPOINTS.republish(travelRecordId)), auth(accessToken));
}

export async function bookmarkTravelRecord(
  accessToken: string,
  travelRecordId: string,
): Promise<TravelRecordBookmarkResponse> {
  return apiPost(url(TRAVEL_RECORD_ENDPOINTS.bookmarks(travelRecordId)), auth(accessToken));
}

export async function removeTravelRecordBookmark(
  accessToken: string,
  travelRecordId: string,
): Promise<void> {
  await apiDelete(url(TRAVEL_RECORD_ENDPOINTS.bookmarks(travelRecordId)), auth(accessToken));
}

export async function likeTravelRecord(
  accessToken: string,
  travelRecordId: string,
): Promise<TravelRecordLikeResponse> {
  return apiPost(url(TRAVEL_RECORD_ENDPOINTS.likes(travelRecordId)), auth(accessToken));
}

export async function unlikeTravelRecord(
  accessToken: string,
  travelRecordId: string,
): Promise<void> {
  await apiDelete(url(TRAVEL_RECORD_ENDPOINTS.likes(travelRecordId)), auth(accessToken));
}

export async function fetchTravelRecordComments(
  travelRecordId: string,
): Promise<TravelRecordComment[]> {
  const data = await apiGet<TravelRecordComment[]>(
    url(TRAVEL_RECORD_ENDPOINTS.comments(travelRecordId)),
    {
      errorMessagePrefix: 'Travel record request failed',
      mapError,
    },
  );
  return data ?? [];
}

export async function createTravelRecordComment(
  accessToken: string,
  travelRecordId: string,
  body: TravelRecordCommentCreateRequest,
): Promise<TravelRecordComment> {
  return apiPost(url(TRAVEL_RECORD_ENDPOINTS.comments(travelRecordId)), {
    ...auth(accessToken),
    body,
  });
}

export async function updateTravelRecordComment(
  accessToken: string,
  travelRecordId: string,
  commentId: string,
  body: TravelRecordCommentUpdateRequest,
): Promise<TravelRecordComment> {
  return apiPatch(url(TRAVEL_RECORD_ENDPOINTS.commentById(travelRecordId, commentId)), {
    ...auth(accessToken),
    body,
  });
}

export async function deleteTravelRecordComment(
  accessToken: string,
  travelRecordId: string,
  commentId: string,
): Promise<void> {
  await apiDelete(
    url(TRAVEL_RECORD_ENDPOINTS.commentById(travelRecordId, commentId)),
    auth(accessToken),
  );
}

export async function fetchPlaceTravelRecords(
  query: PlaceTravelRecordsQuery,
): Promise<TravelRecordFeedPageResponse> {
  const qs = toQuery({
    placeId: query.placeId,
    cursor: query.cursor,
    size: query.size,
  });
  return apiGet(url(`${TRAVEL_RECORD_ENDPOINTS.placesTravelRecords}${qs}`), {
    errorMessagePrefix: 'Travel record request failed',
    mapError,
  });
}

export async function fetchPlaceReviewSummary(
  placeId: string,
): Promise<PlaceReviewSummaryResponse> {
  const qs = toQuery({ placeId });
  return apiGet(url(`${TRAVEL_RECORD_ENDPOINTS.placesReviews}${qs}`), {
    errorMessagePrefix: 'Travel record request failed',
    mapError,
  });
}
