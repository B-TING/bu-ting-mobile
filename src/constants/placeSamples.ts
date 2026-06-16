import type { GooglePlaceDetailsResponse } from '../types/googlePlaces';
import { mapGooglePlaceDetailsResponse } from '../utils/googlePlacesMapper';

/**
 * Google Places API (New) 실제 응답 샘플 — 자갈치시장
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
  formattedAddress: '대한민국 부산광역시 중구 자갈치해안로 52',
  shortFormattedAddress: '중구 자갈치해안로 52',
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
      '월요일: 오전 9:00 ~ 오후 9:00',
      '화요일: 오전 9:00 ~ 오후 9:00',
      '수요일: 오전 9:00 ~ 오후 9:00',
      '목요일: 오전 9:00 ~ 오후 9:00',
      '금요일: 오전 9:00 ~ 오후 9:00',
      '토요일: 오전 9:00 ~ 오후 9:00',
      '일요일: 오전 9:00 ~ 오후 9:00',
    ],
    nextCloseTime: '2026-06-15T12:00:00Z',
  },
  businessStatus: 'OPERATIONAL',
  displayName: { text: '자갈치시장', languageCode: 'ko' },
  primaryType: 'market',
  primaryTypeDisplayName: { text: '시장', languageCode: 'ko-KR' },
  googleMapsTypeLabel: { text: '수산 시장', languageCode: 'ko-KR' },
  editorialSummary: {
    text: 'World famous market for fresh fish & seafood to take away or eat at the informal stalls.',
    languageCode: 'en',
  },
  reviews: [
    {
      name: 'places/ChIJudkrFArpaDURbbCzajeQs0c/reviews/sample-1',
      relativePublishTimeDescription: '2주 전',
      rating: 4,
      text: {
        text: '생선 활어, 해산물, 대게, 꼼장어 먹일게 참 많습니다.',
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
    administrativeArea: '부산광역시',
    locality: '중구',
    addressLines: ['자갈치해안로 52'],
  },
};

/** 자갈치시장 — 앱 PlaceDetailVO (internalPlaceId: tour_jagalchi) */
export function getJagalchiMarketPlaceDetail() {
  return mapGooglePlaceDetailsResponse(JAGALCHI_MARKET_GOOGLE_RESPONSE, {
    internalPlaceId: 'tour_jagalchi',
  });
}
