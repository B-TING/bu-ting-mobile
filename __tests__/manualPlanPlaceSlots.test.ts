import { buildManualPlanPlaceSlots } from '../src/utils/plan/manualPlanPlaceSlots';
import type { WizardPickedPlace } from '../src/types/planWizard';

const attraction = (
  id: string,
  name: string,
): WizardPickedPlace => ({
  placeId: id,
  placeName: name,
  location: { lat: 35.15, lng: 129.16 },
});

const stay: WizardPickedPlace = {
  placeId: 'stay-1',
  placeName: '해운대 호텔',
  location: { lat: 35.16, lng: 129.16 },
  address: '부산 해운대구',
};

describe('buildManualPlanPlaceSlots', () => {
  it('puts all selected attractions on day 1', () => {
    const slots = buildManualPlanPlaceSlots(
      {
        selectedAttractions: [
          attraction('a1', '해운대해수욕장'),
          attraction('a2', '광안리'),
        ],
        bookedAccommodation: null,
        accommodationMode: 'area_only',
      },
      3,
    );

    expect(slots).toHaveLength(3);
    expect(slots[0].map(item => item.place.placeId)).toEqual(['a1', 'a2']);
    expect(slots[1]).toEqual([]);
    expect(slots[2]).toEqual([]);
  });

  it('assigns booked stay as the first place on every day', () => {
    const slots = buildManualPlanPlaceSlots(
      {
        selectedAttractions: [attraction('a1', '해운대해수욕장')],
        bookedAccommodation: stay,
        accommodationMode: 'booked',
      },
      2,
    );

    expect(slots[0].map(item => item.place.placeId)).toEqual(['stay-1', 'a1']);
    expect(slots[0][0].type).toBe('ACCOMMODATION');
    expect(slots[0][1].type).toBe('ATTRACTION');
    expect(slots[1].map(item => item.place.placeId)).toEqual(['stay-1']);
    expect(slots[1][0].type).toBe('ACCOMMODATION');
  });

  it('does not add a stay slot for area-only accommodation', () => {
    const slots = buildManualPlanPlaceSlots(
      {
        selectedAttractions: [],
        bookedAccommodation: stay,
        accommodationMode: 'area_only',
      },
      2,
    );

    expect(slots).toEqual([[], []]);
  });

  it('returns empty days when nothing is selected', () => {
    expect(
      buildManualPlanPlaceSlots(
        {
          selectedAttractions: [],
          bookedAccommodation: null,
          accommodationMode: 'booked',
        },
        2,
      ),
    ).toEqual([[], []]);
  });
});
