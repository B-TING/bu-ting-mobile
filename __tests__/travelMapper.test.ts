import {
  TRAVEL_TITLE_MAX_LENGTH,
  buildTravelTitle,
  toTravelCreateRequest,
} from '../src/services/travel/travelMapper';
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
    expect(request.companionType).toBeNull();
    expect(request.travelStyle).toBeNull();
    expect(request.preferredFoods).toBeNull();
    expect(request.accommodationArea).toBeNull();
  });
});
