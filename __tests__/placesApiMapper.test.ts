import {
  normalizeTourImageUrl,
  resolvePlaceDetailImageUrl,
} from '../src/utils/places/placesApiMapper';

describe('normalizeTourImageUrl', () => {
  it('upgrades visitkorea http to https', () => {
    expect(
      normalizeTourImageUrl(
        'http://tong.visitkorea.or.kr/cms/resource/61/2815961_image2_1.jpg',
      ),
    ).toBe('https://tong.visitkorea.or.kr/cms/resource/61/2815961_image2_1.jpg');
  });

  it('leaves https visitkorea unchanged', () => {
    const url = 'https://tong.visitkorea.or.kr/cms/resource/52/4044052_image2_1.jpg';
    expect(normalizeTourImageUrl(url)).toBe(url);
  });

  it('leaves non-tour http unchanged', () => {
    const url = 'http://example.com/photo.jpg';
    expect(normalizeTourImageUrl(url)).toBe(url);
  });
});

describe('resolvePlaceDetailImageUrl', () => {
  it('normalizes tour image fields to https', () => {
    expect(
      resolvePlaceDetailImageUrl({
        imageUrl: 'http://tong.visitkorea.or.kr/cms/resource/37/3049537_image2_1.JPG',
      }),
    ).toBe('https://tong.visitkorea.or.kr/cms/resource/37/3049537_image2_1.JPG');
  });
});
