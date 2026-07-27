import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { BRAND_ICON } from '../../../constants/common/brandAssets';

type BrandIconProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function BrandIcon({
  size = 32,
  style,
  accessibilityLabel = 'BU-TING',
}: BrandIconProps) {
  return (
    <Image
      source={BRAND_ICON}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}
