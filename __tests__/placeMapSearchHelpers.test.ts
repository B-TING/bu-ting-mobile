import {
  centersDifferBeyondThreshold,
  resolveFestivalDateRange,
} from '../src/utils/places/placeMapSearchHelpers';

jest.mock('../src/utils/places/festivalApiMapper', () => ({
  currentMonthDateRangeYyyymmdd: () => ({
    eventStartDate: '20260801',
    eventEndDate: '20260831',
  }),
  upcomingFestivalDateRangeYyyymmdd: () => ({
    eventStartDate: '20260810',
    eventEndDate: '20260910',
  }),
}));

describe('placeMapSearchHelpers', () => {
  describe('centersDifferBeyondThreshold', () => {
    const a = { lat: 35.1152, lng: 129.0422 };

    it('returns false when centers are within threshold', () => {
      const nearby = { lat: 35.1153, lng: 129.0423 };
      expect(centersDifferBeyondThreshold(a, nearby, 500)).toBe(false);
    });

    it('returns true when centers exceed threshold', () => {
      const far = { lat: 35.2, lng: 129.1 };
      expect(centersDifferBeyondThreshold(a, far, 500)).toBe(true);
    });
  });

  describe('resolveFestivalDateRange', () => {
    it('uses explicit festival dates from route params', () => {
      expect(
        resolveFestivalDateRange({
          festivalEventStartDate: '20260701',
          festivalEventEndDate: '20260715',
        }),
      ).toEqual({
        eventStartDate: '20260701',
        eventEndDate: '20260715',
      });
    });

    it('falls back end date to start when end is missing', () => {
      expect(
        resolveFestivalDateRange({
          festivalEventStartDate: '20260701',
        }),
      ).toEqual({
        eventStartDate: '20260701',
        eventEndDate: '20260701',
      });
    });

    it('uses upcoming range when selectedContentId is set', () => {
      expect(resolveFestivalDateRange({ selectedContentId: 'fest-1' })).toEqual({
        eventStartDate: '20260810',
        eventEndDate: '20260910',
      });
    });

    it('uses current month range by default', () => {
      expect(resolveFestivalDateRange(undefined)).toEqual({
        eventStartDate: '20260801',
        eventEndDate: '20260831',
      });
    });
  });
});
