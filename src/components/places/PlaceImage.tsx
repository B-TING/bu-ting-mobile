import { useEffect, useState } from 'react';
import { Image, View, type ImageResizeMode } from 'react-native';

import { ICON_COLOR_MUTED, type LucideIconName } from '../../constants/icons';
import { cn } from '../../utils/common/cn';
import { AppIcon } from '../shared/icons/AppIcon';

type PlaceImageProps = {
  imageUrl?: string;
  className?: string;
  iconName?: LucideIconName;
  iconSize?: number;
  resizeMode?: ImageResizeMode;
};

export function PlaceImage({
  imageUrl,
  className,
  iconName = 'mapPin',
  iconSize = 22,
  resizeMode = 'cover',
}: PlaceImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden bg-brand-border',
        className,
      )}>
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          className="h-full w-full"
          resizeMode={resizeMode}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <AppIcon name={iconName} size={iconSize} color={ICON_COLOR_MUTED} strokeWidth={2} />
      )}
    </View>
  );
}
