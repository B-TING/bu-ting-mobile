import type { PlaceDetailVO } from '../../types/googlePlaces';

export function buildGoogleMapsUrl(
  detail: Pick<PlaceDetailVO, 'googlePlaceId' | 'name' | 'location'>,
): string {
  const { googlePlaceId, name, location } = detail;
  const query = encodeURIComponent(name);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${googlePlaceId}&center=${location.lat},${location.lng}`;
}
