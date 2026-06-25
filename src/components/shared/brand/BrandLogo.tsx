import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { BRAND_LOGO } from '../../../constants/common/brandAssets';

type BrandLogoProps = {
  height?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function BrandLogo({
  height = 28,
  style,
  accessibilityLabel = 'BU-TING',
}: BrandLogoProps) {
  return (
    <Image
      source={BRAND_LOGO}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={[{ height, width: height * 3.4 }, style]}
    />
  );
}
