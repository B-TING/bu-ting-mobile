/**
 * @deprecated kakaoMap/places/placeService 로 이전됨. 하위 호환 re-export.
 */
export {
  fetchBusanAccommodations,
  fetchBusanAttractions,
  fetchAccommodationDetail,
  fetchAttractionDetail,
  fetchRoutePlaceDetail,
  fetchPlaceDetailFromGoogleResponse,
  shouldFetchGooglePlaceDetail,
  buildGoogleMapsUrl,
  listKnownAccommodationPlaceIds,
  listKnownAttractionPlaceIds,
  resolveAccommodationPlaceId,
  resolveAttractionPlaceId,
} from '../kakaoMap/places/placeService';

export { mapGooglePlaceDetailsResponse, toPlaceInfo, toPlaceListItem } from '../utils/googlePlacesMapper';
