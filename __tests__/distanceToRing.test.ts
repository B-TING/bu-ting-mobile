import { distanceMetersToRing } from '../src/utils/geo/distanceToRing';

describe('distanceMetersToRing', () => {
  it('is ~0 for a vertex', () => {
    const ring = [
      { lat: 35.16, lng: 129.11 },
      { lat: 35.16, lng: 129.12 },
      { lat: 35.17, lng: 129.12 },
      { lat: 35.16, lng: 129.11 },
    ];
    expect(distanceMetersToRing({ lat: 35.16, lng: 129.11 }, ring)).toBeLessThan(1);
  });

  it('measures a point ~100m east of a north-south edge', () => {
    const ring = [
      { lat: 35.16, lng: 129.11 },
      { lat: 35.17, lng: 129.11 },
      { lat: 35.17, lng: 129.12 },
      { lat: 35.16, lng: 129.12 },
    ];
    const dist = distanceMetersToRing({ lat: 35.165, lng: 129.1111 }, ring);
    expect(dist).toBeGreaterThan(80);
    expect(dist).toBeLessThan(140);
  });
});
