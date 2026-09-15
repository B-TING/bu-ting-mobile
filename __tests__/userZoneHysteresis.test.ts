import {
  confirmUserZone,
  peekCommittedUserZone,
  resetUserZoneHysteresis,
} from '../src/utils/eventZone/userZoneHysteresis';

describe('confirmUserZone', () => {
  beforeEach(() => {
    resetUserZoneHysteresis();
  });

  it('commits the first sample immediately', () => {
    expect(confirmUserZone('SUYEONG_NAMGU', 'a')).toBe('SUYEONG_NAMGU');
    expect(peekCommittedUserZone()).toBe('SUYEONG_NAMGU');
  });

  it('holds the previous zone until a switch is seen twice', () => {
    confirmUserZone('SUYEONG_NAMGU', '1');
    expect(confirmUserZone('CENTRAL_NORTH', '2')).toBe('SUYEONG_NAMGU');
    expect(confirmUserZone('CENTRAL_NORTH', '3')).toBe('CENTRAL_NORTH');
  });

  it('does not double-count the same sample key', () => {
    confirmUserZone('SUYEONG_NAMGU', '1');
    expect(confirmUserZone('CENTRAL_NORTH', '2')).toBe('SUYEONG_NAMGU');
    expect(confirmUserZone('CENTRAL_NORTH', '2')).toBe('SUYEONG_NAMGU');
    expect(confirmUserZone('CENTRAL_NORTH', '3')).toBe('CENTRAL_NORTH');
  });

  it('requires two misses before leaving a zone', () => {
    confirmUserZone('SUYEONG_NAMGU', '1');
    expect(confirmUserZone(null, '2')).toBe('SUYEONG_NAMGU');
    expect(confirmUserZone(null, '3')).toBeNull();
  });
});
