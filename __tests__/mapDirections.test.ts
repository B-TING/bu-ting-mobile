import {
  buildGoogleMapsDirectionsAppUrl,
  buildGoogleMapsDirectionsWebUrl,
  buildKakaoMapDirectionsAppUrl,
  buildKakaoMapDirectionsWebUrl,
  buildLegDirectionsFallbackUrls,
  isLegDirectionsInputValid,
  isValidMapCoordinate,
} from '../src/utils/map/mapDirections';

const sampleLeg = {
  from: { lat: 35.1587, lng: 129.1604, name: '해운대' },
  to: { lat: 35.1796, lng: 129.0756, name: '서면' },
  mode: 'walk' as const,
};

describe('mapDirections', () => {
  it('validates coordinates', () => {
    expect(isValidMapCoordinate(35.1, 129.1)).toBe(true);
    expect(isValidMapCoordinate(0, 0)).toBe(false);
    expect(isValidMapCoordinate(Number.NaN, 129)).toBe(false);
  });

  it('validates leg input', () => {
    expect(isLegDirectionsInputValid(sampleLeg)).toBe(true);
    expect(
      isLegDirectionsInputValid({
        ...sampleLeg,
        to: { ...sampleLeg.to, lat: 0, lng: 0 },
      }),
    ).toBe(false);
  });

  it('builds Google app url with walking mode', () => {
    expect(buildGoogleMapsDirectionsAppUrl(sampleLeg)).toBe(
      'comgooglemaps://?saddr=35.1587%2C129.1604&daddr=35.1796%2C129.0756&directionsmode=walking',
    );
  });

  it('builds Google web url with transit mode', () => {
    const url = buildGoogleMapsDirectionsWebUrl({ ...sampleLeg, mode: 'transit' });
    expect(url).toContain('travelmode=transit');
    expect(url).toContain('origin=35.1587%2C129.1604');
    expect(url).toContain('destination=35.1796%2C129.0756');
  });

  it('builds Kakao app url with car mode', () => {
    expect(buildKakaoMapDirectionsAppUrl({ ...sampleLeg, mode: 'drive' })).toBe(
      'kakaomap://route?sp=35.1587%2C129.1604&ep=35.1796%2C129.0756&by=CAR',
    );
  });

  it('builds Kakao web url with encoded place names', () => {
    expect(buildKakaoMapDirectionsWebUrl(sampleLeg)).toBe(
      'https://map.kakao.com/link/route/%ED%95%B4%EC%9A%B4%EB%8C%80,35.1587,129.1604/%EC%84%9C%EB%A9%B4,35.1796,129.0756',
    );
  });

  it('returns fallback chain google-first', () => {
    const urls = buildLegDirectionsFallbackUrls(sampleLeg);
    expect(urls[0]).toContain('comgooglemaps://');
    expect(urls[1]).toContain('google.com/maps/dir');
    expect(urls[2]).toContain('kakaomap://');
    expect(urls[3]).toContain('map.kakao.com/link/route');
  });
});
