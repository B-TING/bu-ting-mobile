import {
  TRAVEL_TITLE_MAX_LENGTH,
  buildTravelTitle,
  toAiSchedulePace,
  toAiTravelPlanGenerateRequest,
  toTravelCreateRequest,
} from '../src/services/travel/travelMapper';
import type { PlanWizardAnswers } from '../src/types/planWizard';
import type { ManualTravelInput } from '../src/types/travelApi';

const baseInput = (): ManualTravelInput => ({
  title: '',
  startDate: '2026-08-23',
  endDate: '2026-08-24',
  companionCount: 2,
  companionTypes: ['friends'],
  hasHeavyBaggage: false,
  hasPets: false,
  travelStyleIds: ['culture'],
  foodIds: ['seafood'],
  accommodationAreaIds: [],
  accommodationName: '아난티 힐튼 부산 기장 (Ananti Hilton Busan Gijang)',
  selectedAttractions: [],
});

describe('buildTravelTitle', () => {
  it('falls back to a short default title', () => {
    expect(buildTravelTitle()).toBe('부산 여행');
    expect(buildTravelTitle('   ')).toBe('부산 여행');
  });

  it('uses the first attraction name, not the hotel name', () => {
    expect(buildTravelTitle('감천문화마을')).toBe('감천문화마을 여행');
  });

  it('clips titles that exceed the API limit', () => {
    const longName = '가'.repeat(TRAVEL_TITLE_MAX_LENGTH + 12);
    const title = buildTravelTitle(longName);
    expect(title.length).toBeLessThanOrEqual(TRAVEL_TITLE_MAX_LENGTH);
  });
});

describe('toTravelCreateRequest', () => {
  it('uses the user-written title', () => {
    const request = toTravelCreateRequest({
      ...baseInput(),
      title: '  해운대 주말 여행  ',
      accommodationName: '아난티 힐튼 부산 기장 (Ananti Hilton Busan Gijang)',
    });

    expect(request.title).toBe('해운대 주말 여행');
    expect(request.destination).toBe('부산');
  });

  it('clips a user-written title to 15 characters', () => {
    const longTitle = '가나다라마바사아자차카타파하가';
    const request = toTravelCreateRequest({
      ...baseInput(),
      title: longTitle,
    });

    expect(request.title).toBe(longTitle.slice(0, TRAVEL_TITLE_MAX_LENGTH));
    expect(request.title).toHaveLength(TRAVEL_TITLE_MAX_LENGTH);
  });

  it('omits optional fields that were not selected', () => {
    const request = toTravelCreateRequest({
      ...baseInput(),
      title: '   ',
      companionTypes: [],
      travelStyleIds: [],
      foodIds: [],
      accommodationAreaIds: [],
      selectedAttractions: [
        {
          placeId: '12',
          placeName: '해운대해수욕장',
          location: { lat: 35.15, lng: 129.16 },
        },
      ],
    });

    expect(request.title).toBeNull();
    expect(request.destination).toBe('부산');
    expect(request.companionType).toBeNull();
    expect(request.travelStyle).toBeNull();
    expect(request.preferredFoods).toBeNull();
    expect(request.accommodationArea).toBeNull();
  });
});

const baseAnswers = (): PlanWizardAnswers => ({
  title: '해운대 주말',
  startDate: '2026-08-23',
  endDate: '2026-08-24',
  companionCount: 2,
  companionTypes: ['friends'],
  travelStyleIds: ['nature', 'food'],
  hasHeavyBaggage: false,
  hasPets: false,
  otherConstraintIds: [],
  attractionIds: ['126081'],
  selectedAttractions: [
    {
      placeId: '126081',
      placeName: '해동용궁사',
      location: { lat: 35.1882, lng: 129.2232 },
      address: '부산 기장군 기장읍 용궁길 86',
    },
  ],
  foodIds: ['milmyeon', 'dwaeji'],
  accommodationMode: 'area_only',
  accommodationPlaceId: null,
  accommodationName: null,
  bookedAccommodation: null,
  accommodationAreaIds: ['haeundae'],
  generationMode: 'auto',
});

describe('toAiTravelPlanGenerateRequest', () => {
  it('maps wizard places to GOOGLE providerPlaceId', () => {
    const request = toAiTravelPlanGenerateRequest(baseAnswers(), {
      schedulePace: 'relaxed',
    });

    expect(request.selectedPlaces).toEqual([
      {
        provider: 'GOOGLE',
        providerPlaceId: '126081',
        placeName: '해동용궁사',
        latitude: 35.1882,
        longitude: 129.2232,
        type: 'TOURIST_SPOT',
        address: '부산 기장군 기장읍 용궁길 86',
      },
    ]);
    expect(request.schedulePace).toBe('RELAXED');
    expect(request.foodIds).toEqual(['milmyeon', 'dwaeji']);
    expect(request.purposes).toEqual(['자연·힐링', '미식·맛집']);
    expect(request.accommodationAreaIds).toEqual(['haeundae']);
    expect(request.bookedAccommodation).toBeUndefined();
  });

  it('fills missing address with the place name', () => {
    const request = toAiTravelPlanGenerateRequest({
      ...baseAnswers(),
      selectedAttractions: [
        {
          placeId: '12',
          placeName: '해운대해수욕장',
          location: { lat: 35.15, lng: 129.16 },
        },
      ],
    });

    expect(request.selectedPlaces[0]?.address).toBe('해운대해수욕장');
  });

  it('sends booked stay as a hotel name string', () => {
    const request = toAiTravelPlanGenerateRequest({
      ...baseAnswers(),
      accommodationMode: 'booked',
      accommodationName: '해운대 호텔',
      bookedAccommodation: {
        placeId: 'stay_1',
        placeName: '해운대 호텔',
        location: { lat: 35.15, lng: 129.16 },
      },
      accommodationAreaIds: ['haeundae'],
    });

    expect(request.bookedAccommodation).toBe('해운대 호텔');
    expect(request.accommodationAreaIds).toBeUndefined();
  });
});

describe('toAiSchedulePace', () => {
  it('maps onboarding pace to the AI enum', () => {
    expect(toAiSchedulePace('relaxed')).toBe('RELAXED');
    expect(toAiSchedulePace('packed')).toBe('TIGHT');
    expect(toAiSchedulePace(null)).toBe('BALANCED');
  });
});
