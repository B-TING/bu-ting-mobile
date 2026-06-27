import type { GooglePlaceDetailsResponse } from '../../types/googlePlaces';
import { mapGooglePlaceDetailsResponse } from '../../utils/places/googlePlacesMapper';

/**
 * Google Places API (New) ?? ?? ?? ? ?????
 * placeId: ChIJudkrFArpaDURbbCzajeQs0c
 */
export const JAGALCHI_MARKET_GOOGLE_RESPONSE: GooglePlaceDetailsResponse = {
  name: 'places/ChIJudkrFArpaDURbbCzajeQs0c',
  id: 'ChIJudkrFArpaDURbbCzajeQs0c',
  types: [
    'tourist_attraction',
    'market',
    'food',
    'point_of_interest',
    'establishment',
  ],
  nationalPhoneNumber: '051-245-2594',
  internationalPhoneNumber: '+82 51-245-2594',
  formattedAddress: '???? ????? ?? ?????? 52',
  shortFormattedAddress: '?? ?????? 52',
  location: { latitude: 35.0966339, longitude: 129.0307965 },
  viewport: {
    low: { latitude: 35.0952849197085, longitude: 129.02944751970853 },
    high: { latitude: 35.0979828802915, longitude: 129.03214548029152 },
  },
  rating: 4,
  userRatingCount: 26975,
  googleMapsUri:
    'https://maps.google.com/?cid=5166631765211852909&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYASAA',
  websiteUri: 'http://jagalchimarket.bisco.or.kr/',
  regularOpeningHours: {
    openNow: true,
    weekdayDescriptions: [
      '???: ?? 9:00 ~ ?? 9:00',
      '???: ?? 9:00 ~ ?? 9:00',
      '???: ?? 9:00 ~ ?? 9:00',
      '???: ?? 9:00 ~ ?? 9:00',
      '???: ?? 9:00 ~ ?? 9:00',
      '???: ?? 9:00 ~ ?? 9:00',
      '???: ?? 9:00 ~ ?? 9:00',
    ],
    nextCloseTime: '2026-06-15T12:00:00Z',
  },
  businessStatus: 'OPERATIONAL',
  displayName: { text: '?????', languageCode: 'ko' },
  primaryType: 'market',
  primaryTypeDisplayName: { text: '??', languageCode: 'ko-KR' },
  googleMapsTypeLabel: { text: '?? ??', languageCode: 'ko-KR' },
  editorialSummary: {
    text: 'World famous market for fresh fish & seafood to take away or eat at the informal stalls.',
    languageCode: 'en',
  },
  reviews: [
    {
      name: 'places/ChIJudkrFArpaDURbbCzajeQs0c/reviews/sample-1',
      relativePublishTimeDescription: '2? ?',
      rating: 4,
      text: {
        text: '?? ??, ???, ??, ??? ??? ? ????.',
        languageCode: 'ko',
      },
      authorAttribution: {
        displayName: 'Junnn Y2',
        uri: 'https://www.google.com/maps/contrib/105686828208886330452/reviews',
      },
      publishTime: '2026-05-31T08:14:16.235878039Z',
    },
  ],
  photos: [
    {
      name: 'places/ChIJudkrFArpaDURbbCzajeQs0c/photos/sample-photo-1',
      widthPx: 4800,
      heightPx: 3199,
      authorAttributions: [{ displayName: 'Alayne Brigitte Sanchez' }],
    },
  ],
  restroom: true,
  delivery: true,
  paymentOptions: {
    acceptsCreditCards: true,
    acceptsDebitCards: true,
    acceptsCashOnly: false,
    acceptsNfc: true,
  },
  parkingOptions: { paidParkingLot: true },
  accessibilityOptions: {
    wheelchairAccessibleParking: true,
    wheelchairAccessibleEntrance: true,
    wheelchairAccessibleRestroom: true,
  },
  timeZone: { id: 'Asia/Seoul' },
  postalAddress: {
    regionCode: 'KR',
    languageCode: 'ko-KR',
    postalCode: '600-044',
    administrativeArea: '?????',
    locality: '??',
    addressLines: ['?????? 52'],
  },
};

/** ????? ? ? PlaceDetailVO (internalPlaceId: tour_jagalchi) */
export function getJagalchiMarketPlaceDetail() {
  return mapGooglePlaceDetailsResponse(JAGALCHI_MARKET_GOOGLE_RESPONSE, {
    internalPlaceId: 'tour_jagalchi',
  });
}
